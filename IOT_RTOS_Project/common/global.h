#ifndef GLOBAL_H
#define GLOBAL_H

// SensorData_t phải khớp common/data_format.json → "sensor_data_payload"
// (Backend dùng cùng file JSON làm hợp đồng; không include .h từ Node)

#include <Arduino.h>
#include "config.h"

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"
#include "freertos/queue.h"

#include <WiFi.h>
#include <PubSubClient.h>

// Nhờ có build_flags ở trên, bạn có thể include ngắn gọn hơn
#include "IaqEvaluator.h"
#include "IaqController.h"
#include "IAQTypes.h"

// Struct chứa dữ liệu cảm biến — đồng bộ với SensorSample của Hardware
typedef struct {
    char     device_id[16]; // ID thiet bi, lay tu DEVICE_ID trong config.h
    float    temperature;   // °C (SHTC3)
    float    humidity;      // %RH (SHTC3)
    int16_t  pm25;          // µg/m3 (PMS7003 - ATM)
    uint16_t co2;           // ppm (CO2 RS485), 0xFFFF = missing
    uint16_t voc;           // raw index (VOC analog)
    uint8_t  alert_level;   // 0=OK, 1=WARN, 2=CRITICAL
    int64_t  timestamp;     // esp_timer_get_time()
} SensorData_t;

extern WiFiClient espClient;
extern PubSubClient mqttClient;
//Biến global giữa mqtt và task_control để lưu lệnh từ xa
// Thêm khai báo Handle cho Queue điều khiển
extern QueueHandle_t xControlQueue;
// Biến global để các Task Display/MQTT cùng đọc
extern SensorData_t g_LatestData;

// Queue truyền data thô
extern QueueHandle_t xSensorQueue; 

// Mutex bảo vệ g_LatestData
extern SemaphoreHandle_t xDataMutex;

// Semaphore đếm cho Task Alert
extern SemaphoreHandle_t xAlertSem;

void init_system_resources();

#endif