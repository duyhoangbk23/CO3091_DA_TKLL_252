#include <Arduino.h>
#include <HardwareSerial.h>
#include <Preferences.h>
#include "global.h"
#include "tasks.h"
#include "board_config.h"
#include "SensorHub.h"
#include "IaqEvaluator.h"
#include "ThresholdConfig.h"

extern HardwareSerial PMS;
extern HardwareSerial RS485;
extern SensorHub g_hub;
extern IaqEvaluator g_eval;
extern IaqController g_ctrl;
extern RuntimeControl_t g_RuntimeControl;
extern ThresholdConfig g_ThresholdConfig;

static void loadPersistentControlConfig() {
    Preferences prefs;
    prefs.begin("iaq_cfg", true);
    ThresholdConfig stored = defaultThresholdConfig();
    const size_t read = prefs.getBytes("thresholds", &stored, sizeof(stored));
    g_RuntimeControl.auto_control_enabled = prefs.getBool("auto", true);
    prefs.end();

    if (read == sizeof(stored) && validateThresholdConfig(stored)) {
        g_ThresholdConfig = stored;
        g_RuntimeControl.config_version = stored.config_version;
    } else {
        g_ThresholdConfig = defaultThresholdConfig();
        g_RuntimeControl.config_version = g_ThresholdConfig.config_version;
    }
}

// extern void vTaskRunAllTests(void *pvParameters);
void setup() {
    Serial.begin(115200);
    delay(200);

    g_hub.begin(PMS, PMS_RX_PIN, PMS_TX_PIN,
                RS485, RS485_RX_PIN, RS485_TX_PIN, RS485_DERE_PIN,
                VOC_PIN);
    loadPersistentControlConfig();
    g_eval.begin(5000);
    g_eval.setConfig(g_ThresholdConfig);
    g_eval.autoControlEnabled = g_RuntimeControl.auto_control_enabled;
    g_ctrl.begin();
    
    // Khởi tạo tập trung tất cả tài nguyên (Queue, Mutex, Semaphore)
    init_system_resources();

    // Tạo các Task (Ưu tiên dùng PinnedToCore cho ESP32)
#ifdef RUN_RTOS_TESTS
    xTaskCreate(vTaskRunAllTests, "Tests", 8192, NULL, 5, NULL);
#else
    xTaskCreatePinnedToCore(vTaskAlert,       "Task Alert",    2048, NULL, 5, NULL, 1);
    xTaskCreatePinnedToCore(vTaskSensorRead,  "Task Sensor",   4096, NULL, 4, NULL, 1);
    xTaskCreatePinnedToCore(vTaskDataProcess, "Task Process",  4096, NULL, 3, NULL, 1);
    xTaskCreatePinnedToCore(vTaskControl,     "Task Control",  8192, NULL, 3, NULL, 1);
    xTaskCreatePinnedToCore(vTaskMQTT,        "Task MQTT",     8192, NULL, 1, NULL, 0);
#endif
    Serial.println(">>> He thong da san sang!");
}

void loop() {
    // De trong vi RTOS quan ly luong thuc thi
    vTaskDelay(portMAX_DELAY);
}
