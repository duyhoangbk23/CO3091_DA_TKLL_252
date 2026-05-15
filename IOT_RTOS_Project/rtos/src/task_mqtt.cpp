#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "tasks.h"
#include "global.h"
//#include "config.h"
#include "mqtt_topics.h" // Topic + broker contract chung với backend (data_format.json)
#include "Pins.h"        // DEVICE_ID — khớp device_id khi gọi POST /api/control
#include "MqttCommand.h"

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
void mqtt_callback(char* topic, byte* payload, unsigned int length) {
    char cmd[512] = {0};
    const size_t copyLen = length >= sizeof(cmd) ? sizeof(cmd) - 1 : length;
    memcpy(cmd, payload, copyLen);
    cmd[copyLen] = '\0';
 
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
    mqttClient.setBufferSize(1024);
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    mqttClient.setCallback(mqtt_callback);
 
    SensorData_t localData;
    char msg[1024];
 
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
                    IaqState iaq;
                    RuntimeControl_t runtime;
                    iaq = g_iaq;
                    runtime = g_RuntimeControl;

                    StaticJsonDocument<1024> doc;
                    doc["device_id"] = DEVICE_ID;
                    if (isnan(localData.temperature)) doc["temperature"] = nullptr;
                    else doc["temperature"] = localData.temperature;
                    if (isnan(localData.humidity)) doc["humidity"] = nullptr;
                    else doc["humidity"] = localData.humidity;
                    doc["pm25"] = localData.pm25 >= 0 ? localData.pm25 : -1;
                    doc["co2"] = localData.co2 != 0xFFFF ? localData.co2 : 0xFFFF;
                    doc["voc"] = localData.voc;
                    doc["alert_level"] = localData.alert_level;
                    doc["timestamp"] = localData.timestamp;
                    doc["uptime_ms"] = millis();
                    doc["auto_control_enabled"] = runtime.auto_control_enabled;
                    doc["config_version"] = runtime.config_version;
                    JsonObject health = doc.createNestedObject("sensor_health");
                    health["co2"] = iaq.validCO2 ? "OK" : "MISSING";
                    health["pm"] = iaq.validPM ? "OK" : "MISSING";
                    health["voc"] = iaq.validVOC ? "OK" : "OK";
                    health["temp"] = iaq.validTempRH ? "OK" : "NAN";
                    health["rh"] = iaq.validTempRH ? "OK" : "NAN";
                    JsonObject alerts = doc.createNestedObject("alerts");
                    alerts["co2"] = iaq.alarmCO2;
                    alerts["pm"] = iaq.alarmPM;
                    alerts["voc"] = iaq.alarmVOC;
                    alerts["temp"] = iaq.alarmTemp;
                    alerts["rh"] = iaq.alarmRH;
                    JsonObject devices = doc.createNestedObject("devices");
                    devices["hepa"] = iaq.wantHepa;
                    devices["vent"] = iaq.wantVent;
                    devices["carbon"] = iaq.wantCarbon;
                    devices["ac"] = iaq.wantAc;
                    devices["humid"] = iaq.wantHumid;
                    serializeJson(doc, msg, sizeof(msg));
 
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
        vTaskDelay(pdMS_TO_TICKS(2000));
    }
}
