#ifndef MQTT_TOPICS_H
#define MQTT_TOPICS_H

// ============================================================
//  common/mqtt_topics.h
//  CONTRACT CHUNG — MQTT Topics
//  Tat ca 3 module deu phai dung file nay
//  KHONG duoc doi topic ma chua thong nhat
// ============================================================
#define WIFI_SSID "Ten_Wifi"
#define WIFI_PASS "Mat_Khau_Wifi"
#define MQTT_SERVER "localhost"
#define MQTT_PORT   1883
// ESP32 → Backend: du lieu cam bien dinh ky 10s
#define MQTT_TOPIC_SENSOR_DATA    "iot/sensor/data"

// ESP32 → Backend: bao cao trang thai tuc thoi (khi nhan GET_STATUS)
#define MQTT_TOPIC_DEVICE_STATUS  "iot/device/status"

// Backend → ESP32: lenh dieu khien tu Web
#define MQTT_TOPIC_DEVICE_CONTROL "iot/device/control"

#endif