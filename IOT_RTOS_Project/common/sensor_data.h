#pragma once
#include <Arduino.h>

// Unified snapshot for your whole firmware.
// Use fixed-point (x10) to keep it lightweight and deterministic on ESP32.
struct SensorSample {
  uint32_t ms = 0;

  // PMS7003
  int16_t pm1_atm  = -1;
  int16_t pm25_atm = -1;
  int16_t pm10_atm = -1;

  int16_t pm1_std  = -1;
  int16_t pm25_std = -1;
  int16_t pm10_std = -1;

  // SHTC3 (RS485): fixed-point
  int16_t  temp_c_x10 = INT16_MIN;   // 253 -> 25.3C. INT16_MIN means "missing"
  uint16_t hum_rh_x10 = 0xFFFF;      // 503 -> 50.3%. 0xFFFF means "missing"

  // CO2 (RS485)
  uint16_t co2_ppm = 0xFFFF;         // 0xFFFF means "missing"

  // VOC analog
  uint16_t voc_raw = 0;
  uint16_t voc_avg_x10 = 0;          // avg*10 for 0.1 resolution (optional)

  // validity flags
  bool ok_pms = false;
  bool ok_sht = false;
  bool ok_co2 = false;
};

extern IaqEvaluator g_eval;
extern IaqController g_ctrl;
extern IaqState g_iaq; 
