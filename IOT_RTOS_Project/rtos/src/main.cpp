#include <Arduino.h>
#include <HardwareSerial.h>
#include <Wire.h>
#include "global.h"
#include "tasks.h"
#include "board_config.h"
#include "SensorHub.h"
#include "IaqEvaluator.h"

extern HardwareSerial PMS;
extern HardwareSerial RS485;
extern SensorHub g_hub;
extern IaqEvaluator g_eval;

// extern void vTaskRunAllTests(void *pvParameters);
void setup() {
    Serial.begin(115200);
    delay(200);

    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);

    g_hub.begin(PMS, PMS_RX_PIN, PMS_TX_PIN,
                RS485, RS485_RX_PIN, RS485_TX_PIN, RS485_DERE_PIN,
                VOC_PIN);
    g_eval.begin(5000);
    
    // Khởi tạo tập trung tất cả tài nguyên (Queue, Mutex, Semaphore)
    init_system_resources();

    // Tạo các Task (Ưu tiên dùng PinnedToCore cho ESP32)
#ifdef RUN_RTOS_TESTS
    xTaskCreate(vTaskRunAllTests, "Tests", 8192, NULL, 5, NULL);
#else
    xTaskCreatePinnedToCore(vTaskAlert,       "Task Alert",    2048, NULL, 5, NULL, 1);
    xTaskCreatePinnedToCore(vTaskSensorRead,  "Task Sensor",   4096, NULL, 4, NULL, 1);
    xTaskCreatePinnedToCore(vTaskDataProcess, "Task Process",  4096, NULL, 3, NULL, 1);
    xTaskCreatePinnedToCore(vTaskControl,     "Task Control",  2048, NULL, 3, NULL, 1);
    xTaskCreatePinnedToCore(vTaskDisplay,     "Task Display",  2048, NULL, 2, NULL, 1);
    xTaskCreatePinnedToCore(vTaskMQTT,        "Task MQTT",     8192, NULL, 1, NULL, 0);
#endif
    Serial.println(">>> He thong da san sang!");
}

void loop() {
    // De trong vi RTOS quan ly luong thuc thi
    vTaskDelay(portMAX_DELAY);
}
