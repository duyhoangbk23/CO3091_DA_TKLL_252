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
    Serial.printf("[WiFi] SSID: %s\n", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
 
    int retry = 0;
    while (WiFi.status() != WL_CONNECTED && retry < 20) {
        vTaskDelay(pdMS_TO_TICKS(500));
        Serial.print(".");
        retry++;
    }
 
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[WiFi] Da ket noi!");
        Serial.printf("[WiFi] IP: %s\n", WiFi.localIP().toString().c_str());
        Serial.printf("[WiFi] MAC: %s\n", WiFi.macAddress().c_str());
        Serial.printf("[WiFi] RSSI: %d dBm\n", WiFi.RSSI());
    } else {
        Serial.println("\n[WiFi] Ket noi that bai sau 20 lan thu!");
    }
}
 
// Hàm chuẩn hóa lệnh điều khiển từ Backend
static void normalizeControlPayload(byte* payload, unsigned int length, char* cmd, size_t cmdSize) {
    char raw[128] = {0};
    int len = (length >= sizeof(raw)) ? sizeof(raw) - 1 : length;
    memcpy(raw, payload, len);
 
    StaticJsonDocument<128> doc;
    DeserializationError error = deserializeJson(doc, raw);
    
    if (!error) {
        const char* jsonCmd = doc["command"] | "";
        if (strlen(jsonCmd) > 0) {
            strncpy(cmd, jsonCmd, cmdSize - 1);
            return;
        }
    }
    
    strncpy(cmd, raw, cmdSize - 1);
}
 
void mqtt_callback(char* topic, byte* payload, unsigned int length) {
    char cmd[20] = {0};
    normalizeControlPayload(payload, length, cmd, sizeof(cmd));
 
    Serial.printf("[MQTT] <<< Lenh den topic [%s]: %s\n", topic, cmd);
 
    if (cmd[0] != '\0') {
        if (xQueueSend(xControlQueue, cmd, 0) != pdPASS) {
            Serial.println("[MQTT] Control Queue full!");
        }
    }
}
 
void mqtt_reconnect() {
    if (WiFi.status() != WL_CONNECTED) return;
 
    // Dùng MAC address để tạo clientId unique, tránh conflict
    String mac = WiFi.macAddress();
    mac.replace(":", "");
    String clientId = String(DEVICE_ID);
 
    Serial.printf("[MQTT] Client ID: %s\n", clientId.c_str());
    Serial.printf("[MQTT] Server: %s:%d\n", MQTT_SERVER, MQTT_PORT);
 
    while (!mqttClient.connected()) {
        Serial.print("[MQTT] Dang ket noi...");
 
        if (mqttClient.connect(clientId.c_str())) {
            Serial.println(" Thanh cong!");
            Serial.printf("[MQTT] Subscribe topic: %s\n", MQTT_TOPIC_DEVICE_CONTROL);
            mqttClient.subscribe(MQTT_TOPIC_DEVICE_CONTROL);
        } else {
            Serial.printf(" That bai! rc=%d\n", mqttClient.state());
            Serial.println("[MQTT] Thu lai sau 5s...");
            vTaskDelay(pdMS_TO_TICKS(5000));
        }
    }
}
 
void vTaskMQTT(void *pvParameters) {
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    mqttClient.setCallback(mqtt_callback);
 
    SensorData_t localData;
    char msg[256];
 
    for (;;) {
        if (WiFi.status() != WL_CONNECTED) {
            connectWiFi();
        } else {
            if (!mqttClient.connected()) {
                mqtt_reconnect();
            }
 
            mqttClient.loop();
 
            if (xSemaphoreTake(xDataMutex, pdMS_TO_TICKS(100)) == pdPASS) {
                localData = g_LatestData;
                xSemaphoreGive(xDataMutex);
 
                if (localData.timestamp > 0) {
                    snprintf(
                        msg,
                        sizeof(msg),
                        "{\"device_id\":\"%s\",\"temperature\":%.2f,\"humidity\":%.2f,\"pm25\":%d,\"co2\":%d,\"voc\":%d,\"alert_level\":%d,\"timestamp\":%lld}",
                        DEVICE_ID,
                        localData.temperature,
                        localData.humidity,
                        localData.pm25,
                        localData.co2,
                        localData.voc,
                        localData.alert_level,
                        localData.timestamp
                    );
 
                    // In dữ liệu ra terminal trước khi gửi
                    Serial.println("[SENSOR] Du lieu doc duoc:");
                    Serial.printf("  Nhiet do  : %.2f C\n", localData.temperature);
                    Serial.printf("  Do am     : %.2f %%\n", localData.humidity);
                    Serial.printf("  PM2.5     : %d ug/m3\n", localData.pm25);
                    Serial.printf("  CO2       : %d ppm\n", localData.co2);
                    Serial.printf("  VOC       : %d\n", localData.voc);
                    Serial.printf("  Alert     : %d\n", localData.alert_level);
                    Serial.printf("  Timestamp : %lld\n", localData.timestamp);
 
                    // Publish và thông báo kết quả
                    if (mqttClient.publish(MQTT_TOPIC_SENSOR_DATA, msg)) {
                        Serial.printf("[MQTT] >>> Gui len server THANH CONG! Topic: %s\n", MQTT_TOPIC_SENSOR_DATA);
                    } else {
                        Serial.println("[MQTT] >>> Gui len server THAT BAI!");
                    }
                } else {
                    Serial.println("[MQTT] Cho du lieu tu sensor...");
                }
            }
        }
        vTaskDelay(pdMS_TO_TICKS(10000));
    }
}