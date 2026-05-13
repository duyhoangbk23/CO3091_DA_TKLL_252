#include "IaqEvaluator.h"

void IaqEvaluator::begin(uint32_t holdMs) {
  holdMs_ = holdMs;
}

IaqZone IaqEvaluator::eval3(uint32_t v, uint32_t safe, uint32_t alarm, uint32_t hys, IaqZone prev) {
  if (prev == IaqZone::ALARM) {
    if (v <= (alarm > hys ? alarm - hys : 0)) return IaqZone::INTERVENE;
    return IaqZone::ALARM;
  }
  if (prev == IaqZone::INTERVENE) {
    if (v >= alarm + hys) return IaqZone::ALARM;
    if (v <= (safe > hys ? safe - hys : 0)) return IaqZone::SAFE;
    return IaqZone::INTERVENE;
  }
  if (v >= alarm + hys) return IaqZone::ALARM;
  if (v >= safe + hys) return IaqZone::INTERVENE;
  return IaqZone::SAFE;
}

IaqZone IaqEvaluator::evalTemp(int16_t t_x10, IaqZone prev) {
  if (prev == IaqZone::ALARM) {
    if (t_x10 <= temp_alarm_x10 - temp_hys_x10) return IaqZone::INTERVENE;
    return IaqZone::ALARM;
  }
  if (prev == IaqZone::INTERVENE) {
    if (t_x10 >= temp_alarm_x10 + temp_hys_x10) return IaqZone::ALARM;
    if (t_x10 <= temp_intervene_x10 - temp_hys_x10) return IaqZone::SAFE;
    return IaqZone::INTERVENE;
  }
  if (t_x10 >= temp_alarm_x10 + temp_hys_x10) return IaqZone::ALARM;
  if (t_x10 >= temp_intervene_x10 + temp_hys_x10) return IaqZone::INTERVENE;
  return IaqZone::SAFE;
}

IaqZone IaqEvaluator::evalRh(uint16_t rh_x10, IaqZone prev) {
  const uint16_t lowAlarm = rh_intervene_low_x10;
  const uint16_t highAlarm = rh_intervene_high_x10;

  if (prev == IaqZone::ALARM) {
    if (rh_x10 >= lowAlarm + rh_hys_x10 && rh_x10 <= highAlarm - rh_hys_x10) return IaqZone::INTERVENE;
    return IaqZone::ALARM;
  }
  if (prev == IaqZone::INTERVENE) {
    if (rh_x10 <= (lowAlarm > rh_hys_x10 ? lowAlarm - rh_hys_x10 : 0)) return IaqZone::ALARM;
    if (rh_x10 >= highAlarm + rh_hys_x10) return IaqZone::ALARM;

    if (rh_x10 >= rh_opt_low_x10 + rh_hys_x10 && rh_x10 <= rh_opt_high_x10 - rh_hys_x10) return IaqZone::SAFE;
    return IaqZone::INTERVENE;
  }

  if (rh_x10 <= (lowAlarm > rh_hys_x10 ? lowAlarm - rh_hys_x10 : 0)) return IaqZone::ALARM;
  if (rh_x10 >= highAlarm + rh_hys_x10) return IaqZone::ALARM;

  if (rh_x10 < rh_opt_low_x10 - rh_hys_x10 || rh_x10 > rh_opt_high_x10 + rh_hys_x10) return IaqZone::INTERVENE;
  return IaqZone::SAFE;
}

bool IaqEvaluator::applyHold(bool want, bool& last, uint32_t& tLast, uint32_t now) {
  if (want == last) return last;
  if (now - tLast < holdMs_) return last;
  last = want;
  tLast = now;
  return last;
}

IaqState IaqEvaluator::evaluate(const SensorSample& s) {
  IaqState st;
  uint32_t now = s.ms;

  st.validCO2 = (s.ok_co2 && s.co2_ppm != 0xFFFF);
  st.validPM = (s.ok_pms && s.pm25_atm >= 0);
  st.validTempRH = (s.ok_sht && s.temp_c_x10 != INT16_MIN && s.hum_rh_x10 != 0xFFFF);
  st.validVOC = true; // raw ADC exists

  if (st.validCO2) zCO2_ = eval3(s.co2_ppm, co2_safe, co2_alarm, co2_hys, zCO2_);
  else zCO2_ = IaqZone::SAFE;

  if (st.validPM) zPM_ = eval3((uint32_t)s.pm25_atm, pm_safe, pm_alarm, pm_hys, zPM_);
  else zPM_ = IaqZone::SAFE;

  uint32_t vocIndex = useVocRawAsIndex ? s.voc_raw : (uint32_t)(s.voc_avg_x10 / 10);
  zVOC_ = eval3(vocIndex, voc_safe, voc_alarm, voc_hys, zVOC_);

  if (st.validTempRH) zTemp_ = evalTemp(s.temp_c_x10, zTemp_);
  else zTemp_ = IaqZone::SAFE;

  if (st.validTempRH) zRH_ = evalRh(s.hum_rh_x10, zRH_);
  else zRH_ = IaqZone::SAFE;

  st.co2 = zCO2_;
  st.pm25 = zPM_;
  st.voc = zVOC_;
  st.temp = zTemp_;
  st.rh = zRH_;

  st.alarmCO2 = (zCO2_ == IaqZone::ALARM);
  st.alarmPM = (zPM_ == IaqZone::ALARM);
  st.alarmVOC = (zVOC_ == IaqZone::ALARM);
  st.alarmTemp = (zTemp_ == IaqZone::ALARM);
  st.alarmRH = (zRH_ == IaqZone::ALARM);

  bool wantVent = (zCO2_ != IaqZone::SAFE) || (zVOC_ != IaqZone::SAFE);
  bool wantHepa = (zPM_ != IaqZone::SAFE);
  bool wantCarbon = (zVOC_ != IaqZone::SAFE);
  bool wantAc = (zTemp_ != IaqZone::SAFE);

  bool wantHumid = false;
  if (st.validTempRH) {
    if (s.hum_rh_x10 < rh_opt_low_x10) wantHumid = true;
    if (s.hum_rh_x10 > rh_opt_high_x10) wantVent = true;
  }

  if (st.alarmPM) { wantHepa = true; wantVent = true; }
  if (st.alarmCO2) { wantVent = true; }
  if (st.alarmVOC) { wantVent = true; wantCarbon = true; }
  if (st.alarmTemp) { wantAc = true; }
  if (st.alarmRH && st.validTempRH) {
    if (s.hum_rh_x10 >= rh_intervene_high_x10) wantVent = true;
    if (s.hum_rh_x10 <= rh_intervene_low_x10) wantHumid = true;
  }

  if (st.validTempRH && s.hum_rh_x10 > rh_opt_high_x10) wantHumid = false;

  st.wantVent   = applyHold(wantVent,   lastVent_,   tVent_,   now);
  st.wantHepa   = applyHold(wantHepa,   lastHepa_,   tHepa_,   now);
  st.wantCarbon = applyHold(wantCarbon, lastCarbon_, tCarbon_, now);
  st.wantAc     = applyHold(wantAc,     lastAc_,     tAc_,     now);
  st.wantHumid  = applyHold(wantHumid,  lastHumid_,  tHumid_,  now);

  return st;
}
