#ifndef BOARD_CONFIG_H
#define BOARD_CONFIG_H

#include <Arduino.h>

#if __has_include("local_config.h")
#include "local_config.h"
#endif

#ifndef DEVICE_ID
#define DEVICE_ID "esp32_device"
#endif

static constexpr int PMS_RX_PIN = 26;
static constexpr int PMS_TX_PIN = 27;

static constexpr int RS485_RX_PIN = 16;
static constexpr int RS485_TX_PIN = 17;
static constexpr int RS485_DERE_PIN = -1;

static constexpr int VOC_PIN = 34;

#define LED_CO2_R     23
#define LED_PM_R      22
#define LED_VOC_R     21
#define LED_TEMP_R    19
#define LED_RH_R      18

#define LED_HEPA_G    5
#define LED_VENT_G    4
#define LED_CARBON_G  0
#define LED_AC_G      2
#define LED_HUMID_G   15

static constexpr bool LED_ACTIVE_HIGH = true;

#endif
