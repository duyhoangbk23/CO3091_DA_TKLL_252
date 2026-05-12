#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "tasks.h"
#include "global.h"
//#include "config.h"
#include "mqtt_topics.h" // Topic + broker contract chung với backend (data_format.json)
#include "Pins.h"        // DEVICE_ID — khớp device_id khi gọi POST /api/control

void connectWiFi() {
    if (WiFi.status() == WL_CONNECTED) return;

    Serial.println("[WiFi] Dang ket noi...");
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    int retry = 0;
    while (WiFi.status() != WL_CONNECTED && retry < 20) {
        vTaskDelay(pdMS_TO_TICKS(500));
        Serial.print(".");
        retry++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[WiFi] Da ket noi! IP:" + WiFi.localIP().toString());
    }
}

// Hàm chuẩn hóa lệnh điều khiển từ Backend
static void normalizeControlPayload(byte* payload, unsigned int length, char* cmd, size_t cmdSize) {
    char raw[128] = {0};
    int len = (length >= sizeof(raw)) ? sizeof(raw) - 1 : length;
    memcpy(raw, payload, len);

    StaticJsonDocument<128> doc;
    DeserializationError error = deserializeJson(doc, raw);
    
    // JSON: backend gửi { device_id, command, timestamp } — chỉ thực thi đúng thiết bị
    if (!error) {
        const char* did = doc["device_id"] | "";
        if (strlen(did) > 0 && strcmp(did, DEVICE_ID) != 0) {
            cmd[0] = '\0';
            return;
        }
        const char* jsonCmd = doc["command"] | "";
        if (strlen(jsonCmd) > 0) {
            strncpy(cmd, jsonCmd, cmdSize - 1);
            cmd[cmdSize - 1] = '\0';
            return;
        }
        cmd[0] = '\0';
        return;
    }
    
    // Nếu không phải JSON hoặc không có trường command, lấy nội dung thô
    strncpy(cmd, raw, cmdSize - 1);
}

void mqtt_callback(char* topic, byte* payload, unsigned int length) {
    char cmd[20] = {0};
    normalizeControlPayload(payload, length, cmd, sizeof(cmd));

    Serial.printf("[MQTT] Lenh den: %s\n", cmd);

    if (cmd[0] != '\0') {
        // Gửi lệnh vào Queue để Task_Control xử lý
        if (xQueueSend(xControlQueue, cmd, 0) != pdPASS) {
            Serial.println("[MQTT] Control Queue full!");
        }
    }
}

void mqtt_reconnect() {
    if (WiFi.status() != WL_CONNECTED) return;

    while (!mqttClient.connected()) {
        Serial.print("[MQTT] Dang ket noi lai...");
        String clientId = "ESP32_Danh_" + String(random(0xffff), HEX);

        if (mqttClient.connect(clientId.c_str())) {
            Serial.println("Thanh cong!");
            mqttClient.subscribe(MQTT_TOPIC_DEVICE_CONTROL, 1);
        } else {
            Serial.printf("That bai, rc=%d - Thu lai sau 5s\n", mqttClient.state());
            vTaskDelay(pdMS_TO_TICKS(5000));
        }
    }
}

void vTaskMQTT(void *pvParameters) {
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    mqttClient.setCallback(mqtt_callback);

    SensorData_t localData;
    char msg[256]; // Tăng buffer để chứa chuỗi JSON chi tiết hơn

    for (;;) {
        if (WiFi.status() != WL_CONNECTED) {
            connectWiFi();
        } else {
            if (!mqttClient.connected()) {
                mqtt_reconnect();
            }

            mqttClient.loop();

            // Lấy dữ liệu an toàn từ Mutex để gửi định kỳ
            if (xSemaphoreTake(xDataMutex, pdMS_TO_TICKS(100)) == pdPASS) {
                localData = g_LatestData;
                xSemaphoreGive(xDataMutex);

                // Chỉ gửi khi có dữ liệu hợp lệ (tránh gửi rác lúc mới khởi động)
                if (localData.timestamp > 0) {
                    // Đóng gói JSON khớp 100% với sensor_data_payload trong hợp đồng
                    const char* did = (localData.device_id[0] != '\0') ? localData.device_id : DEVICE_ID;
                    snprintf(
                        msg,
                        sizeof(msg),
                        "{\"device_id\":\"%s\",\"temperature\":%.2f,\"humidity\":%.2f,\"pm25\":%d,\"co2\":%d,\"voc\":%d,\"alert_level\":%d,\"timestamp\":%lld}",
                        did,
                        localData.temperature,
                        localData.humidity,
                        (int)localData.pm25,
                        (int)localData.co2,
                        (int)localData.voc,
                        (int)localData.alert_level,
                        (long long)localData.timestamp
                    );

                    mqttClient.publish(MQTT_TOPIC_SENSOR_DATA, msg);
                }
            }
        }
        // Gửi dữ liệu định kỳ mỗi 10 giây theo hợp đồng
        vTaskDelay(pdMS_TO_TICKS(10000));
    }
}