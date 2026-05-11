#include "IaqController.h"

void IaqController::begin() {
  pinMaybeOutput(LED_HEPA_G);
  pinMaybeOutput(LED_VENT_G);
  pinMaybeOutput(LED_CARBON_G);
  pinMaybeOutput(LED_AC_G);
  pinMaybeOutput(LED_HUMID_G);

  pinMaybeOutput(LED_CO2_R);
  pinMaybeOutput(LED_PM_R);
  pinMaybeOutput(LED_VOC_R);
  pinMaybeOutput(LED_TEMP_R);
  pinMaybeOutput(LED_RH_R);
}

void IaqController::apply(const IaqState& st) {
  ledWrite(LED_HEPA_G,   st.wantHepa);
  ledWrite(LED_VENT_G,   st.wantVent);
  ledWrite(LED_CARBON_G, st.wantCarbon);
  ledWrite(LED_AC_G,     st.wantAc);
  ledWrite(LED_HUMID_G,  st.wantHumid);

  ledWrite(LED_CO2_R,  st.alarmCO2);
  ledWrite(LED_PM_R,   st.alarmPM);
  ledWrite(LED_VOC_R,  st.alarmVOC);
  ledWrite(LED_TEMP_R, st.alarmTemp);
  ledWrite(LED_RH_R,   st.alarmRH);
}
