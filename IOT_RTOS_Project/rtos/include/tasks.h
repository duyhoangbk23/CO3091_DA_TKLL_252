#ifndef TASKS_H
#define TASKS_H

#include <Arduino.h>

// 1. Task ưu tiên 5 (Cao nhất): Phát cảnh báo buzzer/LED khi vượt ngưỡng [cite: 13, 15]
void vTaskAlert(void *pvParameters);

// 2. Task ưu tiên 4: Đọc DHT22 + MQ-135 mỗi 2s và push vào Queue [cite: 13, 15]
void vTaskSensorRead(void *pvParameters);

// 3. Task ưu tiên 3: Kéo data từ Queue, lọc, chuẩn hoá, so ngưỡng [cite: 13, 15]
void vTaskDataProcess(void *pvParameters);

// 4. Task ưu tiên 2: Ghi dữ liệu ra màn hình LCD I2C 16x2 mỗi 1s [cite: 13, 15]
void vTaskDisplay(void *pvParameters);

// 5. Task ưu tiên 1 (Thấp nhất): Publish data lên MQTT broker mỗi 10s [cite: 13, 15]
void vTaskMQTT(void *pvParameters);

// 6. Task nhận lệnh từ Dashboard qua Queue và thực thi (MUTE_ALARM, TEST_LED, REBOOT)
void vTaskControl(void *pvParameters);

#endif // TASKS_H