#pragma once
#include <Arduino.h>
#include "IAQTypes.h"
#include "Pins.h"

// Layer 3: control outputs (LEDs now; later you can replace with relays).
class IaqController {
public:
  void begin();
  void apply(const IaqState& st);
};
