#include <Arduino.h>
#include "global.h"
#include "tasks.h"

void setup() {
    Serial.begin(115200);
    
    // Khởi tạo tập trung tất cả tài nguyên (Queue, Mutex, Semaphore)
    init_system_resources();

    // Tạo các Task (Ưu tiên dùng PinnedToCore cho ESP32)
    xTaskCreatePinnedToCore(vTaskAlert,       "Task Alert",    2048, NULL, 5, NULL, 1);
    xTaskCreatePinnedToCore(vTaskSensorRead,  "Task Sensor",   4096, NULL, 4, NULL, 1);
    xTaskCreatePinnedToCore(vTaskDataProcess, "Task Process",  4096, NULL, 3, NULL, 1);
    xTaskCreatePinnedToCore(vTaskControl,     "Task Control",  2048, NULL, 3, NULL, 1);
    xTaskCreatePinnedToCore(vTaskDisplay,     "Task Display",  2048, NULL, 2, NULL, 1);
    xTaskCreatePinnedToCore(vTaskMQTT,        "Task MQTT",     8192, NULL, 1, NULL, 0);

    Serial.println(">>> He thong da san sang!");
}

void loop() {
    // De trong vi RTOS quan ly luong thuc thi
    vTaskDelay(portMAX_DELAY);
}