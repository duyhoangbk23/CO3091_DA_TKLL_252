#include "tasks.h"
#include "global.h"
#include "IaqController.h"
#include "IaqEvaluator.h"
#include "Pins.h" // Chứa định nghĩa 10 LED và hàm ledWrite

// Sử dụng đối tượng điều khiển toàn cục
extern IaqController g_ctrl;
// Trạng thái IAQ chi tiết được cập nhật từ Task Process
extern IaqState g_iaq; 

void vTaskAlert(void *pvParameters) {
    // 1. Khởi tạo 10 chân LED thông qua Controller của Đôn
    g_ctrl.begin();
    

    for (;;) {
        // 2. Kiểm tra Semaphore để cập nhật trạng thái tức thời khi có biến động
        // Nếu không có biến động, vẫn cập nhật mỗi 500ms để đảm bảo LED đúng trạng thái
        xSemaphoreTake(xAlertSem, pdMS_TO_TICKS(500));

        // 3. Lấy dữ liệu an toàn để điều khiển dàn LED
        if (xSemaphoreTake(xDataMutex, pdMS_TO_TICKS(50)) == pdPASS) {
            
            // Sử dụng hàm apply để điều khiển 10 LED dựa trên trạng thái IAQ
            // - 5 LED Xanh (HEPA, VENT, CARBON, AC, HUMID) sáng khi cần xử lý môi trường
            // - 5 LED Đỏ (CO2, PM, VOC, TEMP, RH) sáng khi thông số chạm ngưỡng ALARM
            g_ctrl.apply(g_iaq); 
            
            xSemaphoreGive(xDataMutex);
        }

        // 4. Logic bổ sung: Nếu có bất kỳ báo động Đỏ nào, có thể cho nháy LED để gây chú ý
        if (g_iaq.alarmCO2 || g_iaq.alarmPM || g_iaq.alarmVOC || g_iaq.alarmTemp || g_iaq.alarmRH) {
            // Giữ đèn sáng trong 300ms rồi lặp lại để tạo hiệu ứng cảnh báo
            vTaskDelay(pdMS_TO_TICKS(300));
        } else {
            vTaskDelay(pdMS_TO_TICKS(100));
        }
    }
}