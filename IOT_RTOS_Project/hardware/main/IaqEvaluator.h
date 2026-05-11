#pragma once
#include <Arduino.h>
#include "SensorTypes.h"
#include "IAQTypes.h"

// Layer 2: evaluate raw measurements -> SAFE / INTERVENE / ALARM
// Adds hysteresis + minimum hold time + simple safety interlock
class IaqEvaluator {
public:
  void begin(uint32_t holdMs = 5000);
  IaqState evaluate(const SensorSample& s);

  // CO2
  uint16_t co2_safe = 1000;
  uint16_t co2_alarm = 1500;
  uint16_t co2_hys = 50;

  // PM2.5
  uint16_t pm_safe = 15;
  uint16_t pm_alarm = 35;
  uint16_t pm_hys = 2;

  // VOC index (NOT raw ADC)
  // [Chưa xác minh] Bạn phải hiệu chuẩn VOC để ra "index" tương ứng.
  uint16_t voc_safe = 500;
  uint16_t voc_alarm = 1000;
  uint16_t voc_hys = 50;

  // Temperature (x10)
  int16_t temp_intervene_x10 = 280;
  int16_t temp_alarm_x10 = 320;
  int16_t temp_hys_x10 = 5;

  // Humidity (x10)
  uint16_t rh_opt_low_x10 = 300;
  uint16_t rh_opt_high_x10 = 500;
  uint16_t rh_intervene_low_x10 = 250;
  uint16_t rh_intervene_high_x10 = 600;
  uint16_t rh_hys_x10 = 10;

  // [Chưa xác minh] Nếu chưa có VOC index, dùng voc_raw làm "index giả".
  bool useVocRawAsIndex = true;

private:
  uint32_t holdMs_ = 5000;

  bool lastVent_ = false, lastHepa_ = false, lastCarbon_ = false, lastAc_ = false, lastHumid_ = false;
  uint32_t tVent_ = 0, tHepa_ = 0, tCarbon_ = 0, tAc_ = 0, tHumid_ = 0;

  IaqZone zCO2_ = IaqZone::SAFE;
  IaqZone zPM_  = IaqZone::SAFE;
  IaqZone zVOC_ = IaqZone::SAFE;
  IaqZone zTemp_= IaqZone::SAFE;
  IaqZone zRH_  = IaqZone::SAFE;

  IaqZone eval3(uint32_t v, uint32_t safe, uint32_t alarm, uint32_t hys, IaqZone prev);
  IaqZone evalTemp(int16_t t_x10, IaqZone prev);
  IaqZone evalRh(uint16_t rh_x10, IaqZone prev);

  bool applyHold(bool want, bool& last, uint32_t& tLast, uint32_t now);
};
