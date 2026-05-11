#pragma once
#include <Arduino.h>

enum class IaqZone : uint8_t {
  SAFE = 0,
  INTERVENE = 1,
  ALARM = 2
};

struct IaqState {
  IaqZone co2 = IaqZone::SAFE;
  IaqZone pm25 = IaqZone::SAFE;
  IaqZone voc = IaqZone::SAFE;
  IaqZone temp = IaqZone::SAFE;
  IaqZone rh = IaqZone::SAFE;

  bool wantVent = false;
  bool wantHepa = false;
  bool wantCarbon = false;
  bool wantAc = false;
  bool wantHumid = false;

  bool alarmCO2 = false;
  bool alarmPM = false;
  bool alarmVOC = false;
  bool alarmTemp = false;
  bool alarmRH = false;

  bool validCO2 = false;
  bool validPM = false;
  bool validVOC = false;
  bool validTempRH = false;
};
