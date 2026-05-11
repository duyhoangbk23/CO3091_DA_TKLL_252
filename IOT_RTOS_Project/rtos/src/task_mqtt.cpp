#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "tasks.h"
#include "global.h"
#include "config.h"

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

static void normalizeControlPayload(byte* payload, unsigned int length, char* cmd, size_t cmdSize) {
    char raw[128] = {0};
    int len = (length >= sizeof(raw)) ? sizeof(raw) - 1 : length;
    memcpy(raw, payload, len);

    StaticJsonDocument<128> doc;
    DeserializationError error = deserializeJson(doc, raw);
    if (!error) {
        const char* jsonCmd = doc["command"] | "";
        const char* ledState = doc["led"] | "";

        if (strlen(jsonCmd) > 0) {
            strncpy(cmd, jsonCmd, cmdSize - 1);
        } else if (strcmp(ledState, "ON") == 0) {
            strncpy(cmd, "LED_ON", cmdSize - 1);
        } else if (strcmp(ledState, "OFF") == 0) {
            strncpy(cmd, "LED_OFF", cmdSize - 1);
        }
        return;
    }

    strncpy(cmd, raw, cmdSize - 1);
}

void mqtt_callback(char* topic, byte* payload, unsigned int length) {
    char cmd[20] = {0};
    normalizeControlPayload(payload, length, cmd, sizeof(cmd));

    Serial.printf("[MQTT] Tin nhan den topic %s: %s\n", topic, cmd);

    if (cmd[0] == '\0') {
        Serial.println("[MQTT] Lenh rong hoac sai format!");
        return;
    }

    if (xQueueSend(xControlQueue, cmd, 0) != pdPASS) {
        Serial.println("[MQTT] Control Queue full!");
    }
}

void mqtt_reconnect() {
    if (WiFi.status() != WL_CONNECTED) return;

    while (!mqttClient.connected()) {
        Serial.print("[MQTT] Dang ket noi lai...");
        String clientId = "ESP32_Danh_" + String(random(0xffff), HEX);

        if (mqttClient.connect(clientId.c_str())) {
            Serial.println("Thanh cong!");
            mqttClient.subscribe(MQTT_TOPIC_COMMAND);
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
    char msg[192];

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

                if (localData.temperature != 0) {
                    snprintf(
                        msg,
                        sizeof(msg),
                        "{\"device_id\":\"%s\",\"temperature\":%.2f,\"humidity\":%.2f,\"air_quality\":%d,\"alert_level\":%d,\"timestamp_ms\":%lld}",
                        DEVICE_ID,
                        localData.temperature,
                        localData.humidity,
                        localData.air_quality,
                        localData.alert_level,
                        localData.timestamp
                    );

                    mqttClient.publish(MQTT_TOPIC_PUBLISH, msg);
                }
            }
        }

        vTaskDelay(pdMS_TO_TICKS(10000));
    }
}
