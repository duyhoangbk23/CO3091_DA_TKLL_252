#include <esp_timer.h>
#include "tasks.h"
#include "global.h"
#include "SnapshotStore.h"  // SensorSample and shared snapshot store
#include "SensorHub.h"

extern SnapshotStore g_store;
extern SensorHub g_hub;

void vTaskSensorRead(void *pvParameters) {

    // Bien quan ly chu ky 2000ms
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xFrequency = pdMS_TO_TICKS(2000);

    for (;;) {
        // Cho den dung chu ky tiep theo
        vTaskDelayUntil(&xLastWakeTime, xFrequency);

        SensorSample hw = g_hub.readSample();
        g_store.publish(hw);

        // Kiem tra validity flags truoc khi xu ly
        // Map tu SensorSample (Don) sang SensorData_t (Danh)
        SensorData_t data;

        strncpy(data.device_id, DEVICE_ID, sizeof(data.device_id) - 1);
        data.device_id[sizeof(data.device_id) - 1] = '\0';

        // Nhiet do + do am (SHTC3, fixed-point x10 -> float)
        data.temperature = hw.ok_sht ? hw.temp_c_x10 / 10.0f : NAN;
        data.humidity    = hw.ok_sht ? hw.hum_rh_x10 / 10.0f : NAN;

        // PM2.5 + PM10 (PMS7003), -1 neu chua co du lieu
        data.pm25 = hw.ok_pms ? hw.pm25_atm : -1;

        // CO2 (RS485), 0xFFFF = missing theo quy uoc cua Don
        data.co2 = hw.ok_co2 ? hw.co2_ppm : 0xFFFF;

        // VOC (analog, voc_avg_x10 / 10 -> index)
        data.voc = hw.voc_avg_x10 / 10;

        data.alert_level = 0;                    // Mac dinh OK, Task_DataProcess se cap nhat
        data.timestamp   = esp_timer_get_time(); // Microseconds ke tu khi boot

        // Gui vao Queue (khong block neu Queue day)
        if (xQueueSend(xSensorQueue, &data, 0) != pdPASS) {
            Serial.println("[Sensor] Queue full!");
        }
    }
}
