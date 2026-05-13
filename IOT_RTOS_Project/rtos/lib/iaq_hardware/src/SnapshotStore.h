#pragma once
#include <Arduino.h>
#include "SensorTypes.h"

// Latest-snapshot store: 1 writer, many readers.
// Simple and safe even if you later split into multiple tasks.
class SnapshotStore {
public:
  void publish(const SensorSample& s);
  bool get(SensorSample& out) const;   // returns false if never published

private:
  mutable portMUX_TYPE mux_ = portMUX_INITIALIZER_UNLOCKED;
  SensorSample latest_{};
  bool has_ = false;
};
