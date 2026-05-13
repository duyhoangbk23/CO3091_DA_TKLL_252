#include "ModbusRtu.h"

void ModbusRtuMaster::begin(HardwareSerial& serial, int rxPin, int txPin, uint32_t baud, int deRePin) {
  ser_ = &serial;
  deRePin_ = deRePin;
  ser_->begin(baud, SERIAL_8N1, rxPin, txPin);

  if (deRePin_ >= 0) {
    pinMode(deRePin_, OUTPUT);
    digitalWrite(deRePin_, LOW);
  }
}

uint16_t ModbusRtuMaster::crc16(const uint8_t* data, size_t len) {
  uint16_t crc = 0xFFFF;
  for (size_t i = 0; i < len; i++) {
    crc ^= data[i];
    for (int b = 0; b < 8; b++) {
      crc = (crc & 1) ? (crc >> 1) ^ 0xA001 : (crc >> 1);
    }
  }
  return crc;
}

void ModbusRtuMaster::txMode(bool enable) {
  if (deRePin_ < 0) return;
  digitalWrite(deRePin_, enable ? HIGH : LOW);
  delayMicroseconds(50);
}

bool ModbusRtuMaster::readHoldingRegisters(uint8_t slaveId, uint16_t startReg, uint16_t qty, uint16_t* outRegs, uint32_t timeoutMs) {
  if (!ser_ || !outRegs) return false;
  if (qty == 0 || qty > 60) return false;

  uint8_t req[8];
  req[0] = slaveId;
  req[1] = 0x03;
  req[2] = (startReg >> 8) & 0xFF;
  req[3] = startReg & 0xFF;
  req[4] = (qty >> 8) & 0xFF;
  req[5] = qty & 0xFF;
  uint16_t crc = crc16(req, 6);
  req[6] = crc & 0xFF;
  req[7] = (crc >> 8) & 0xFF;

  while (ser_->available()) ser_->read();

  txMode(true);
  ser_->write(req, sizeof(req));
  ser_->flush();
  delay(30);
  txMode(false);

  const uint8_t byteCount = (uint8_t)(2 * qty);
  const size_t respLen = 3 + byteCount + 2;
  uint8_t resp[128];
  if (respLen > sizeof(resp)) return false;

  size_t got = 0;
  uint32_t t0 = millis();
  while ((millis() - t0) < timeoutMs && got < respLen) {
    if (ser_->available()) resp[got++] = (uint8_t)ser_->read();
  }
  if (got != respLen) return false;

  if (resp[0] != slaveId) return false;
  if (resp[1] != 0x03) return false;
  if (resp[2] != byteCount) return false;

  uint16_t crcCalc = crc16(resp, respLen - 2);
  uint16_t crcRecv = (uint16_t)resp[respLen - 2] | ((uint16_t)resp[respLen - 1] << 8);
  if (crcCalc != crcRecv) return false;

  for (uint16_t i = 0; i < qty; i++) {
    outRegs[i] = ((uint16_t)resp[3 + 2 * i] << 8) | resp[3 + 2 * i + 1];
  }
  return true;
}
