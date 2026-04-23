#include "global.h"

SensorData_t g_LatestData = {0.0f, 0.0f, 0, 0, 0};
WiFiClient espClient;
PubSubClient mqttClient(espClient);
//String remote_command = "";

// Định nghĩa Handle
QueueHandle_t xSensorQueue = NULL;
SemaphoreHandle_t xDataMutex = NULL;
SemaphoreHandle_t xAlertSem = NULL;
QueueHandle_t xControlQueue = NULL;  
void init_system_resources() {
    // Khởi tạo các tài nguyên RTOS
    xSensorQueue = xQueueCreate(5, sizeof(SensorData_t));
    xDataMutex   = xSemaphoreCreateMutex();
    xAlertSem    = xSemaphoreCreateCounting(10, 0);
    xControlQueue = xQueueCreate(5, sizeof(char) * 20); 

    if (xControlQueue != NULL) {
        Serial.println("[System] Control Queue Created!");
    }
    if (xSensorQueue != NULL && xDataMutex != NULL && xAlertSem != NULL) {
        Serial.println("[System] Resources Initialized OK!");
    }
}