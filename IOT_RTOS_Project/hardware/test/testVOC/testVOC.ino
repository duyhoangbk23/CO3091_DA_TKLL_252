#include <Arduino.h>

static const int VOC_PIN = 34;   // ADC1

// Moving average đơn giản
static const int N = 20;
int buf[N];
int idx = 0;
long sum = 0;
bool inited = false;

void setup() {
  Serial.begin(115200);
  delay(200);

  analogReadResolution(12);                 // 0..4095
  analogSetPinAttenuation(VOC_PIN, ADC_11db);

  Serial.println("VOC analog test: VCC=3V3, GND, A->GPIO34(ADC1)");
  Serial.println("Warm-up: cho sensor chay 5-10 phut truoc khi ket luan.");
}

void loop() {
  int raw = analogRead(VOC_PIN);

  if (!inited) {
    for (int i = 0; i < N; i++) buf[i] = raw;
    sum = (long)raw * N;
    inited = true;
  }

  sum -= buf[idx];
  buf[idx] = raw;
  sum += buf[idx];
  idx = (idx + 1) % N;

  float avg = (float)sum / N;

  // [Suy luận] Quy đổi V chỉ tham khảo (ADC ESP32 cần calib nếu muốn chính xác tuyệt đối)
  float v_raw = (raw / 4095.0f) * 3.3f;
  float v_avg = (avg / 4095.0f) * 3.3f;

  Serial.print("RAW=");
  Serial.print(raw);
  Serial.print("  AVG=");
  Serial.print(avg, 1);
  Serial.print("  Vraw~");
  Serial.print(v_raw, 3);
  Serial.print("  Vavg~");
  Serial.println(v_avg, 3);

  delay(200);
}
