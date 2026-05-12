#include <LiquidCrystal_I2C.h>
#include "tasks.h"
#include "global.h"
//#include "config.h"

void vTaskDisplay(void *pvParameters) {
    // Khởi tạo LCD theo địa chỉ 0x27 (Cần Wire.begin() trong setup nếu dùng chân tùy chỉnh)
    LiquidCrystal_I2C lcd(0x27, 16, 2);
    lcd.init();
    lcd.backlight();

    SensorData_t localData;
    bool toggle = false; // Biến để đảo hiển thị giữa các chỉ số khí

    for (;;) {
        // 1. Lấy dữ liệu an toàn từ Mutex
        if (xSemaphoreTake(xDataMutex, pdMS_TO_TICKS(100)) == pdPASS) {
            localData = g_LatestData;
            xSemaphoreGive(xDataMutex);
        }

        // 2. Dòng 0: Hiển thị Nhiệt độ & Độ ẩm (Cố định)
        lcd.setCursor(0, 0);
        lcd.print("T:"); lcd.print(localData.temperature, 1); 
        lcd.print("C H:"); lcd.print((int)localData.humidity); lcd.print("%   ");

        // 3. Dòng 1: Đảo hiển thị giữa (Chỉ số khí) và (Trạng thái hệ thống)
        lcd.setCursor(0, 1);
        if (toggle) {
            // Hiển thị nồng độ bụi và CO2
            lcd.print("P:"); lcd.print(localData.pm25);
            lcd.print(" CO2:"); lcd.print(localData.co2);
            lcd.print("    ");
        } else {
            // Hiển thị trạng thái cảnh báo theo alert_level
            if (localData.alert_level == 2) {
                lcd.print("STATUS: CRITICAL");
            } else if (localData.alert_level == 1) {
                lcd.print("STATUS: WARNING ");
            } else {
                lcd.print("STATUS: SAFE    ");
            }
        }

        toggle = !toggle; // Đảo trạng thái hiển thị sau mỗi chu kỳ
        vTaskDelay(pdMS_TO_TICKS(2000)); // Cập nhật và giữ màn hình 2 giây cho dễ đọc
    }
}