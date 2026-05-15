#include "global.h"
#include <HardwareSerial.h>
#include "SensorHub.h"
#include "SnapshotStore.h"

SensorData_t g_LatestData = {"", 0.0f, 0.0f, -1, 0xFFFF, 0, 0, 0};
IaqState g_iaq{};
IaqEvaluator g_eval;
IaqController g_ctrl;
SensorHub g_hub;
SnapshotStore g_store;
HardwareSerial PMS(1);
HardwareSerial RS485(2);
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
