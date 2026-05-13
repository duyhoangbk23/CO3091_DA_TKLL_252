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
#define WIFI_SSID "Z Robotics"
#define WIFI_PASS "28102023"
/* IP/hostname broker — phải trùng MQTT_BROKER mà backend dùng (ESP32 không resolve được "localhost"). */
#define MQTT_SERVER "192.168.110.154"
#define MQTT_PORT   1883
// ESP32 → Backend: du lieu cam bien dinh ky 10s
#define MQTT_TOPIC_SENSOR_DATA    "iot/sensor/data"

// ESP32 → Backend: bao cao trang thai tuc thoi (khi nhan GET_STATUS)
#define MQTT_TOPIC_DEVICE_STATUS  "iot/device/status"

// Backend → ESP32: lenh dieu khien tu Web
#define MQTT_TOPIC_DEVICE_CONTROL "iot/device/control"

#endif