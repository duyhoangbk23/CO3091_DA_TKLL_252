#pragma once
#include <Arduino.h>
#include "Pins.h"

struct ThresholdConfig {
  uint16_t schema_version = 1;
  uint32_t config_version = 1;
  uint16_t co2_on = 1000;
  uint16_t co2_off = 950;
  uint16_t pm_on = 35;
  uint16_t pm_off = 30;
  uint16_t voc_on = 500;
  uint16_t voc_off = 450;
  int16_t temp_on_x10 = 320;
  int16_t temp_off_x10 = 310;
  uint16_t rh_low_on_x10 = 300;
  uint16_t rh_low_off_x10 = 350;
  uint16_t rh_high_on_x10 = 650;
  uint16_t rh_high_off_x10 = 600;
  bool co2_enabled = true;
  bool pm_enabled = true;
  bool voc_enabled = true;
  bool temp_enabled = true;
  bool rh_enabled = true;
};

enum DeviceMask : uint8_t {
  DEVICE_HEPA = 1 << 0,
  DEVICE_VENT = 1 << 1,
  DEVICE_CARBON = 1 << 2,
  DEVICE_AC = 1 << 3,
  DEVICE_HUMID = 1 << 4
};

struct RuleDefinition {
  const char* metric;
  const char* direction;
  uint8_t affected_devices;
  int alert_led_pin;
};

static constexpr RuleDefinition DEFAULT_RULES[] = {
  {"co2", "HIGH_TRIGGER", static_cast<uint8_t>(DEVICE_VENT | DEVICE_CARBON), LED_CO2_R},
  {"pm", "HIGH_TRIGGER", DEVICE_HEPA, LED_PM_R},
  {"voc", "HIGH_TRIGGER", DEVICE_VENT, LED_VOC_R},
  {"temp", "HIGH_TRIGGER", DEVICE_AC, LED_TEMP_R},
  {"rh_low", "LOW_TRIGGER", DEVICE_HUMID, LED_RH_R},
  {"rh_high", "HIGH_TRIGGER", DEVICE_VENT, LED_RH_R}
};

inline ThresholdConfig defaultThresholdConfig() {
  return ThresholdConfig{};
}

inline bool validateThresholdConfig(const ThresholdConfig& c) {
  return c.co2_on > c.co2_off &&
         c.pm_on > c.pm_off &&
         c.voc_on > c.voc_off &&
         c.temp_on_x10 > c.temp_off_x10 &&
         c.rh_low_on_x10 < c.rh_low_off_x10 &&
         c.rh_high_on_x10 > c.rh_high_off_x10 &&
         c.rh_low_off_x10 < c.rh_high_off_x10;
}
