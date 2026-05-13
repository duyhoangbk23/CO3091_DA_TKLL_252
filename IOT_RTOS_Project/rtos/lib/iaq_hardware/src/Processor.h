#pragma once
#include <Arduino.h>
#include "SensorTypes.h"

// Keep this intentionally simple.
// Put your "business logic" here, reading only the latest snapshot.
class Processor {
public:
  void process(const SensorSample& s);

  bool hepaOn() const { return hepaOn_; }
  bool alarmOn() const { return alarmOn_; }

private:
  bool hepaOn_ = false;
  bool alarmOn_ = false;
};
