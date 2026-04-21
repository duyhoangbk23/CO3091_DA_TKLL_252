#include "tasks.h"
#include "global.h"

void vTaskDataProcess(void *pvParameters) {
    SensorData_t receivedData;
    
    for (;;) {
        // 1. Doi du lieu tu Queue (Tu Task_SensorRead gui qua)
        if (xQueueReceive(xSensorQueue, &receivedData, portMAX_DELAY) == pdPASS) {
            
            // 2. Logic so sanh nguong (3 muc: OK / WARNING / DANGER)
            bool isCrit = (receivedData.temperature > TEMP_CRIT) || (receivedData.air_quality > AQI_CRIT);
            bool isWarn = (receivedData.temperature > TEMP_WARN) || (receivedData.air_quality > AQI_WARN);

            uint8_t new_level;
            if (isCrit)       new_level = 2; // DANGER
            else if (isWarn)  new_level = 1; // WARNING
            else              new_level = 0; // OK

            int error_count = new_level; // dung de kich hoat Alert Semaphore

            // Cap nhat muc do canh bao vao goi tin
            receivedData.alert_level = new_level;

            // 3. CAP NHAT DU LIEU TOAN CUC (Dung Mutex de bao ve)
            if (xSemaphoreTake(xDataMutex, pdMS_TO_TICKS(50)) == pdPASS) {
                g_LatestData = receivedData;
                xSemaphoreGive(xDataMutex);
            }

            // 4. Kich hoat Task_Alert neu co bat thuong
            if (error_count > 0) {
                for (int i = 0; i < error_count; i++) {
                    xSemaphoreGive(xAlertSem);
                }
            }
        }
    }
}