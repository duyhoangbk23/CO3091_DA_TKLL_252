// ============================================================
//  test_pc.cpp
//  Test chay tren may tinh (g++) — khong can ESP32 board
//
//  Compile & Run:
//    g++ -std=c++14 test_pc.cpp -o test_pc && ./test_pc
//  Tren Windows:
//    g++ -std=c++14 test_pc.cpp -o test_pc.exe && test_pc.exe
// ============================================================

#include <stdio.h>
#include <string.h>
#include <stdint.h>
#include <math.h>
#include "test_mock.h"

// ---- Config (copy tu config.h, khong include Arduino.h) ----
#define TEMP_WARN  35.0f
#define TEMP_CRIT  40.0f
#define AQI_WARN   300
#define AQI_CRIT   500

// ---- SensorData_t (copy tu global.h) ----
typedef struct {
    float    temperature;
    float    humidity;
    uint16_t air_quality;
    uint8_t  alert_level;
    int64_t  timestamp;
} SensorData_t;

// ---- Bien gia lap global resources ----
QueueHandle_t     xSensorQueue  = nullptr;
QueueHandle_t     xControlQueue = nullptr;
SemaphoreHandle_t xDataMutex    = nullptr;
SemaphoreHandle_t xAlertSem     = nullptr;
SensorData_t      g_LatestData  = {0.0f, 0.0f, 0, 0, 0};

// ============================================================
//  Helpers
// ============================================================
static int test_total  = 0;
static int test_passed = 0;

#define SEP "  ------------------------------------------"
#define GREEN "\033[32m"
#define RED   "\033[31m"
#define RESET "\033[0m"

static void report(const char* name, bool ok) {
    test_total++;
    if (ok) {
        test_passed++;
        printf(GREEN "  [PASS]" RESET " %s\n", name);
    } else {
        printf(RED   "  [FAIL]" RESET " %s  <-- XEM LAI\n", name);
    }
}

static void init_resources() {
    xSensorQueue  = xQueueCreate(5, sizeof(SensorData_t));
    xControlQueue = xQueueCreate(5, sizeof(char) * 20);
    xDataMutex    = xSemaphoreCreateMutex();
    xAlertSem     = xSemaphoreCreateCounting(10, 0);
}

// ============================================================
//  TEST 1: Khoi tao tai nguyen
// ============================================================
void test_resources_init() {
    printf("\n[TEST 1] Khoi tao tai nguyen RTOS\n%s\n", SEP);

    report("xSensorQueue  != NULL", xSensorQueue  != nullptr);
    report("xControlQueue != NULL", xControlQueue != nullptr);
    report("xDataMutex    != NULL", xDataMutex    != nullptr);
    report("xAlertSem     != NULL", xAlertSem     != nullptr);
}

// ============================================================
//  TEST 2: SensorQueue — gui va nhan du lieu
// ============================================================
void test_sensor_queue() {
    printf("\n[TEST 2] SensorQueue: gui va nhan du lieu\n%s\n", SEP);

    xQueueReset(xSensorQueue);

    SensorData_t tx = {32.5f, 70.0f, 350, 1, 123456789LL};
    SensorData_t rx = {0};

    report("xQueueSend thanh cong",
           xQueueSend(xSensorQueue, &tx, 0) == pdPASS);

    report("xQueueReceive thanh cong",
           xQueueReceive(xSensorQueue, &rx, 100) == pdPASS);

    report("temperature khop (32.5)", rx.temperature == 32.5f);
    report("humidity    khop (70.0)", rx.humidity    == 70.0f);
    report("air_quality khop (350)",  rx.air_quality == 350);
    report("alert_level khop (1)",    rx.alert_level == 1);
    report("timestamp   khop",        rx.timestamp   == 123456789LL);
}

// ============================================================
//  TEST 3: SensorQueue — tran queue (queue full)
// ============================================================
void test_queue_overflow() {
    printf("\n[TEST 3] SensorQueue: xu ly tran queue\n%s\n", SEP);

    xQueueReset(xSensorQueue);

    SensorData_t dummy = {25.0f, 60.0f, 200, 0, 0};
    int sent_count = 0;

    // Queue size = 5, thu gui 6 lan
    for (int i = 0; i < 6; i++) {
        if (xQueueSend(xSensorQueue, &dummy, 0) == pdPASS) sent_count++;
    }

    report("Queue chi nhan dung 5 phan tu", sent_count == 5);
    xQueueReset(xSensorQueue);
}

