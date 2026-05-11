#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// Định nghĩa ngưỡng (Thresholds) 
#define TEMP_WARN 35.0f   
#define TEMP_CRIT 40.0f   
#define AQI_WARN  300     
#define AQI_CRIT  500     

// Định nghĩa chân phần cứng (Hardware Pins)
#define DHT_PIN     4     // Data, pull-up 10k -> 3.3V [cite: 24]
#define MQ135_PIN   34    // ADC1_CH6, 12-bit [cite: 25]
#define I2C_SDA     21    // LCD SDA [cite: 26]
#define I2C_SCL     22    // LCD SCL [cite: 26]
#define BUZZER_PIN  25    // Active high [cite: 27]
#define LED_RED     26    // Báo động nguy hiểm [cite: 28]
#define LED_YELLOW  27    // Cảnh báo [cite: 29]
#define LED_GREEN   32    // Trạng thái bình thường [cite: 30]

#ifndef MQTT_SERVER
#define MQTT_SERVER "192.168.1.100"  // Thay bang IP LAN cua may chay Mosquitto/Docker host
#endif

#ifndef MQTT_PORT
#define MQTT_PORT   1883
#endif

#ifndef MQTT_TOPIC_PUBLISH
#define MQTT_TOPIC_PUBLISH  "iot/sensor/data"     // ESP32 -> Backend
#endif
#ifndef MQTT_TOPIC_STATUS
#define MQTT_TOPIC_STATUS   "sensor/esp32/status"   // GET_STATUS response
#endif
#ifndef MQTT_TOPIC_COMMAND
#define MQTT_TOPIC_COMMAND  "iot/device/control"  // Backend -> ESP32
#endif

#ifndef WIFI_SSID
#define WIFI_SSID "Ten_Wifi"
#endif
#ifndef WIFI_PASS
#define WIFI_PASS "Mat_Khau_Wifi"
#endif

#endif
