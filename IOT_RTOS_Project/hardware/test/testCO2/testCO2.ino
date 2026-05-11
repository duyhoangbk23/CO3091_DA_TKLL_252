#include <Arduino.h>
#include <HardwareSerial.h>

static const uint8_t  SLAVE_ID = 1;
static const uint32_t BAUD     = 9600;

// ESP32 UART2 pins
static const int RS485_RX_PIN = 16; // RX2
static const int RS485_TX_PIN = 17; // TX2

HardwareSerial RS485(2);

// CRC16 Modbus (poly A001)
uint16_t crc16_modbus(const uint8_t* data, size_t len) {
  uint16_t crc = 0xFFFF;
  for (size_t i = 0; i < len; i++) {
    crc ^= data[i];
    for (int b = 0; b < 8; b++) {
      crc = (crc & 1) ? (crc >> 1) ^ 0xA001 : (crc >> 1);
    }
  }
  return crc;
}

bool read_holding_1reg(uint16_t reg, uint16_t& value_out, uint32_t timeout_ms = 300) {
  uint8_t req[8];
  req[0] = SLAVE_ID;
  req[1] = 0x03;
  req[2] = (reg >> 8) & 0xFF;
  req[3] = reg & 0xFF;
  req[4] = 0x00;
  req[5] = 0x01;

  uint16_t c = crc16_modbus(req, 6);
  req[6] = c & 0xFF;
  req[7] = (c >> 8) & 0xFF;

  // clear RX buffer
  while (RS485.available()) RS485.read();

  RS485.write(req, sizeof(req));
  RS485.flush();

  // Expected response 7 bytes:
  // [ID][FC][LEN=2][HI][LO][CRCLO][CRCHI]
  uint8_t resp[7];
  size_t got = 0;
  uint32_t t0 = millis();
  while ((millis() - t0) < timeout_ms && got < sizeof(resp)) {
    if (RS485.available()) {
      resp[got++] = (uint8_t)RS485.read();
    }
  }
  if (got != sizeof(resp)) return false;

  if (resp[0] != SLAVE_ID) return false;
  if (resp[1] != 0x03) return false;
  if (resp[2] != 0x02) return false;

  uint16_t crc_calc = crc16_modbus(resp, 5);
  uint16_t crc_recv = (uint16_t)resp[5] | ((uint16_t)resp[6] << 8);
  if (crc_calc != crc_recv) return false;

  value_out = ((uint16_t)resp[3] << 8) | resp[4];
  return true;
}

void setup() {
  Serial.begin(115200);
  RS485.begin(BAUD, SERIAL_8N1, RS485_RX_PIN, RS485_TX_PIN);
  Serial.println("ES-CO2-01 Read CO2 from reg 00001 (ID=1, 9600)");
}

void loop() {
  const uint16_t REG_CO2 = 0x0001; // thanh ghi số 1

  uint16_t co2_ppm = 0;
  bool ok = read_holding_1reg(REG_CO2, co2_ppm, 400);

  if (ok) {
    Serial.print("CO2 = ");
    Serial.print(co2_ppm);
    Serial.println(" ppm");
  } else {
    Serial.println("Read failed (timeout/CRC/ID/FC mismatch)");
  }

  delay(1000);
}
