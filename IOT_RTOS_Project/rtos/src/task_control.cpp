#include <Arduino.h>
#include <string.h>
#include "tasks.h"
#include "global.h"
//#include "config.h"
#include "IaqController.h"
#include "Pins.h" // Chứa định nghĩa 10 LED

extern IaqController g_ctrl;

void vTaskControl(void *pvParameters) {
    char receivedCmd[20];

    for (;;) {
        // Đợi lệnh từ Duy (Backend) qua Queue
        if (xQueueReceive(xControlQueue, &receivedCmd, portMAX_DELAY) == pdPASS) {
            Serial.printf("[Control] Dashboard Cmd: %s\n", receivedCmd);

            // --- 1. NHÓM LỆNH HỆ THỐNG ---
            if (strcmp(receivedCmd, "REBOOT") == 0) {
                ESP.restart();
            }
            else if (strcmp(receivedCmd, "TEST_LED") == 0) {
                // Sáng toàn bộ 10 LED trong 1 giây để kiểm tra phần cứng của Đôn
                IaqState testOn;
                testOn.wantHepa = testOn.wantVent = testOn.wantCarbon = testOn.wantAc = testOn.wantHumid = true;
                testOn.alarmCO2 = testOn.alarmPM = testOn.alarmVOC = testOn.alarmTemp = testOn.alarmRH = true;

                g_ctrl.apply(testOn); 
                vTaskDelay(pdMS_TO_TICKS(1000));

   
                IaqState testOff; 
                testOff.wantHepa = testOff.wantVent = testOff.wantCarbon = testOff.wantAc = testOff.wantHumid = false;
                testOff.alarmCO2 = testOff.alarmPM = testOff.alarmVOC = testOff.alarmTemp = testOff.alarmRH = false;
                g_ctrl.apply(testOff);
            }

            // --- 2. NHÓM ĐIỀU KHIỂN 5 THIẾT BỊ (LED XANH) ---
            else if (strcmp(receivedCmd, "HEPA_ON") == 0)    ledWrite(LED_HEPA_G, HIGH);
            else if (strcmp(receivedCmd, "HEPA_OFF") == 0)   ledWrite(LED_HEPA_G, LOW);
            
            else if (strcmp(receivedCmd, "VENT_ON") == 0)    ledWrite(LED_VENT_G, HIGH);
            else if (strcmp(receivedCmd, "VENT_OFF") == 0)   ledWrite(LED_VENT_G, LOW);
            
            else if (strcmp(receivedCmd, "CARBON_ON") == 0)  ledWrite(LED_CARBON_G, HIGH);
            else if (strcmp(receivedCmd, "CARBON_OFF") == 0) ledWrite(LED_CARBON_G, LOW);
            
            else if (strcmp(receivedCmd, "AC_ON") == 0)      ledWrite(LED_AC_G, HIGH);
            else if (strcmp(receivedCmd, "AC_OFF") == 0)     ledWrite(LED_AC_G, LOW);
            
            else if (strcmp(receivedCmd, "HUMID_ON") == 0)   ledWrite(LED_HUMID_G, HIGH);
            else if (strcmp(receivedCmd, "HUMID_OFF") == 0)  ledWrite(LED_HUMID_G, LOW);

            // --- 3. NHÓM ĐIỀU KHIỂN 5 CẢNH BÁO (LED ĐỎ) ---
            else if (strcmp(receivedCmd, "ALARM_CO2_ON") == 0)  ledWrite(LED_CO2_R, HIGH);
            else if (strcmp(receivedCmd, "ALARM_CO2_OFF") == 0) ledWrite(LED_CO2_R, LOW);
            
            else if (strcmp(receivedCmd, "ALARM_PM_ON") == 0)   ledWrite(LED_PM_R, HIGH);
            else if (strcmp(receivedCmd, "ALARM_PM_OFF") == 0)  ledWrite(LED_PM_R, LOW);
            
            else if (strcmp(receivedCmd, "ALARM_VOC_ON") == 0)  ledWrite(LED_VOC_R, HIGH);
            else if (strcmp(receivedCmd, "ALARM_VOC_OFF") == 0) ledWrite(LED_VOC_R, LOW);
            
            else if (strcmp(receivedCmd, "ALARM_TEMP_ON") == 0) ledWrite(LED_TEMP_R, HIGH);
            else if (strcmp(receivedCmd, "ALARM_TEMP_OFF") == 0) ledWrite(LED_TEMP_R, LOW);
            
            else if (strcmp(receivedCmd, "ALARM_RH_ON") == 0)   ledWrite(LED_RH_R, HIGH);
            else if (strcmp(receivedCmd, "ALARM_RH_OFF") == 0)  ledWrite(LED_RH_R, LOW);

            // --- 4. LỆNH TRUY VẤN TRẠNG THÁI ---
            else if (strcmp(receivedCmd, "GET_STATUS") == 0) {
                Serial.println(" -> Status Request Received.");
            }
        }
    }
}