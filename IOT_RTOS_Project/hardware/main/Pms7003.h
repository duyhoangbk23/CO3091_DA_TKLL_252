#pragma once
#include <Arduino.h>
#include <HardwareSerial.h>
#include "SensorTypes.h"

class Pms7003Reader {
public:
  void begin(HardwareSerial& serial, int rxPin, int txPin, uint32_t baud = 9600);
  bool readOnce(SensorSample& out, uint32_t timeoutMs = 1200);

private:
  HardwareSerial* ser_ = nullptr;
  static constexpr size_t FRAME_LEN = 32;

  static uint16_t u16be(const uint8_t* p) { return ((uint16_t)p[0] << 8) | p[1]; }
  static bool checksumOk(const uint8_t* buf, size_t len);
  bool readFrame(uint8_t* frame, size_t len, uint32_t timeoutMs);
};
