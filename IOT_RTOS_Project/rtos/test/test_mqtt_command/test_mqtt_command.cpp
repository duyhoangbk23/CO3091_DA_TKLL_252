#include <unity.h>
#include <stdint.h>
#include <string.h>

#include "MqttCommand.h"

void setUp() {}
void tearDown() {}

static void normalize(const char* payload, char* out, size_t outSize) {
    normalizeControlPayload(
        reinterpret_cast<const uint8_t*>(payload),
        static_cast<unsigned int>(strlen(payload)),
        out,
        outSize
    );
}

void test_extracts_command_from_json_payload() {
    char cmd[20] = {0};
    normalize("{\"device_id\":\"esp32_device\",\"command\":\"LED_ON\"}", cmd, sizeof(cmd));
    TEST_ASSERT_EQUAL_STRING("LED_ON", cmd);
}

void test_accepts_raw_command_payload() {
    char cmd[20] = {0};
    normalize("GET_STATUS", cmd, sizeof(cmd));
    TEST_ASSERT_EQUAL_STRING("GET_STATUS", cmd);
}

void test_truncates_oversized_command_safely() {
    char cmd[8] = {0};
    normalize("{\"command\":\"ALARM_TEMP_ON\"}", cmd, sizeof(cmd));
    TEST_ASSERT_EQUAL_STRING("ALARM_T", cmd);
}

int main() {
    UNITY_BEGIN();
    RUN_TEST(test_extracts_command_from_json_payload);
    RUN_TEST(test_accepts_raw_command_payload);
    RUN_TEST(test_truncates_oversized_command_safely);
    return UNITY_END();
}
