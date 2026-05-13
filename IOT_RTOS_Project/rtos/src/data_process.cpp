#include "tasks.h"
#include "global.h"
#include "IaqEvaluator.h"

// Sử dụng đối tượng evaluator và state đã khởi tạo toàn cục
extern IaqEvaluator g_eval;
extern IaqState g_iaq; 

void vTaskDataProcess(void *pvParameters) {
    SensorData_t receivedData;
    
    for (;;) {
        // 1. Đợi dữ liệu từ Sensor Task gửi qua Queue
        if (xQueueReceive(xSensorQueue, &receivedData, portMAX_DELAY) == pdPASS) {
            
            // --- BƯỚC TÍNH TOÁN QUAN TRỌNG NHẤT ---
            // Chuyển đổi SensorData_t sang SensorSample để nạp vào bộ máy của Đôn
            SensorSample sample;
            sample.ok_sht = !isnan(receivedData.temperature) && !isnan(receivedData.humidity);
            if (sample.ok_sht) {
                sample.temp_c_x10 = (int16_t)(receivedData.temperature * 10);
                sample.hum_rh_x10 = (uint16_t)(receivedData.humidity * 10);
            }
            sample.pm25_atm   = receivedData.pm25;
            sample.co2_ppm    = receivedData.co2;
            sample.voc_raw    = receivedData.voc;
            sample.voc_avg_x10 = receivedData.voc * 10;
            sample.ok_pms = receivedData.pm25 >= 0;
            sample.ok_co2 = receivedData.co2 != 0xFFFF;

            // Gọi "bộ não" tính toán của Đôn để phân tích trạng thái IAQ
            // newState chứa toàn bộ quyết định: bật máy lọc nào, đèn đỏ nào sáng
            IaqState newState = g_eval.evaluate(sample);

            // 2. Tổng hợp alert_level dựa trên kết quả tính toán
            uint8_t calculated_level = 0;
            if (newState.alarmCO2 || newState.alarmPM || newState.alarmVOC) {
                calculated_level = 2; // Mức báo động Đỏ
            } else if (newState.wantVent || newState.wantHepa || newState.wantCarbon) {
                calculated_level = 1; // Mức cảnh báo Vàng (đang xử lý môi trường)
            }
            receivedData.alert_level = calculated_level;

            // 3. Cập nhật dữ liệu vào biến toàn cục dưới sự bảo vệ của Mutex
            if (xSemaphoreTake(xDataMutex, pdMS_TO_TICKS(50)) == pdPASS) {
                g_LatestData = receivedData;
                
                // Dòng này chính là chìa khóa để 10 LED của Đôn hoạt động
                g_iaq = newState; 
                
                xSemaphoreGive(xDataMutex);
            }

            // 4. Kích hoạt Task Alert để thực thi việc bật/tắt LED ngay lập tức
            if (calculated_level > 0) {
                xSemaphoreGive(xAlertSem);
            }
        }
    }
}
