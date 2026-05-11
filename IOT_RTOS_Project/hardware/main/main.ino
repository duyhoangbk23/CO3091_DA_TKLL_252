#include <Arduino.h>

#include "SensorTypes.h"
#include "SnapshotStore.h"
#include "SensorHub.h"
#include "CsvLogger.h"

// IAQ + Control
#include "IAQTypes.h"
#include "IaqEvaluator.h"
#include "IaqController.h"

// ======================
// Pin map (NodeMCU-32S)
// ======================
static const int PMS_RX_PIN = 26;     // ESP32 receives from PMS TX
static const int PMS_TX_PIN = 27;     // optional

static const int RS485_RX_PIN = 16;  // UART2 RX
static const int RS485_TX_PIN = 17;  // UART2 TX

// RS485 module auto-direction => -1
// nếu module của bạn cần DE/RE thì đổi sang 1 GPIO và nối DE+RE về GPIO đó
static const int RS485_DERE_PIN = -1;

static const int VOC_PIN = 34;       // ADC1 input-only

HardwareSerial PMS(1);
HardwareSerial RS485(2);

SnapshotStore g_store;
SensorHub g_hub;
CsvLogger g_csv;

// Layer 2 + Layer 3
IaqEvaluator g_eval;
IaqController g_ctrl;
IaqState g_iaq;

static bool loggingEnabled = true;

static void handleCommands() {
  if (!Serial.available()) return;
  String cmd = Serial.readStringUntil('\n');
  cmd.trim();
  cmd.toUpperCase();

  if (cmd == "DUMP") {
    g_csv.dumpToSerial();
  } else if (cmd == "CLEAR") {
    g_csv.clear();
    Serial.println("# CLEARED");
  } else if (cmd == "STOP") {
    loggingEnabled = false;
    Serial.println("# logging=0");
  } else if (cmd == "START") {
    loggingEnabled = true;
    Serial.println("# logging=1");
  } else if (cmd.startsWith("INTERVAL=")) {
    long v = cmd.substring(String("INTERVAL=").length()).toInt();
    g_csv.setWriteIntervalMs((uint32_t)v);
    Serial.print("# interval_ms="); Serial.println(g_csv.intervalMs());
  } else {
    Serial.println("# cmds: START | STOP | CLEAR | DUMP | INTERVAL=1000");
  }
}

static const char* zoneStr(IaqZone z) {
  switch (z) {
    case IaqZone::SAFE: return "SAFE";
    case IaqZone::INTERVENE: return "INTERVENE";
    case IaqZone::ALARM: return "ALARM";
    default: return "?";
  }
}

static void printIAQ(const SensorSample& s, const IaqState& st) {
  Serial.print("t_ms="); Serial.print(s.ms);

  // PM2.5
  Serial.print(" | PM2.5_atm=");
  if (s.ok_pms) Serial.print(s.pm25_atm);
  else Serial.print("NA");
  Serial.print(" ug/m3");

  // CO2
  Serial.print(" | CO2=");
  if (s.ok_co2 && s.co2_ppm != 0xFFFF) Serial.print(s.co2_ppm);
  else Serial.print("NA");
  Serial.print(" ppm");

  // VOC (raw)
  Serial.print(" | VOC_raw="); Serial.print(s.voc_raw);

  // Temp/RH
  Serial.print(" | T=");
  if (s.ok_sht && s.temp_c_x10 != INT16_MIN) Serial.print((float)s.temp_c_x10 / 10.0f, 1);
  else Serial.print("NA");
  Serial.print(" C");

  Serial.print(" | RH=");
  if (s.ok_sht && s.hum_rh_x10 != 0xFFFF) Serial.print((float)s.hum_rh_x10 / 10.0f, 1);
  else Serial.print("NA");
  Serial.print(" %");

  // Zones
  Serial.print(" || ZONE{CO2="); Serial.print(zoneStr(st.co2));
  Serial.print(",PM="); Serial.print(zoneStr(st.pm25));
  Serial.print(",VOC="); Serial.print(zoneStr(st.voc));
  Serial.print(",T="); Serial.print(zoneStr(st.temp));
  Serial.print(",RH="); Serial.print(zoneStr(st.rh));
  Serial.print("}");

  // Outputs (green LEDs)
  Serial.print(" || OUT{HEPA="); Serial.print(st.wantHepa ? 1 : 0);
  Serial.print(",VENT="); Serial.print(st.wantVent ? 1 : 0);
  Serial.print(",CARBON="); Serial.print(st.wantCarbon ? 1 : 0);
  Serial.print(",AC="); Serial.print(st.wantAc ? 1 : 0);
  Serial.print(",HUMID="); Serial.print(st.wantHumid ? 1 : 0);
  Serial.print("}");

  // Alarms (red LEDs)
  Serial.print(" || ALARM{CO2="); Serial.print(st.alarmCO2 ? 1 : 0);
  Serial.print(",PM="); Serial.print(st.alarmPM ? 1 : 0);
  Serial.print(",VOC="); Serial.print(st.alarmVOC ? 1 : 0);
  Serial.print(",T="); Serial.print(st.alarmTemp ? 1 : 0);
  Serial.print(",RH="); Serial.print(st.alarmRH ? 1 : 0);
  Serial.print("}");

  Serial.println();
}


void setup() {
  Serial.begin(115200);
  delay(200);

  g_hub.begin(PMS, PMS_RX_PIN, PMS_TX_PIN,
              RS485, RS485_RX_PIN, RS485_TX_PIN, RS485_DERE_PIN,
              VOC_PIN);

  bool spiffsOk = g_csv.begin(true, "/log.csv");

  // Layer 2: hysteresis + hold time
  g_eval.begin(5000); // giữ tối thiểu 5s trước khi cho đổi trạng thái (anti-chatter)

  // Layer 3: LEDs
  g_ctrl.begin();

  Serial.println("# Ready (IAQ + LEDs)");
  Serial.println("# CSV: ms,pm1_atm,pm25_atm,pm10_atm,pm1_std,pm25_std,pm10_std,temp_c,hum_rh,co2_ppm,voc_raw,voc_avg,ok_pms,ok_sht,ok_co2");
  Serial.println("# cmds: START | STOP | CLEAR | DUMP | INTERVAL=1000");
  Serial.print("# spiffs="); Serial.println(spiffsOk ? "1" : "0");
}

void loop() {
  handleCommands();

  if (!loggingEnabled) {
    delay(10);
    return;
  }

  uint32_t now = millis();
  if (!g_csv.shouldLog(now)) {
    delay(1);
    return;
  }

  // Layer 1
  SensorSample s = g_hub.readSample();
  g_store.publish(s);

  // Layer 2
  g_iaq = g_eval.evaluate(s);

  g_ctrl.apply(g_iaq);

  // in có nhãn (không CSV)
  printIAQ(s, g_iaq);

  // vẫn lưu CSV vào SPIFFS để plot python
  g_csv.logToSpiffs(s);

}
