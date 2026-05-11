#include "Pms7003.h"

void Pms7003Reader::begin(HardwareSerial& serial, int rxPin, int txPin, uint32_t baud) {
  ser_ = &serial;
  ser_->begin(baud, SERIAL_8N1, rxPin, txPin);
}

bool Pms7003Reader::checksumOk(const uint8_t* buf, size_t len) {
  uint16_t sum = 0;
  for (size_t i = 0; i < len - 2; i++) sum += buf[i];
  uint16_t chk = u16be(&buf[len - 2]);
  return sum == chk;
}

bool Pms7003Reader::readFrame(uint8_t* frame, size_t len, uint32_t timeoutMs) {
  if (!ser_) return false;

  size_t i = 0;
  uint32_t t0 = millis();

  while (millis() - t0 < timeoutMs) {
    if (!ser_->available()) continue;
    uint8_t b = (uint8_t)ser_->read();

    if (i == 0) {
      if (b != 0x42) continue;
      frame[i++] = b;
      continue;
    }
    if (i == 1) {
      if (b != 0x4D) { i = 0; continue; }
      frame[i++] = b;
      continue;
    }
    frame[i++] = b;
    if (i >= len) return true;
  }
  return false;
}

bool Pms7003Reader::readOnce(SensorSample& out, uint32_t timeoutMs) {
  uint8_t f[FRAME_LEN];

  if (!readFrame(f, sizeof(f), timeoutMs)) return false;
  if (!checksumOk(f, sizeof(f))) return false;

  out.pm1_std  = (int16_t)u16be(&f[4]);
  out.pm25_std = (int16_t)u16be(&f[6]);
  out.pm10_std = (int16_t)u16be(&f[8]);

  out.pm1_atm  = (int16_t)u16be(&f[10]);
  out.pm25_atm = (int16_t)u16be(&f[12]);
  out.pm10_atm = (int16_t)u16be(&f[14]);

  out.ok_pms = true;
  return true;
}
