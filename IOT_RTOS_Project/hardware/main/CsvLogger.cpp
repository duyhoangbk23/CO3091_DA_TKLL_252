#include "CsvLogger.h"

bool CsvLogger::begin(bool enableSpiffs, const char* path) {
  path_ = path ? path : "/log.csv";

  spiffsOk_ = false;
  if (enableSpiffs) {
    spiffsOk_ = SPIFFS.begin(true);
    if (spiffsOk_) ensureHeader();
  }
  return spiffsOk_;
}

void CsvLogger::ensureHeader() {
  if (!spiffsOk_) return;
  File f = SPIFFS.open(path_, FILE_APPEND);
  if (!f) return;
  if (f.size() == 0) {
    f.println("ms,pm1_atm,pm25_atm,pm10_atm,pm1_std,pm25_std,pm10_std,temp_c,hum_rh,co2_ppm,voc_raw,voc_avg,ok_pms,ok_sht,ok_co2");
  }
  f.close();
}

String CsvLogger::toCsvLine(const SensorSample& s) {
  String line;
  line.reserve(180);

  line += String(s.ms);

  line += ","; line += String(s.pm1_atm);
  line += ","; line += String(s.pm25_atm);
  line += ","; line += String(s.pm10_atm);

  line += ","; line += String(s.pm1_std);
  line += ","; line += String(s.pm25_std);
  line += ","; line += String(s.pm10_std);

  line += ",";
  if (s.temp_c_x10 == INT16_MIN) line += "";
  else line += String((float)s.temp_c_x10 / 10.0f, 1);

  line += ",";
  if (s.hum_rh_x10 == 0xFFFF) line += "";
  else line += String((float)s.hum_rh_x10 / 10.0f, 1);

  line += ",";
  if (s.co2_ppm == 0xFFFF) line += "-1";
  else line += String(s.co2_ppm);

  line += ","; line += String(s.voc_raw);
  line += ","; line += String((float)s.voc_avg_x10 / 10.0f, 1);

  line += ","; line += (s.ok_pms ? "1" : "0");
  line += ","; line += (s.ok_sht ? "1" : "0");
  line += ","; line += (s.ok_co2 ? "1" : "0");

  return line;
}

void CsvLogger::logToSerial(const SensorSample& s) {
  Serial.println(toCsvLine(s));
}

void CsvLogger::logToSpiffs(const SensorSample& s) {
  if (!spiffsOk_) return;
  File f = SPIFFS.open(path_, FILE_APPEND);
  if (!f) return;
  f.println(toCsvLine(s));
  f.close();
}

bool CsvLogger::shouldLog(uint32_t nowMs) {
  if ((int32_t)(nowMs - nextMs_) < 0) return false;
  nextMs_ = nowMs + intervalMs_;
  return true;
}

void CsvLogger::clear() {
  if (!spiffsOk_) return;
  SPIFFS.remove(path_);
  ensureHeader();
}

void CsvLogger::dumpToSerial() {
  if (!spiffsOk_) {
    Serial.println("# SPIFFS disabled");
    return;
  }
  File f = SPIFFS.open(path_, FILE_READ);
  if (!f) {
    Serial.println("# cannot open log");
    return;
  }
  Serial.println("# --- BEGIN LOG ---");
  while (f.available()) Serial.write((uint8_t)f.read());
  Serial.println("# --- END LOG ---");
  f.close();
}
