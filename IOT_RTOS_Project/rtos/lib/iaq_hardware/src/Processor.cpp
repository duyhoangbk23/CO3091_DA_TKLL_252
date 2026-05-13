#include "Processor.h"

void Processor::process(const SensorSample& s) {
  if (!s.ok_pms || s.pm25_atm < 0) {
    hepaOn_ = false;
    alarmOn_ = false;
    return;
  }

  hepaOn_ = (s.pm25_atm >= 15);
  alarmOn_ = (s.pm25_atm > 35);
}
