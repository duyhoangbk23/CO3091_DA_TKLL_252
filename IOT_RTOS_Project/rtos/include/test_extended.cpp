// ============================================================
//  test_extended.cpp
//  RTOS Test Mo Rong — chay tren PC (g++), khong can ESP32
//
//  Them cac test cho:
//    - MQTT message parsing (JSON protocol)
//    - DataProcess pipeline (Sensor -> Queue -> Process -> Global)
//    - DataProcess -> AlertSem activation
//    - ControlQueue command routing
//    - Concurrent Queue stress test
//
//  Compile & Run (Windows):
//    g++ -std=c++14 test_extended.cpp -o test_extended.exe && test_extended.exe
// ============================================================

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <stdint.h>
#include <math.h>
#include "test_mock.h"

// ---- Thresholds (mirror config.h) ----
#define TEMP_WARN  35.0f
#define TEMP_CRIT  40.0f
#define AQI_WARN   300
#define AQI_CRIT   500

// ---- SensorData_t (mirror global.h) ----
typedef struct {
    float    temperature;
    float    humidity;
    uint16_t air_quality;
    uint8_t  alert_level;
    int64_t  timestamp;
} SensorData_t;

// ---- Global Resources ----
QueueHandle_t     xSensorQueue  = nullptr;
QueueHandle_t     xControlQueue = nullptr;
SemaphoreHandle_t xDataMutex    = nullptr;
SemaphoreHandle_t xAlertSem     = nullptr;
SensorData_t      g_LatestData  = {0.0f, 0.0f, 0, 0, 0};

// ============================================================
//  Test Helpers
// ============================================================
static int test_total  = 0;
static int test_passed = 0;

#define GREEN "\033[32m"
#define RED   "\033[31m"
#define CYAN  "\033[36m"
#define RESET "\033[0m"
#define SEP   "  ------------------------------------------"

static void report(const char* name, bool ok) {
    test_total++;
    if (ok) { test_passed++; printf(GREEN "  [PASS]" RESET " %s\n", name); }
    else     { printf(RED   "  [FAIL]" RESET " %s  <-- XEM LAI\n", name); }
}

static void init_resources() {
    xSensorQueue  = xQueueCreate(5, sizeof(SensorData_t));
    xControlQueue = xQueueCreate(10, sizeof(char) * 20);
    xDataMutex    = xSemaphoreCreateMutex();
    xAlertSem     = xSemaphoreCreateCounting(10, 0);
    g_LatestData  = {0.0f, 0.0f, 0, 0, 0};
}

static void reset_resources() {
    xQueueReset(xSensorQueue);
    xQueueReset(xControlQueue);
    // Reset mutex neu bi giu
    xSemaphoreGive(xDataMutex);
    // Reset alert sem
    for (int i = 0; i < 10; i++) xCountingSemTake(xAlertSem, 0);
    g_LatestData = {0.0f, 0.0f, 0, 0, 0};
}

// ============================================================
//  MOCK: JSON Parser (Mo phong mqttClient.js parsing)
//  Parse payload dang: {"temp":27.30, "humi":65.00, "aqi":200, "alert":0, "ts":123456}
// ============================================================
static bool parse_mqtt_payload(const char* json, SensorData_t* out) {
    float    temp  = 0.0f, humi  = 0.0f;
    int      aqi   = 0,    alert = 0;
    long long ts   = 0;

    // sscanf don gian (du cho JSON phang khong long)
    int matched = sscanf(json,
        "{\"temp\":%f, \"humi\":%f, \"aqi\":%d, \"alert\":%d, \"ts\":%lld}",
        &temp, &humi, &aqi, &alert, &ts);

    if (matched < 4) return false;

    out->temperature = temp;
    out->humidity    = humi;
    out->air_quality = (uint16_t)aqi;
    out->alert_level = (uint8_t)alert;
    out->timestamp   = ts;
    return true;
}

// ============================================================
//  MOCK: DataProcess logic (mirror data_process.cpp)
// ============================================================
static uint8_t calc_alert_level(float temp, uint16_t aqi) {
    bool isCrit = (temp > TEMP_CRIT) || (aqi > AQI_CRIT);
    bool isWarn = (temp > TEMP_WARN) || (aqi > AQI_WARN);
    if (isCrit) return 2;
    if (isWarn) return 1;
    return 0;
}

/**
 * Mo phong logic cua vTaskDataProcess:
 *   - Lay 1 phan tu tu xSensorQueue
 *   - Tinh alert_level
 *   - Cap nhat g_LatestData qua Mutex
 *   - Give AlertSem neu co bao dong
 * Tra ve so lan Give AlertSem (0 = binh thuong)
 */
static int run_data_process_once() {
    SensorData_t data = {0};
    if (xQueueReceive(xSensorQueue, &data, 0) != pdPASS) return -1;

    data.alert_level = calc_alert_level(data.temperature, data.air_quality);
    int alert_count  = (int)data.alert_level;

    if (xSemaphoreTake(xDataMutex, 100) == pdPASS) {
        g_LatestData = data;
        xSemaphoreGive(xDataMutex);
    }

    for (int i = 0; i < alert_count; i++) {
        xCountingSemGive(xAlertSem);
    }

    return alert_count;
}

