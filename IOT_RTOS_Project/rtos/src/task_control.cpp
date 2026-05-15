#include <Arduino.h>
#include <string.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include "tasks.h"
#include "global.h"
#include "IaqController.h"
#include "IaqEvaluator.h"
#include "ThresholdConfig.h"
#include "mqtt_topics.h"

extern IaqController g_ctrl;
extern IaqEvaluator g_eval;

static const char* deviceKeys[] = {"hepa", "vent", "carbon", "ac", "humid"};

static void publishAck(const char* command, bool ok, const char* message, const char* commandId = "") {
    if (!mqttClient.connected()) return;

    StaticJsonDocument<768> doc;
    doc["device_id"] = DEVICE_ID;
    doc["command"] = command;
    doc["command_id"] = commandId;
    doc["status"] = ok ? "success" : "error";
    doc["message"] = message;
    doc["auto_control_enabled"] = g_RuntimeControl.auto_control_enabled;
    doc["config_version"] = g_RuntimeControl.config_version;

    JsonObject devices = doc.createNestedObject("devices");
    devices["hepa"] = g_iaq.wantHepa;
    devices["vent"] = g_iaq.wantVent;
    devices["carbon"] = g_iaq.wantCarbon;
    devices["ac"] = g_iaq.wantAc;
    devices["humid"] = g_iaq.wantHumid;

    char buffer[768];
    serializeJson(doc, buffer, sizeof(buffer));
    mqttClient.publish(MQTT_TOPIC_DEVICE_STATUS, buffer);
}

static void publishThresholdConfig(const char* command = "GET_THRESHOLDS", const char* commandId = "") {
    if (!mqttClient.connected()) return;

    StaticJsonDocument<1024> doc;
    doc["device_id"] = DEVICE_ID;
    doc["command"] = command;
    doc["command_id"] = commandId;
    doc["status"] = "success";
    doc["auto_control_enabled"] = g_RuntimeControl.auto_control_enabled;
    doc["config_version"] = g_RuntimeControl.config_version;
    JsonObject t = doc.createNestedObject("thresholds");
    t["schema_version"] = g_ThresholdConfig.schema_version;
    t["config_version"] = g_ThresholdConfig.config_version;
    t["co2_on"] = g_ThresholdConfig.co2_on;
    t["co2_off"] = g_ThresholdConfig.co2_off;
    t["pm_on"] = g_ThresholdConfig.pm_on;
    t["pm_off"] = g_ThresholdConfig.pm_off;
    t["voc_on"] = g_ThresholdConfig.voc_on;
    t["voc_off"] = g_ThresholdConfig.voc_off;
    t["temp_on"] = g_ThresholdConfig.temp_on_x10 / 10.0f;
    t["temp_off"] = g_ThresholdConfig.temp_off_x10 / 10.0f;
    t["rh_low_on"] = g_ThresholdConfig.rh_low_on_x10 / 10.0f;
    t["rh_low_off"] = g_ThresholdConfig.rh_low_off_x10 / 10.0f;
    t["rh_high_on"] = g_ThresholdConfig.rh_high_on_x10 / 10.0f;
    t["rh_high_off"] = g_ThresholdConfig.rh_high_off_x10 / 10.0f;

    char buffer[1024];
    serializeJson(doc, buffer, sizeof(buffer));
    mqttClient.publish(MQTT_TOPIC_DEVICE_STATUS, buffer);
}

static bool saveThresholdConfig() {
    Preferences prefs;
    if (!prefs.begin("iaq_cfg", false)) {
        return false;
    }
    const size_t written = prefs.putBytes("thresholds", &g_ThresholdConfig, sizeof(g_ThresholdConfig));
    const bool autoSaved = prefs.putBool("auto", g_RuntimeControl.auto_control_enabled);
    prefs.end();
    return written == sizeof(g_ThresholdConfig) && autoSaved;
}

