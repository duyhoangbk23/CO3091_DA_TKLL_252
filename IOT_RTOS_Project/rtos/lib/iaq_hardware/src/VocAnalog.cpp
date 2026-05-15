#include "VocAnalog.h"

void VocAnalog::begin(int pin, int avgN) {
  pin_ = pin;
  n_ = (avgN < 1) ? 1 : avgN;

  if (buf_) { free(buf_); buf_ = nullptr; }
  buf_ = (uint16_t*)malloc(sizeof(uint16_t) * n_);
  idx_ = 0;
  inited_ = false;
  sum_ = 0;

  analogReadResolution(12);
  analogSetPinAttenuation(pin_, ADC_11db);
}

uint16_t VocAnalog::readRaw() {
  if (pin_ < 0) return 0;
  uint16_t v = (uint16_t)analogRead(pin_);

  if (!buf_) return v;

  if (!inited_) {
    for (int i = 0; i < n_; i++) buf_[i] = v;
    sum_ = (long)v * n_;
    inited_ = true;
    return v;
  }

  sum_ -= buf_[idx_];
  buf_[idx_] = v;
  sum_ += buf_[idx_];
  idx_ = (idx_ + 1) % n_;
  return v;
}

uint16_t VocAnalog::readAvgX10() {
  if (!inited_ || n_ <= 0) return 0;
  long avg = sum_ / n_;
  return (uint16_t)(avg * 10);
}