// ============================================================
//  TEST 10: MQTT JSON Parsing
// ============================================================
void test_mqtt_json_parsing() {
    printf("\n[TEST 10] MQTT JSON Parsing\n%s\n", SEP);

    SensorData_t out = {0};

    // Case binh thuong
    const char* valid = "{\"temp\":27.30, \"humi\":65.00, \"aqi\":200, \"alert\":0, \"ts\":1700000000}";
    bool ok = parse_mqtt_payload(valid, &out);
    report("Parse JSON hop le thanh cong",  ok);
    report("temperature = 27.30", fabsf(out.temperature - 27.30f) < 0.01f);
    report("humidity    = 65.00", fabsf(out.humidity    - 65.00f) < 0.01f);
    report("air_quality = 200",   out.air_quality == 200);
    report("alert_level = 0",     out.alert_level == 0);
    report("timestamp   = 1700000000", out.timestamp == 1700000000LL);

    // Case CRIT
    SensorData_t out2 = {0};
    const char* crit = "{\"temp\":42.10, \"humi\":55.00, \"aqi\":600, \"alert\":2, \"ts\":9999}";
    parse_mqtt_payload(crit, &out2);
    report("Parse CRIT: temp=42.10", fabsf(out2.temperature - 42.10f) < 0.01f);
    report("Parse CRIT: alert=2",    out2.alert_level == 2);

    // Case JSON khong hop le
    SensorData_t out3 = {0};
    bool fail_ok = !parse_mqtt_payload("INVALID_DATA", &out3);
    report("Parse JSON khong hop le tra ve false", fail_ok);
}

// ============================================================
//  TEST 11: DataProcess Pipeline (Sensor -> Process -> Global)
// ============================================================
void test_data_process_pipeline() {
    printf("\n[TEST 11] DataProcess Pipeline\n%s\n", SEP);
    reset_resources();

    // Dua du lieu binh thuong vao Queue
    SensorData_t input = {28.0f, 65.0f, 200, 0, 111LL};
    xQueueSend(xSensorQueue, &input, 0);

    int alerts = run_data_process_once();

    report("DataProcess: khong bi block (queue co data)",  alerts >= 0);
    report("g_LatestData.temperature duoc cap nhat",      fabsf(g_LatestData.temperature - 28.0f) < 0.01f);
    report("g_LatestData.humidity    duoc cap nhat",      fabsf(g_LatestData.humidity    - 65.0f) < 0.01f);
    report("g_LatestData.air_quality duoc cap nhat",      g_LatestData.air_quality == 200);
    report("alert_level = OK (0) khi binh thuong",        g_LatestData.alert_level == 0);
    report("AlertSem khong duoc kich hoat",               alerts == 0);
}

// ============================================================
//  TEST 12: DataProcess -> AlertSem khi WARN
// ============================================================
void test_data_process_warn() {
    printf("\n[TEST 12] DataProcess -> AlertSem khi WARN\n%s\n", SEP);
    reset_resources();

    SensorData_t warn_data = {36.5f, 60.0f, 200, 0, 222LL};
    xQueueSend(xSensorQueue, &warn_data, 0);

    int alerts = run_data_process_once();

    report("alert_level = WARN (1)",          g_LatestData.alert_level == 1);
    report("AlertSem duoc Give 1 lan",        alerts == 1);
    report("AlertSem count = 1 (co the Take)", xCountingSemTake(xAlertSem, 0) == pdPASS);
    report("AlertSem count = 0 sau Take",      xCountingSemTake(xAlertSem, 0) == pdFAIL);
}

// ============================================================
//  TEST 13: DataProcess -> AlertSem khi CRIT
// ============================================================
void test_data_process_crit() {
    printf("\n[TEST 13] DataProcess -> AlertSem khi CRIT\n%s\n", SEP);
    reset_resources();

    SensorData_t crit_data = {41.0f, 50.0f, 600, 0, 333LL};
    xQueueSend(xSensorQueue, &crit_data, 0);

    int alerts = run_data_process_once();

    report("alert_level = CRIT (2)",          g_LatestData.alert_level == 2);
    report("AlertSem duoc Give 2 lan",        alerts == 2);

    bool t1 = (xCountingSemTake(xAlertSem, 0) == pdPASS);
    bool t2 = (xCountingSemTake(xAlertSem, 0) == pdPASS);
    bool t3 = (xCountingSemTake(xAlertSem, 0) == pdFAIL);
    report("Co the Take 2 lan lien tiep",     t1 && t2);
    report("Take lan 3 that bai (count = 0)", t3);
}