static void setManualDevice(const char* device, bool enabled) {
    if (strcmp(device, "hepa") == 0) g_iaq.wantHepa = enabled;
    else if (strcmp(device, "vent") == 0) g_iaq.wantVent = enabled;
    else if (strcmp(device, "carbon") == 0) g_iaq.wantCarbon = enabled;
    else if (strcmp(device, "ac") == 0) g_iaq.wantAc = enabled;
    else if (strcmp(device, "humid") == 0) g_iaq.wantHumid = enabled;
}

static bool parseLegacyDeviceCommand(const char* cmd, const char*& device, bool& enabled) {
    if (strcmp(cmd, "HEPA_ON") == 0) { device = "hepa"; enabled = true; return true; }
    if (strcmp(cmd, "HEPA_OFF") == 0) { device = "hepa"; enabled = false; return true; }
    if (strcmp(cmd, "VENT_ON") == 0) { device = "vent"; enabled = true; return true; }
    if (strcmp(cmd, "VENT_OFF") == 0) { device = "vent"; enabled = false; return true; }
    if (strcmp(cmd, "CARBON_ON") == 0) { device = "carbon"; enabled = true; return true; }
    if (strcmp(cmd, "CARBON_OFF") == 0) { device = "carbon"; enabled = false; return true; }
    if (strcmp(cmd, "AC_ON") == 0) { device = "ac"; enabled = true; return true; }
    if (strcmp(cmd, "AC_OFF") == 0) { device = "ac"; enabled = false; return true; }
    if (strcmp(cmd, "HUMID_ON") == 0) { device = "humid"; enabled = true; return true; }
    if (strcmp(cmd, "HUMID_OFF") == 0) { device = "humid"; enabled = false; return true; }
    return false;
}

static void handleSetThresholds(JsonObject src, const char* commandId) {
    ThresholdConfig next = g_ThresholdConfig;
    ThresholdConfig previous = g_ThresholdConfig;
    const uint32_t previousVersion = g_RuntimeControl.config_version;
    next.co2_on = src["co2_on"] | next.co2_on;
    next.co2_off = src["co2_off"] | next.co2_off;
    next.pm_on = src["pm_on"] | next.pm_on;
    next.pm_off = src["pm_off"] | next.pm_off;
    next.voc_on = src["voc_on"] | next.voc_on;
    next.voc_off = src["voc_off"] | next.voc_off;
    if (src["temp_on"].is<float>()) next.temp_on_x10 = (int16_t)(src["temp_on"].as<float>() * 10);
    if (src["temp_off"].is<float>()) next.temp_off_x10 = (int16_t)(src["temp_off"].as<float>() * 10);
    if (src["rh_low_on"].is<float>()) next.rh_low_on_x10 = (uint16_t)(src["rh_low_on"].as<float>() * 10);
    if (src["rh_low_off"].is<float>()) next.rh_low_off_x10 = (uint16_t)(src["rh_low_off"].as<float>() * 10);
    if (src["rh_high_on"].is<float>()) next.rh_high_on_x10 = (uint16_t)(src["rh_high_on"].as<float>() * 10);
    if (src["rh_high_off"].is<float>()) next.rh_high_off_x10 = (uint16_t)(src["rh_high_off"].as<float>() * 10);
    next.config_version = g_RuntimeControl.config_version + 1;

    if (!validateThresholdConfig(next)) {
        publishAck("SET_THRESHOLDS", false, "Invalid threshold hysteresis", commandId);
        return;
    }

    g_ThresholdConfig = next;
    g_RuntimeControl.config_version = next.config_version;
    g_eval.setConfig(g_ThresholdConfig);
    if (!saveThresholdConfig()) {
        g_ThresholdConfig = previous;
        g_RuntimeControl.config_version = previousVersion;
        g_eval.setConfig(g_ThresholdConfig);
        publishAck("SET_THRESHOLDS", false, "Failed to save thresholds to NVS", commandId);
        return;
    }
    publishThresholdConfig("SET_THRESHOLDS", commandId);
}

