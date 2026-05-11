#pragma once
#include <Arduino.h>
#include <HardwareSerial.h>
#include "SensorTypes.h"
#include "Pms7003.h"
#include "ModbusRtu.h"
#include "VocAnalog.h"

// Reads all sensors and produces a unified SensorSample.
class SensorHub {
public:
  void begin(HardwareSerial& pmsSer, int pmsRx, int pmsTx,
             HardwareSerial& rs485Ser, int rsRx, int rsTx, int rsDeRePin,
             int vocPin);

  // Read once. Any missing sensor keeps "missing" values and ok flags false.
  SensorSample readSample();

  // You can adjust these if your device uses different IDs / registers.
  uint8_t co2SlaveId = 1;
  uint16_t co2Reg = 0x0001;

  uint8_t shtSlaveId = 2;
  uint16_t shtRegStart = 0x0000;

private:
  Pms7003Reader pms_;
  ModbusRtuMaster mb_;
  VocAnalog voc_;
};
