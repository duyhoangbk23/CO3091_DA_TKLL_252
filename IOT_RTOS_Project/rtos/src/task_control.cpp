#include <Arduino.h>
#include "tasks.h"
#include "global.h"
#include "config.h"

// Ham phu: Nhap nhay mot LED bat ky voi so lan va toc do tuy chinh
static void blinkLED(uint8_t pin, int times, int delay_ms) {
    for (int i = 0; i < times; i++) {
        digitalWrite(pin, HIGH);
        vTaskDelay(pdMS_TO_TICKS(delay_ms));
        digitalWrite(pin, LOW);
        vTaskDelay(pdMS_TO_TICKS(delay_ms));
    }
}

// Ham phu: Gui bao cao trang thai len MQTT ngay lap tuc
static void publishStatusReport() {
    SensorData_t localData;

    // Doc du lieu an toan qua Mutex
    if (xSemaphoreTake(xDataMutex, pdMS_TO_TICKS(100)) == pdPASS) {
        localData = g_LatestData;
        xSemaphoreGive(xDataMutex);
    } else {
        Serial.println("[Control] Mutex timeout, khong the doc du lieu.");
        return;
    }

    char report[160];
    snprintf(report, sizeof(report),
        "{\"type\":\"status_report\", \"temp\":%.2f, \"humi\":%.2f, \"aqi\":%d, \"alert\":%d, \"ts\":%lld}",
        localData.temperature,
        localData.humidity,
        localData.air_quality,
        localData.alert_level,
        localData.timestamp
    );

    if (mqttClient.connected()) {
        mqttClient.publish("hcmut/danh/status", report);
        Serial.println("[Control] Da gui bao cao trang thai len MQTT.");
    } else {
        Serial.println("[Control] MQTT chua ket noi, khong the gui bao cao.");
    }
}

void vTaskControl(void *pvParameters) {
    char receivedCmd[20];

    for (;;) {
        // Task se "ngu" o day cho den khi co lenh moi tu Queue
        if (xQueueReceive(xControlQueue, &receivedCmd, portMAX_DELAY) == pdPASS) {
            Serial.printf("[Control] Da nhan lenh tu Dashboard: %s\n", receivedCmd);

            // 1. Lenh tat coi bao dong khan cap
            if (strcmp(receivedCmd, "MUTE_ALARM") == 0) {
                digitalWrite(BUZZER_PIN, LOW);
                Serial.println(" -> Da ngat coi bao dong.");
            }

            // 2. Lenh kiem tra he thong (Bat LED test)
            else if (strcmp(receivedCmd, "TEST_LED") == 0) {
                digitalWrite(LED_GREEN, HIGH);
                vTaskDelay(pdMS_TO_TICKS(1000));
                digitalWrite(LED_GREEN, LOW);
            }

            // 3. Lenh Reset thiet bi
            else if (strcmp(receivedCmd, "REBOOT") == 0) {
                Serial.println(" -> Dang khoi dong lai...");
                vTaskDelay(pdMS_TO_TICKS(500));
                ESP.restart();
            }

            // 4. Dieu khien LED: bat LED theo mau chi dinh
            //    Lenh: "LED_RED_ON", "LED_YLW_ON", "LED_GRN_ON"
            //          "LED_RED_OFF", "LED_YLW_OFF", "LED_GRN_OFF"
            else if (strcmp(receivedCmd, "LED_RED_ON") == 0) {
                digitalWrite(LED_RED, HIGH);
                Serial.println(" -> LED Do: BAT.");
            }
            else if (strcmp(receivedCmd, "LED_RED_OFF") == 0) {
                digitalWrite(LED_RED, LOW);
                Serial.println(" -> LED Do: TAT.");
            }
            else if (strcmp(receivedCmd, "LED_YLW_ON") == 0) {
                digitalWrite(LED_YELLOW, HIGH);
                Serial.println(" -> LED Vang: BAT.");
            }
            else if (strcmp(receivedCmd, "LED_YLW_OFF") == 0) {
                digitalWrite(LED_YELLOW, LOW);
                Serial.println(" -> LED Vang: TAT.");
            }
            else if (strcmp(receivedCmd, "LED_GRN_ON") == 0) {
                digitalWrite(LED_GREEN, HIGH);
                Serial.println(" -> LED Xanh: BAT.");
            }
            else if (strcmp(receivedCmd, "LED_GRN_OFF") == 0) {
                digitalWrite(LED_GREEN, LOW);
                Serial.println(" -> LED Xanh: TAT.");
            }

            // 5. Dieu khien LED: nhap nhay theo mau chi dinh (5 lan, 200ms)
            //    Lenh: "BLINK_RED", "BLINK_YLW", "BLINK_GRN"
            else if (strcmp(receivedCmd, "BLINK_RED") == 0) {
                Serial.println(" -> Nhap nhay LED Do...");
                blinkLED(LED_RED, 5, 200);
            }
            else if (strcmp(receivedCmd, "BLINK_YLW") == 0) {
                Serial.println(" -> Nhap nhay LED Vang...");
                blinkLED(LED_YELLOW, 5, 200);
            }
            else if (strcmp(receivedCmd, "BLINK_GRN") == 0) {
                Serial.println(" -> Nhap nhay LED Xanh...");
                blinkLED(LED_GREEN, 5, 200);
            }

            // 6. Gui bao cao trang thai he thong ngay lap tuc len MQTT
            //    Lenh: "GET_STATUS"
            else if (strcmp(receivedCmd, "GET_STATUS") == 0) {
                Serial.println(" -> Dang gui bao cao trang thai...");
                publishStatusReport();
            }

            // Lenh khong hop le
            else {
                Serial.printf("[Control] Lenh khong xac dinh: %s\n", receivedCmd);
            }
        }
    }
}