// ============================================================
//  TEST 14: MQTT Payload -> Queue -> DataProcess full pipeline
// ============================================================
void test_full_mqtt_to_global_pipeline() {
    printf("\n[TEST 14] Full pipeline: MQTT Payload -> xSensorQueue -> g_LatestData\n%s\n", SEP);
    reset_resources();

    // Mo phong: MQTT nhan payload, parse, push vao SensorQueue
    const char* payload = "{\"temp\":33.50, \"humi\":72.00, \"aqi\":350, \"alert\":1, \"ts\":44444}";
    SensorData_t parsed = {0};
    bool parse_ok = parse_mqtt_payload(payload, &parsed);

    // Push vao SensorQueue (nhu vTaskMQTT gui data di)
    bool send_ok = (xQueueSend(xSensorQueue, &parsed, 0) == pdPASS);

    // vTaskDataProcess xu ly
    int alerts = run_data_process_once();

    report("Parse JSON thanh cong",            parse_ok);
    report("Push vao SensorQueue thanh cong",  send_ok);
    report("DataProcess doc duoc du lieu",     alerts >= 0);
    report("g_LatestData.temperature = 33.50", fabsf(g_LatestData.temperature - 33.50f) < 0.01f);
    report("g_LatestData.air_quality = 350",   g_LatestData.air_quality == 350);
    // AQI=350 > AQI_WARN=300 => WARN (1)
    report("alert_level = WARN (1) vi AQI > 300", g_LatestData.alert_level == 1);
    report("AlertSem duoc Give 1 lan",         alerts == 1);
}

// ============================================================
//  TEST 15: ControlQueue - Stress Test (10 lenh lien tiep)
// ============================================================
void test_control_queue_stress() {
    printf("\n[TEST 15] ControlQueue: Stress Test 10 lenh\n%s\n", SEP);
    reset_resources();

    const char* cmds[] = {
        "LED_RED_ON", "LED_RED_OFF", "LED_GRN_ON", "LED_GRN_OFF",
        "LED_YLW_ON", "BLINK_RED",  "BLINK_GRN",  "MUTE_ALARM",
        "TEST_LED",   "GET_STATUS"
    };
    int count = 10;

    // Gui het
    int sent = 0;
    for (int i = 0; i < count; i++) {
        char buf[20] = {0};
        strncpy(buf, cmds[i], 19);
        if (xQueueSend(xControlQueue, buf, 0) == pdPASS) sent++;
    }
    report("Gui duoc 10 lenh vao queue (size=10)", sent == 10);

    // Nhan het va kiem tra thu tu
    int received = 0;
    bool order_ok = true;
    for (int i = 0; i < count; i++) {
        char rx[20] = {0};
        if (xQueueReceive(xControlQueue, rx, 0) == pdPASS) {
            received++;
            if (strcmp(rx, cmds[i]) != 0) order_ok = false;
        }
    }
    report("Nhan duoc du 10 lenh",      received == 10);
    report("Thu tu FIFO chinh xac",     order_ok);
    report("Queue trong sau khi nhan",
           xQueueReceive(xControlQueue, nullptr, 0) == pdFAIL);
}

// ============================================================
//  TEST 16: Concurrent-style Read/Write Mutex (don luong)
// ============================================================
void test_mutex_rw_integrity() {
    printf("\n[TEST 16] Mutex: toan ven ghi/doc lien tiep 20 lan\n%s\n", SEP);
    reset_resources();

    bool all_ok = true;
    for (int i = 0; i < 20; i++) {
        float expected_temp = 20.0f + i;
        float expected_humi = 50.0f + i;

        if (xSemaphoreTake(xDataMutex, 100) == pdPASS) {
            g_LatestData.temperature = expected_temp;
            g_LatestData.humidity    = expected_humi;
            xSemaphoreGive(xDataMutex);
        }

        SensorData_t rd = {0};
        if (xSemaphoreTake(xDataMutex, 100) == pdPASS) {
            rd = g_LatestData;
            xSemaphoreGive(xDataMutex);
        }

        if (fabsf(rd.temperature - expected_temp) > 0.01f ||
            fabsf(rd.humidity    - expected_humi)  > 0.01f) {
            all_ok = false;
        }
    }
    report("20 vong ghi/doc Mutex: khong bi corrupt", all_ok);
}

// ============================================================
//  MAIN
// ============================================================
int main() {
    printf("==============================================\n");
    printf("  RTOS EXTENDED TEST SUITE (PC)\n");
    printf("  MQTT + DataProcess + Pipeline\n");
    printf("==============================================\n");

    init_resources();

    // Chay cac test mo rong
    test_mqtt_json_parsing();
    test_data_process_pipeline();
    test_data_process_warn();
    test_data_process_crit();
    test_full_mqtt_to_global_pipeline();
    test_control_queue_stress();
    test_mutex_rw_integrity();

    printf("\n==============================================\n");
    printf("  KET QUA: %d / %d test PASS\n", test_passed, test_total);
    if (test_passed == test_total) {
        printf(GREEN "  >> TAT CA PASS!\n" RESET);
    } else {
        printf(RED "  >> %d test FAIL — kiem tra lai!\n" RESET,
               test_total - test_passed);
    }
    printf("==============================================\n");

    return (test_passed == test_total) ? 0 : 1;
}