void vTaskControl(void *pvParameters) {
    char payload[512];
    mqttClient.setBufferSize(1024);

    for (;;) {
        if (xQueueReceive(xControlQueue, &payload, portMAX_DELAY) == pdPASS) {
            Serial.printf("[Control] Dashboard Cmd: %s\n", payload);

            StaticJsonDocument<512> doc;
            DeserializationError err = deserializeJson(doc, payload);
            const char* command = payload;
            const char* commandId = "";
            if (!err) {
                command = doc["command"] | "";
                commandId = doc["command_id"] | "";
            }

            if (strcmp(command, "REBOOT") == 0) {
                publishAck(command, true, "Rebooting", commandId);
                ESP.restart();
            } else if (strcmp(command, "GET_STATUS") == 0 || strcmp(command, "GET_AUTO") == 0) {
                publishAck(command, true, "Current state", commandId);
            } else if (strcmp(command, "GET_THRESHOLDS") == 0) {
                publishThresholdConfig(command, commandId);
            } else if (strcmp(command, "RESET_THRESHOLDS") == 0) {
                ThresholdConfig previous = g_ThresholdConfig;
                const uint32_t previousVersion = g_RuntimeControl.config_version;
                g_ThresholdConfig = defaultThresholdConfig();
                g_RuntimeControl.config_version++;
                g_ThresholdConfig.config_version = g_RuntimeControl.config_version;
                g_eval.setConfig(g_ThresholdConfig);
                if (!saveThresholdConfig()) {
                    g_ThresholdConfig = previous;
                    g_RuntimeControl.config_version = previousVersion;
                    g_eval.setConfig(g_ThresholdConfig);
                    publishAck(command, false, "Failed to save default thresholds to NVS", commandId);
                    continue;
                }
                publishThresholdConfig(command, commandId);
            } else if (strcmp(command, "SET_AUTO") == 0) {
                bool enabled = true;
                if (doc.containsKey("enabled")) enabled = doc["enabled"].as<bool>();
                else if (doc.containsKey("auto_control_enabled")) enabled = doc["auto_control_enabled"].as<bool>();
                const bool previousAuto = g_RuntimeControl.auto_control_enabled;
                g_RuntimeControl.auto_control_enabled = enabled;
                g_eval.autoControlEnabled = enabled;
                if (!saveThresholdConfig()) {
                    g_RuntimeControl.auto_control_enabled = previousAuto;
                    g_eval.autoControlEnabled = previousAuto;
                    publishAck(command, false, "Failed to save auto mode to NVS", commandId);
                    continue;
                }
                publishAck(command, true, enabled ? "Auto control enabled" : "Manual control enabled", commandId);
            } else if (strcmp(command, "SET_THRESHOLDS") == 0) {
                JsonObject thresholds = doc["thresholds"].is<JsonObject>() ? doc["thresholds"].as<JsonObject>() : doc.as<JsonObject>();
                handleSetThresholds(thresholds, commandId);
            } else if (strcmp(command, "LED_ON") == 0 || strcmp(command, "LED_OFF") == 0) {
                if (g_RuntimeControl.auto_control_enabled) {
                    publishAck(command, false, "Manual command rejected while auto control is enabled", commandId);
                    continue;
                }
                const bool on = strcmp(command, "LED_ON") == 0;
                for (const char* key : deviceKeys) setManualDevice(key, on);
                g_ctrl.apply(g_iaq);
                publishAck(command, true, "Manual all-device command applied", commandId);
            } else {
                const char* device = doc["device"] | "";
                bool enabled = doc["state"] | doc["enabled"] | false;
                bool isDevice = strcmp(command, "SET_DEVICE") == 0 && strlen(device) > 0;
                if (!isDevice) isDevice = parseLegacyDeviceCommand(command, device, enabled);

                if (isDevice) {
                    if (g_RuntimeControl.auto_control_enabled) {
                        publishAck(command, false, "Manual command rejected while auto control is enabled", commandId);
                        continue;
                    }
                    setManualDevice(device, enabled);
                    g_ctrl.apply(g_iaq);
                    publishAck(command, true, "Manual device command applied", commandId);
                } else {
                    publishAck(command, false, "Unsupported command", commandId);
                }
            }
        }
    }
}
