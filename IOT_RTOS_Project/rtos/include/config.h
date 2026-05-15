// #ifndef CONFIG_H
// #define CONFIG_H

// #include <Arduino.h>

// // Định nghĩa ngưỡng (Thresholds) — theo tiêu chuẩn quốc tế
// #define TEMP_WARN   35.0f   // °C
// #define TEMP_CRIT   40.0f   // °C

// // CO2 (ppm)
// #define CO2_WARN    1000    // Bắt đầu tăng thông gió
// #define CO2_CRIT    1500    // Cảnh báo

// // PM2.5 / PM10 (µg/m3)
// #define PM_WARN     15      // Bắt đầu lọc HEPA
// #define PM_CRIT     35      // Cảnh báo

// // VOC (raw index)
// #define VOC_WARN    500     // Bắt đầu tăng thông gió / lọc than
// #define VOC_CRIT    1000    // Cảnh báo

// // Định nghĩa chân phần cứng (Hardware Pins)
// #define DHT_PIN     4     // Data, pull-up 10k -> 3.3V [cite: 24]
// #define MQ135_PIN   34    // ADC1_CH6, 12-bit [cite: 25]
// #define LED_RED     26    // Báo động nguy hiểm [cite: 28]
// #define LED_YELLOW  27    // Cảnh báo [cite: 29]
// #define LED_GREEN   32    // Trạng thái bình thường [cite: 30]

// #define MQTT_SERVER "localhost"
// #define MQTT_PORT   1883

// // Topics lay tu contract chung — KHONG dinh nghia lai o day
// #include "../../common/mqtt_topics.h"

// #define DEVICE_ID "esp32_device"  // ID dinh danh thiet bi, dong bo voi data_format.json

// #define WIFI_SSID "Ten_Wifi"
// #define WIFI_PASS "Mat_Khau_Wifi"

// #endif
