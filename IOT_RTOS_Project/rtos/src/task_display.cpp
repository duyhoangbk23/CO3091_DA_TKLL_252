#include <LiquidCrystal_I2C.h>
#include "tasks.h"
#include "global.h"

void vTaskDisplay(void *pvParameters) {
    // Khởi tạo LCD 16x2 với địa chỉ 0x27 (hoặc 0x3F tùy module)
    LiquidCrystal_I2C lcd(0x27, 16, 2);
    lcd.init();
    lcd.backlight();

    SensorData_t localData;

    for (;;) {
        // 1. Lấy dữ liệu an toàn từ Mutex
        if (xSemaphoreTake(xDataMutex, pdMS_TO_TICKS(100)) == pdPASS) {
            localData = g_LatestData;
            xSemaphoreGive(xDataMutex);
        }

        // 2. Hiển thị lên LCD
        lcd.setCursor(0, 0);
        lcd.print("T:"); lcd.print(localData.temperature, 1); lcd.print("C ");
        lcd.print("H:"); lcd.print(localData.humidity, 0); lcd.print("%");

        lcd.setCursor(0, 1);
        if (localData.alert_level == 2) {
            lcd.print("STATUS: DANGER  ");
        } else if (localData.alert_level == 1) {
            lcd.print("STATUS: WARNING ");
        } else {
            lcd.print("STATUS: OK      ");
        }

        vTaskDelay(pdMS_TO_TICKS(1000)); // Cập nhật mỗi 1s
    }
}