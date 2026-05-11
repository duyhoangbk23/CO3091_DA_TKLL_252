#pragma once
#include <Arduino.h>
#include <SPIFFS.h>
#include "SensorTypes.h"

class CsvLogger {
public:
  bool begin(bool enableSpiffs, const char* path = "/log.csv");
  void logToSerial(const SensorSample& s);
  void logToSpiffs(const SensorSample& s);

  void clear();
  void dumpToSerial();

  void setWriteIntervalMs(uint32_t ms) { intervalMs_ = (ms < 200) ? 200 : ms; }
  uint32_t intervalMs() const { return intervalMs_; }

  bool shouldLog(uint32_t nowMs);

private:
  bool spiffsOk_ = false;
  const char* path_ = "/log.csv";
  uint32_t intervalMs_ = 1000;
  uint32_t nextMs_ = 0;

  void ensureHeader();
  String toCsvLine(const SensorSample& s);
};
