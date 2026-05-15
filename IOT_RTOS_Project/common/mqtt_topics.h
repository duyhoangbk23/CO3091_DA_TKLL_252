#ifndef MQTT_TOPICS_H
#define MQTT_TOPICS_H

// ============================================================
//  common/mqtt_topics.h
//  CONTRACT CHUNG — MQTT Topics
//  Tat ca 3 module deu phai dung file nay
//  KHONG duoc doi topic ma chua thong nhat
//  CONTRACT CHUNG — MQTT Topics (RTOS + firmware)
//  Chuỗi topic PHẢI trùng common/data_format.json → "mqtt_topics"
//  Backend Node đọc JSON đó (src/config/mqttContract.js)
//  KHONG doi topic ma chua cap nhat data_format.json
// ============================================================
#if __has_include("local_config.h")
#include "local_config.h"
#endif

#ifndef WIFI_SSID
#define WIFI_SSID "YOUR_WIFI_SSID"
#endif

#if defined(WIFI_PASSWORD) && !defined(WIFI_PASS)
#define WIFI_PASS WIFI_PASSWORD
#endif

#ifndef WIFI_PASS
#define WIFI_PASS "YOUR_WIFI_PASSWORD"
#endif

#ifndef MQTT_BROKER_HOST
#define MQTT_BROKER_HOST "192.168.110.148"
#endif

#ifndef MQTT_BROKER_PORT
#define MQTT_BROKER_PORT 1883
#endif

/* IP/hostname broker — phải trùng MQTT_BROKER mà backend dùng (ESP32 không resolve được "localhost"). */
#define MQTT_SERVER MQTT_BROKER_HOST
#define MQTT_PORT   MQTT_BROKER_PORT
// ESP32 → Backend: du lieu cam bien dinh ky 10s
#define MQTT_TOPIC_SENSOR_DATA    "iot/sensor/data"

// ESP32 → Backend: bao cao trang thai tuc thoi (khi nhan GET_STATUS)
#define MQTT_TOPIC_DEVICE_STATUS  "iot/device/status"

// Backend → ESP32: lenh dieu khien tu Web
#define MQTT_TOPIC_DEVICE_CONTROL "iot/device/control"

#endif