// ============================================================
//  TEST 4: ControlQueue — gui lenh string
// ============================================================
void test_control_queue() {
    printf("\n[TEST 4] ControlQueue: gui lenh string\n%s\n", SEP);

    xQueueReset(xControlQueue);

    char cmd_tx[20] = "GET_STATUS";
    char cmd_rx[20] = {0};

    report("xQueueSend lenh 'GET_STATUS'",
           xQueueSend(xControlQueue, cmd_tx, 0) == pdPASS);

    report("xQueueReceive lenh thanh cong",
           xQueueReceive(xControlQueue, cmd_rx, 100) == pdPASS);

    report("Noi dung lenh khop",
           strcmp(cmd_rx, "GET_STATUS") == 0);

    // Test tat ca lenh hop le
    const char* valid_cmds[] = {
        "MUTE_ALARM", "TEST_LED",  "REBOOT",
        "LED_RED_ON", "LED_RED_OFF", "LED_YLW_ON", "LED_YLW_OFF",
        "LED_GRN_ON", "LED_GRN_OFF",
        "BLINK_RED",  "BLINK_YLW", "BLINK_GRN",
        "GET_STATUS"
    };

    bool all_fit = true;
    for (auto& cmd : valid_cmds) {
        if (strlen(cmd) >= 20) { all_fit = false; break; }
    }
    report("Tat ca lenh hop le co do dai < 20 ky tu", all_fit);
}

// ============================================================
//  TEST 5: Mutex — bao ve g_LatestData
// ============================================================
void test_mutex() {
    printf("\n[TEST 5] Mutex: bao ve g_LatestData\n%s\n", SEP);

    report("xSemaphoreTake thanh cong",
           xSemaphoreTake(xDataMutex, 100) == pdPASS);

    // Ghi du lieu khi dang giu mutex
    g_LatestData.temperature = 99.9f;
    g_LatestData.humidity    = 88.8f;
    g_LatestData.air_quality = 999;
    g_LatestData.alert_level = 2;
    g_LatestData.timestamp   = 999999LL;

    report("xSemaphoreGive thanh cong",
           xSemaphoreGive(xDataMutex) == pdPASS);

    // Doc lai va kiem tra
    SensorData_t local = {0};
    if (xSemaphoreTake(xDataMutex, 100) == pdPASS) {
        local = g_LatestData;
        xSemaphoreGive(xDataMutex);
    }

    report("Ghi/Doc qua Mutex khong bi corrupt",
           local.temperature == 99.9f &&
           local.humidity    == 88.8f &&
           local.air_quality == 999   &&
           local.alert_level == 2     &&
           local.timestamp   == 999999LL);

    // Reset
    if (xSemaphoreTake(xDataMutex, 100) == pdPASS) {
        g_LatestData = {0.0f, 0.0f, 0, 0, 0};
        xSemaphoreGive(xDataMutex);
    }
}

// ============================================================
//  TEST 6: Mutex — timeout khi bi giu qua lau
// ============================================================
void test_mutex_timeout() {
    printf("\n[TEST 6] Mutex: timeout neu bi giu qua lau\n%s\n", SEP);

    // Lay mutex nhung KHONG tra lai
    xSemaphoreTake(xDataMutex, portMAX_DELAY);

    // Thu lay lan 2 — phai that bai
    report("Mutex tra ve FAIL khi da bi giu",
           xSemaphoreTake(xDataMutex, 50) == pdFAIL);

    // Tra mutex lai
    xSemaphoreGive(xDataMutex);

    // Sau khi tra — phai lay duoc binh thuong
    report("Mutex lay duoc sau khi da tra",
           xSemaphoreTake(xDataMutex, 50) == pdPASS);
    xSemaphoreGive(xDataMutex);
}

