#ifndef GLOBAL_H
#define GLOBAL_H

#include "config.h"
#include <freertos/FreeRTOS.h>
#include <freertos/semphr.h>
#include <WiFi.h>
#include <PubSubClient.h>

// Struct chứa dữ liệu từ các chân DHT22 và MQ135
typedef struct {
    float    temperature;  // °C
    float    humidity;     // %RH
    uint16_t air_quality;  // ppm (MQ-135 raw ADC)
    uint8_t  alert_level;  // 0=OK, 1=WARN, 2=CRITICAL
    int64_t  timestamp;    // esp_timer_get_time()
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