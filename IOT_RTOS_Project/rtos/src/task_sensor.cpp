#include <DHT.h>
#include <esp_timer.h>
#include "tasks.h"
#include "global.h"

void vTaskSensorRead(void *pvParameters) {
    // Khởi tạo cảm biến (Đôn kiểm tra lại chân Pin trong config.h)
    DHT dht(DHT_PIN, DHT22);
    dht.begin();

    // Biến quản lý chu kỳ 2000ms (2 giây)
    TickType_t xLastWakeTime = xTaskGetTickCount();
    const TickType_t xFrequency = pdMS_TO_TICKS(2000);

    for (;;) {
        // Chờ đến đúng chu kỳ tiếp theo
        vTaskDelayUntil(&xLastWakeTime, xFrequency);

        SensorData_t data;
        // Đọc dữ liệu từ phần cứng
        data.temperature = dht.readTemperature();
        data.humidity = dht.readHumidity();
        data.air_quality = analogRead(MQ135_PIN);
        data.alert_level = 0;                      // Mặc định OK, Task_DataProcess sẽ cập nhật
        data.timestamp   = esp_timer_get_time();   // Microseconds kể từ khi boot

        // Kiểm tra dữ liệu hợp lệ trước khi gửi vào Queue
        if (!isnan(data.temperature) && !isnan(data.humidity)) {
            // Gửi dữ liệu vào Queue (không block nếu Queue đầy)
            if (xQueueSend(xSensorQueue, &data, 0) != pdPASS) {
                Serial.println("[Sensor] Queue full!");
            }
        } else {
            Serial.println("[Sensor] Failed to read from DHT!");
        }
    }
}