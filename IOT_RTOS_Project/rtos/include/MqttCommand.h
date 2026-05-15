#ifndef MQTT_COMMAND_H
#define MQTT_COMMAND_H

#include <ArduinoJson.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

inline void normalizeControlPayload(const uint8_t* payload, unsigned int length, char* cmd, size_t cmdSize) {
    if (!payload || !cmd || cmdSize == 0) {
        return;
    }

    cmd[0] = '\0';

    char raw[128] = {0};
    const size_t len = length >= sizeof(raw) ? sizeof(raw) - 1 : length;
    memcpy(raw, payload, len);

    StaticJsonDocument<128> doc;
    DeserializationError error = deserializeJson(doc, raw);

    if (!error) {
        const char* jsonCmd = doc["command"] | "";
        if (strlen(jsonCmd) > 0) {
            strncpy(cmd, jsonCmd, cmdSize - 1);
            cmd[cmdSize - 1] = '\0';
            return;
        }
    }

    strncpy(cmd, raw, cmdSize - 1);
    cmd[cmdSize - 1] = '\0';
}

#endif
