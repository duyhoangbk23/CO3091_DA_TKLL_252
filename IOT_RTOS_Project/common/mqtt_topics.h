#ifndef MQTT_TOPICS_H
#define MQTT_TOPICS_H

// ============================================================
//  common/mqtt_topics.h
//  CONTRACT CHUNG — MQTT Topics
//  Tat ca 3 module deu phai dung file nay
//  KHONG duoc doi topic ma chua thong nhat
// ============================================================

// ESP32 → Backend: du lieu cam bien dinh ky 10s
#define MQTT_TOPIC_SENSOR_DATA    "iot/sensor/data"

// ESP32 → Backend: bao cao trang thai tuc thoi (khi nhan GET_STATUS)
#define MQTT_TOPIC_DEVICE_STATUS  "iot/device/status"

// Backend → ESP32: lenh dieu khien tu Web
#define MQTT_TOPIC_DEVICE_CONTROL "iot/device/control"

#endif