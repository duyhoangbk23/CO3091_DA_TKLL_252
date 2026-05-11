#pragma once
#include <Arduino.h>

class VocAnalog {
public:
  void begin(int pin, int avgN = 20);
  uint16_t readRaw();
  uint16_t readAvgX10(); // average * 10 (0.1 count resolution)

private:
  int pin_ = -1;
  int n_ = 20;
  int idx_ = 0;
  bool inited_ = false;
  long sum_ = 0;
  uint16_t* buf_ = nullptr;
};
