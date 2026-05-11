#pragma once
#include <Arduino.h>

// Bạn tự chọn GPIO cho 10 LED.
// [Chưa xác minh] Mình không thể chọn pin thay bạn vì còn phụ thuộc wiring và các pin đang dùng UART/ADC.
// Set các macro dưới đây theo phần cứng của bạn.

// LED xanh (thiết bị)
#ifndef LED_HEPA_G
#define LED_HEPA_G   15
#endif
#ifndef LED_VENT_G
#define LED_VENT_G   2
#endif
#ifndef LED_CARBON_G
#define LED_CARBON_G 0 
#endif
#ifndef LED_AC_G
#define LED_AC_G     4 
#endif
#ifndef LED_HUMID_G
#define LED_HUMID_G  5
#endif

// LED đỏ (cảnh báo)
#ifndef LED_CO2_R
#define LED_CO2_R    18
#endif
#ifndef LED_PM_R
#define LED_PM_R     19
#endif
#ifndef LED_VOC_R
#define LED_VOC_R    21
#endif
#ifndef LED_TEMP_R
#define LED_TEMP_R   22
#endif
#ifndef LED_RH_R
#define LED_RH_R     23
#endif

inline void pinMaybeOutput(int pin) {
  if (pin >= 0) { pinMode(pin, OUTPUT); digitalWrite(pin, LOW); }
}

inline void ledWrite(int pin, bool on) {
  if (pin >= 0) digitalWrite(pin, on ? HIGH : LOW);
}
