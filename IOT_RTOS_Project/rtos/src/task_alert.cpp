#include "tasks.h"
#include "global.h"

void vTaskAlert(void *pvParameters) {
    // Khoi tao cac chan Output (Lay tu config.h qua global.h)
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(LED_RED,    OUTPUT);
    pinMode(LED_YELLOW, OUTPUT);
    pinMode(LED_GREEN,  OUTPUT);

    for (;;) {
        // Bat LED xanh khi moi thu binh thuong
        digitalWrite(LED_GREEN, HIGH);

        // Đợi Semaphore (Block vo han cho den khi Task_Process phat hien loi)
        if (xSemaphoreTake(xAlertSem, portMAX_DELAY) == pdPASS) {
            
            // Tat LED xanh khi co bao dong
            digitalWrite(LED_GREEN, LOW);
            Serial.println("[Alert] PHAT HIEN BAT THUONG! Dang canh bao...");

            // Kich ban: Chop LED Do va keu coi 3 lan
            for (int i = 0; i < 3; i++) {
                digitalWrite(LED_RED, HIGH);
                digitalWrite(BUZZER_PIN, HIGH);
                vTaskDelay(pdMS_TO_TICKS(150)); 
                
                digitalWrite(LED_RED, LOW);
                digitalWrite(BUZZER_PIN, LOW);
                vTaskDelay(pdMS_TO_TICKS(150));
            }
        }
    }
}