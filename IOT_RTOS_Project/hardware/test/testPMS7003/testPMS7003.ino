#include <Arduino.h>
#include <HardwareSerial.h>

HardwareSerial PMS(1);

// ====== CHÂN UART1 (remap) ======
static const int PMS_RX_PIN = 26;   // ESP32 nhận từ TX của PMS
static const int PMS_TX_PIN = 27;   // ESP32 gửi đến RX của PMS
static const uint32_t PMS_BAUD = 9600;

// ====== PMS7003 frame ======
// PMS7003 thường gửi frame 32 bytes bắt đầu: 0x42 0x4D
static const size_t PMS_FRAME_LEN = 32;

static inline uint16_t u16be(const uint8_t *p) {
  return ((uint16_t)p[0] << 8) | p[1];
}

static bool checksum_ok(const uint8_t *buf, size_t len) {
  // checksum = sum bytes [0..len-3], so sánh với 2 byte cuối
  uint16_t sum = 0;
  for (size_t i = 0; i < len - 2; i++) sum += buf[i];
  uint16_t chk = u16be(&buf[len - 2]);
  return sum == chk;
}

static void dump_hex(const uint8_t *buf, size_t len) {
  for (size_t i = 0; i < len; i++) {
    if (buf[i] < 16) Serial.print('0');
    Serial.print(buf[i], HEX);
    Serial.print(' ');
  }
  Serial.println();
}

static bool read_pms_frame(uint8_t *frame, size_t len, uint32_t timeout_ms = 2000) {
  size_t i = 0;
  uint32_t t0 = millis();

  // Tìm header 0x42 0x4D
  while (millis() - t0 < timeout_ms) {
    if (!PMS.available()) continue;
    uint8_t b = (uint8_t)PMS.read();

    if (i == 0) {
      if (b != 0x42) continue;
      frame[i++] = b;
      continue;
    }
    if (i == 1) {
      if (b != 0x4D) { i = 0; continue; }
      frame[i++] = b;
      continue;
    }

    frame[i++] = b;
    if (i >= len) return true;
  }
  return false;
}

void setup() {
  Serial.begin(115200);
  delay(200);

  PMS.begin(PMS_BAUD, SERIAL_8N1, PMS_RX_PIN, PMS_TX_PIN);

  Serial.println("\n=== PMS7003 TEST (UART1 remap) ===");
  Serial.print("Serial1 RX = GPIO"); Serial.println(PMS_RX_PIN);
  Serial.print("Serial1 TX = GPIO"); Serial.println(PMS_TX_PIN);
  Serial.println("Baud = 9600, Frame = 32 bytes (0x42 0x4D ...)");
  Serial.println("Waiting for sensor frames...\n");
}

void loop() {
  uint8_t f[PMS_FRAME_LEN];

  if (!read_pms_frame(f, sizeof(f))) {
    Serial.println("Timeout: no PMS frame. (Check 5V power, GND common, TX->GPIO26)");
    delay(500);
    return;
  }

  uint16_t frame_len = u16be(&f[2]); // thường là 0x001C (=28)
  bool ok = checksum_ok(f, sizeof(f));

  if (!ok) {
    Serial.print("Bad checksum. frame_len=");
    Serial.print(frame_len);
    Serial.print("  RAW: ");
    dump_hex(f, sizeof(f));
    return;
  }

  // Layout phổ biến của PMSx003/PMS7003:
  // 10..15: PM1.0/PM2.5/PM10 (atmospheric environment)
  uint16_t pm1  = u16be(&f[10]);
  uint16_t pm25 = u16be(&f[12]);
  uint16_t pm10 = u16be(&f[14]);

  // 4..9: PM1.0/PM2.5/PM10 (standard particles) (tùy bạn có muốn in)
  uint16_t pm1_std  = u16be(&f[4]);
  uint16_t pm25_std = u16be(&f[6]);
  uint16_t pm10_std = u16be(&f[8]);

  Serial.print("len=");
  Serial.print(frame_len);

  Serial.print(" | PM(atm) 1.0=");
  Serial.print(pm1);
  Serial.print(" 2.5=");
  Serial.print(pm25);
  Serial.print(" 10=");
  Serial.print(pm10);

  Serial.print(" | PM(std) 1.0=");
  Serial.print(pm1_std);
  Serial.print(" 2.5=");
  Serial.print(pm25_std);
  Serial.print(" 10=");
  Serial.println(pm10_std);

  delay(1000);
}
