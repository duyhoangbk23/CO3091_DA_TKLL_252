#pragma once
#include <Arduino.h>
#include <HardwareSerial.h>

class ModbusRtuMaster {
public:
  // deRePin: set to -1 if your RS485 module is auto-direction.
  void begin(HardwareSerial& serial, int rxPin, int txPin, uint32_t baud = 9600, int deRePin = -1);

  bool readHoldingRegisters(uint8_t slaveId, uint16_t startReg, uint16_t qty, uint16_t* outRegs, uint32_t timeoutMs = 400);

private:
  HardwareSerial* ser_ = nullptr;
  int deRePin_ = -1;

  static uint16_t crc16(const uint8_t* data, size_t len);
  void txMode(bool enable);
};
