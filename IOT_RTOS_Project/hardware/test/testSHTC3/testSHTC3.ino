#include <Arduino.h>
#include <HardwareSerial.h>

static const uint8_t  SLAVE_ID = 2;
static const uint32_t BAUD     = 9600;

// ESP32 UART2
static const int RS485_RX_PIN = 16;
static const int RS485_TX_PIN = 17;

HardwareSerial RS485(2);

// ===== CRC16 Modbus (A001) =====
uint16_t modbus_crc16(const uint8_t* data, size_t len) {
  uint16_t crc = 0xFFFF;
  for (size_t i = 0; i < len; i++) {
    crc ^= data[i];
    for (int b = 0; b < 8; b++) {
      crc = (crc & 1) ? (crc >> 1) ^ 0xA001 : (crc >> 1);
    }
  }
  return crc;
}

bool read_holding_regs(uint16_t startReg, uint16_t qty, uint16_t* outRegs, uint32_t timeout_ms = 400) {
  if (qty == 0 || qty > 60) return false;

  uint8_t req[8];
  req[0] = SLAVE_ID;
  req[1] = 0x03;
  req[2] = (startReg >> 8) & 0xFF;
  req[3] = (startReg) & 0xFF;
  req[4] = (qty >> 8) & 0xFF;
  req[5] = (qty) & 0xFF;
  uint16_t crc = modbus_crc16(req, 6);
  req[6] = crc & 0xFF;
  req[7] = (crc >> 8) & 0xFF;

  while (RS485.available()) RS485.read();
  RS485.write(req, 8);
  RS485.flush();

  const uint8_t byteCount = 2 * qty;
  const size_t respLen = 3 + byteCount + 2;

  uint8_t resp[128];
  if (respLen > sizeof(resp)) return false;

  size_t got = 0;
  uint32_t t0 = millis();
  while ((millis() - t0) < timeout_ms && got < respLen) {
    if (RS485.available()) resp[got++] = (uint8_t)RS485.read();
  }
  if (got != respLen) return false;

  if (resp[0] != SLAVE_ID) return false;
  if (resp[1] != 0x03) return false;
  if (resp[2] != byteCount) return false;

  uint16_t crcCalc = modbus_crc16(resp, respLen - 2);
  uint16_t crcRecv = (uint16_t)resp[respLen - 2] | ((uint16_t)resp[respLen - 1] << 8);
  if (crcCalc != crcRecv) return false;

  for (uint16_t i = 0; i < qty; i++) {
    uint8_t hi = resp[3 + 2 * i];
    uint8_t lo = resp[3 + 2 * i + 1];
    outRegs[i] = ((uint16_t)hi << 8) | lo;
  }
  return true;
}

void setup() {
  Serial.begin(115200);
  RS485.begin(BAUD, SERIAL_8N1, RS485_RX_PIN, RS485_TX_PIN);
  RS485.setTimeout(400);

  Serial.println("SHTC3 RS485 test (ID=2, 9600) - read reg 0x0000..0x0001");
}

void loop() {
  uint16_t regs[2];

  // reg 0x0000: humidity*10, reg 0x0001: temp*10 
  bool ok = read_holding_regs(0x0000, 2, regs, 500);

  if (!ok) {
    Serial.println("Read failed (timeout/CRC/frame mismatch).");
  } else {
    float humidity = regs[0] / 10.0f;

    // temp có thể âm: dùng int16 để đúng 2's complement 
    int16_t t10 = (int16_t)regs[1];
    float tempC = t10 / 10.0f;

    Serial.print("Humidity = "); Serial.print(humidity, 1); Serial.println(" %RH");
    Serial.print("Temp     = "); Serial.print(tempC, 1);    Serial.println(" C");
  }

  Serial.println("----");
  delay(1000);
}
