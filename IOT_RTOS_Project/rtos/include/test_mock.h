#pragma once
// ============================================================
//  freertos_mock.h
//  Gia lap FreeRTOS API de chay test tren may tinh (g++)
//  Khong can ESP32 board that
// ============================================================

#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include <stdio.h>
#include <queue>
#include <mutex>
#include <vector>

// --- Types ---
typedef bool     BaseType_t;
typedef uint32_t TickType_t;
#define pdPASS   true
#define pdFAIL   false
#define pdTRUE   true
#define portMAX_DELAY 0xFFFFFFFF

#define pdMS_TO_TICKS(ms) (ms)

// --- Queue ---
struct QueueMock {
    std::queue<std::vector<uint8_t>> q;
    size_t item_size;
    size_t max_items;
};
typedef QueueMock* QueueHandle_t;

inline QueueHandle_t xQueueCreate(int max_items, int item_size) {
    QueueMock* q = new QueueMock();
    q->item_size  = item_size;
    q->max_items  = max_items;
    return q;
}

inline BaseType_t xQueueSend(QueueHandle_t q, const void* item, TickType_t) {
    if (!q || q->q.size() >= q->max_items) return pdFAIL;
    std::vector<uint8_t> buf((uint8_t*)item, (uint8_t*)item + q->item_size);
    q->q.push(buf);
    return pdPASS;
}

inline BaseType_t xQueueReceive(QueueHandle_t q, void* buf, TickType_t) {
    if (!q || q->q.empty()) return pdFAIL;
    memcpy(buf, q->q.front().data(), q->item_size);
    q->q.pop();
    return pdPASS;
}

inline void xQueueReset(QueueHandle_t q) {
    if (q) while (!q->q.empty()) q->q.pop();
}

// --- Mutex ---
struct MutexMock {
    std::mutex m;
    bool locked = false;
};
typedef MutexMock* SemaphoreHandle_t;

inline SemaphoreHandle_t xSemaphoreCreateMutex() {
    return new MutexMock();
}

inline BaseType_t xSemaphoreTake(SemaphoreHandle_t s, TickType_t timeout) {
    if (!s) return pdFAIL;
    if (s->locked) return pdFAIL;   // timeout mock: langay tra FAIL neu dang bi giu
    s->locked = true;
    return pdPASS;
}

inline BaseType_t xSemaphoreGive(SemaphoreHandle_t s) {
    if (!s) return pdFAIL;
    s->locked = false;
    return pdPASS;
}

// --- Counting Semaphore ---
struct CountingSemMock {
    int count;
    int max_count;
    bool locked = false;  // dung chung SemaphoreHandle_t
};

inline SemaphoreHandle_t xSemaphoreCreateCounting(int max_count, int init) {
    CountingSemMock* s = new CountingSemMock();
    s->count     = init;
    s->max_count = max_count;
    s->locked    = false;
    return (SemaphoreHandle_t)s;
}

// Override Take/Give cho counting sem — detect bang locked=false va count
inline BaseType_t xCountingSemTake(SemaphoreHandle_t s, TickType_t) {
    CountingSemMock* cs = (CountingSemMock*)s;
    if (cs->count <= 0) return pdFAIL;
    cs->count--;
    return pdPASS;
}

inline BaseType_t xCountingSemGive(SemaphoreHandle_t s) {
    CountingSemMock* cs = (CountingSemMock*)s;
    if (cs->count >= cs->max_count) return pdFAIL;
    cs->count++;
    return pdPASS;
}