// ============================================================
//  TEST 7: AlertSemaphore — counting semaphore
// ============================================================
void test_alert_semaphore() {
    printf("\n[TEST 7] AlertSemaphore: counting semaphore\n%s\n", SEP);

    // Give 3 lan (mo phong 3 loi lien tiep)
    xCountingSemGive(xAlertSem);
    xCountingSemGive(xAlertSem);
    xCountingSemGive(xAlertSem);

    bool t1 = (xCountingSemTake(xAlertSem, 10) == pdPASS);
    bool t2 = (xCountingSemTake(xAlertSem, 10) == pdPASS);
    bool t3 = (xCountingSemTake(xAlertSem, 10) == pdPASS);
    report("Give 3 lan -> Take 3 lan thanh cong", t1 && t2 && t3);

    // Lan thu 4 phai that bai
    report("Take lan 4 tra ve FAIL (semaphore = 0)",
           xCountingSemTake(xAlertSem, 10) == pdFAIL);

    // Give den max (10) kiem tra khong tran
    for (int i = 0; i < 10; i++) xCountingSemGive(xAlertSem);
    report("Give qua max (10) bi chan lai",
           xCountingSemGive(xAlertSem) == pdFAIL);

    // Reset
    for (int i = 0; i < 10; i++) xCountingSemTake(xAlertSem, 0);
}

// ============================================================
//  TEST 8: Logic nguong canh bao
// ============================================================
void test_threshold_logic() {
    printf("\n[TEST 8] Logic nguong canh bao (OK / WARN / CRIT)\n%s\n", SEP);

    auto calc_level = [](float temp, int aqi) -> uint8_t {
        bool isCrit = (temp > TEMP_CRIT) || (aqi > AQI_CRIT);
        bool isWarn = (temp > TEMP_WARN) || (aqi > AQI_WARN);
        if (isCrit) return 2;
        if (isWarn) return 1;
        return 0;
    };

    // Kiem tra bien (boundary values)
    report("T=30,  AQI=100  -> OK(0)",   calc_level(30.0f, 100) == 0);
    report("T=35,  AQI=100  -> OK(0)",   calc_level(35.0f, 100) == 0); // dung bang nguong, chua qua
    report("T=35.1,AQI=100  -> WARN(1)", calc_level(35.1f, 100) == 1);
    report("T=30,  AQI=300  -> OK(0)",   calc_level(30.0f, 300) == 0); // dung bang nguong
    report("T=30,  AQI=301  -> WARN(1)", calc_level(30.0f, 301) == 1);
    report("T=40,  AQI=100  -> WARN(1)", calc_level(40.0f, 100) == 1); // dung bang CRIT, chua qua
    report("T=40.1,AQI=100  -> CRIT(2)", calc_level(40.1f, 100) == 2);
    report("T=30,  AQI=500  -> WARN(1)", calc_level(30.0f, 500) == 1); // dung bang CRIT
    report("T=30,  AQI=501  -> CRIT(2)", calc_level(30.0f, 501) == 2);
    report("T=41,  AQI=600  -> CRIT(2)", calc_level(41.0f, 600) == 2);
}

// ============================================================
//  TEST 9: SensorData_t struct layout
// ============================================================
void test_struct_layout() {
    printf("\n[TEST 9] SensorData_t struct layout\n%s\n", SEP);

    report("sizeof(temperature) == 4", sizeof(float)    == 4);
    report("sizeof(humidity)    == 4", sizeof(float)    == 4);
    report("sizeof(air_quality) == 2", sizeof(uint16_t) == 2);
    report("sizeof(alert_level) == 1", sizeof(uint8_t)  == 1);
    report("sizeof(timestamp)   == 8", sizeof(int64_t)  == 8);

    SensorData_t s = {0};
    report("Khoi tao zero-init hop le", s.temperature == 0.0f &&
                                        s.humidity    == 0.0f &&
                                        s.air_quality == 0    &&
                                        s.alert_level == 0    &&
                                        s.timestamp   == 0);
}

// ============================================================
//  MAIN
// ============================================================
int main() {
    printf("==============================================\n");
    printf("  RTOS TEST SUITE (PC) — khong can ESP32\n");
    printf("==============================================\n");

    init_resources();

    test_resources_init();
    test_sensor_queue();
    test_queue_overflow();
    test_control_queue();
    test_mutex();
    test_mutex_timeout();
    test_alert_semaphore();
    test_threshold_logic();
    test_struct_layout();

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