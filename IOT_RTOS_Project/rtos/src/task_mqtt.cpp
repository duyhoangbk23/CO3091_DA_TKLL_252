#include <WiFi.h>
#include <PubSubClient.h>
#include "tasks.h"
#include "global.h"
#include "config.h"

void connectWiFi() {
    if (WiFi.status() == WL_CONNECTED) return;
    Serial.println("[WiFi] Đang kết nối...");
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    
    int retry = 0;
    while (WiFi.status() != WL_CONNECTED && retry < 20) {
        vTaskDelay(pdMS_TO_TICKS(500));
        Serial.print(".");
        retry++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[WiFi] Đã kết nối! IP:" + WiFi.localIP().toString());
    }
}

// 1. Hàm Callback: Chỉ làm nhiệm vụ nhận tin và đẩy vào Queue
void mqtt_callback(char* topic, byte* payload, unsigned int length) {
    char cmd[20] = {0};
    int len = (length > 19) ? 19 : length;
    memcpy(cmd, payload, len);

    Serial.printf("[MQTT] Tin nhan den: %s\n", cmd);

    // Đẩy lệnh vào Queue để Task_Control xử lý (Cách chuyên nghiệp)
    if (xQueueSend(xControlQueue, &cmd, 0) != pdPASS) {
        Serial.println("[MQTT] Control Queue full!");
    }
}

// 2. Hàm Reconnect
void mqtt_reconnect() {
    if (WiFi.status() != WL_CONNECTED) return;

    while (!mqttClient.connected()) {
        Serial.print("[MQTT] Dang ket noi lai...");
        String clientId = "ESP32_Danh_" + String(random(0xffff), HEX);

        if (mqttClient.connect(clientId.c_str())) {
            Serial.println("Thành công!");
            mqttClient.subscribe(MQTT_TOPIC_COMMAND);
        } else {
            Serial.printf("Thất bại, rc=%d - Thu lai sau 5s\n", mqttClient.state());
            vTaskDelay(pdMS_TO_TICKS(5000));
        }
    }
}

// 3. Task chính
void vTaskMQTT(void *pvParameters) {
    // SỬA LỖI: Thêm MQTT_SERVER vào đây
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    mqttClient.setCallback(mqtt_callback);

    SensorData_t localData;
    char msg[128];

    for (;;) {
        if (WiFi.status() != WL_CONNECTED) {
            connectWiFi();
        } else {
            if (!mqttClient.connected()) {
                mqtt_reconnect();
            }
            
            mqttClient.loop();

            // Lấy dữ liệu an toàn để gửi lên Dashboard
            if (xSemaphoreTake(xDataMutex, pdMS_TO_TICKS(100)) == pdPASS) {
                localData = g_LatestData;
                xSemaphoreGive(xDataMutex);
                
                if (localData.temperature != 0) {
                    snprintf(msg, 128, "{\"temp\":%.2f, \"humi\":%.2f, \"aqi\":%d, \"alert\":%d, \"ts\":%lld}", 
                             localData.temperature, localData.humidity, 
                             localData.air_quality, localData.alert_level,
                             localData.timestamp);
                    
                    mqttClient.publish(MQTT_TOPIC_PUBLISH, msg);
                }
            }
        }
        // Gửi dữ liệu định kỳ mỗi 10 giây
        vTaskDelay(pdMS_TO_TICKS(10000));
    }
}