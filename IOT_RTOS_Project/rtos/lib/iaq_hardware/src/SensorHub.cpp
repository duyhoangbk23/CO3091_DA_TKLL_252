#include "SensorHub.h"

void SensorHub::begin(HardwareSerial& pmsSer, int pmsRx, int pmsTx,
                      HardwareSerial& rs485Ser, int rsRx, int rsTx, int rsDeRePin,
                      int vocPin) {
  pms_.begin(pmsSer, pmsRx, pmsTx, 9600);
  mb_.begin(rs485Ser, rsRx, rsTx, 9600, rsDeRePin);
  voc_.begin(vocPin, 20);
}

SensorSample SensorHub::readSample() {
  SensorSample s;
  s.ms = millis();

  pms_.readOnce(s);

  {
    uint16_t reg[1];
    if (mb_.readHoldingRegisters(co2SlaveId, co2Reg, 1, reg, 400)) {
      s.co2_ppm = reg[0];
      s.ok_co2 = true;
    }
  }

  {
    uint16_t reg[2];
    if (mb_.readHoldingRegisters(shtSlaveId, shtRegStart, 2, reg, 400)) {
      s.hum_rh_x10 = reg[0];
      s.temp_c_x10 = (int16_t)reg[1];
      s.ok_sht = true;
    }
  }

  s.voc_raw = voc_.readRaw();
  s.voc_avg_x10 = voc_.readAvgX10();

  return s;
}
