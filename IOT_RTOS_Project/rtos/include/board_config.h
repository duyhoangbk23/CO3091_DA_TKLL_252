#ifndef BOARD_CONFIG_H
#define BOARD_CONFIG_H

#include <Arduino.h>

#define DEVICE_ID "esp32_sensor_001"

static constexpr int PMS_RX_PIN = 26;
static constexpr int PMS_TX_PIN = 27;

static constexpr int RS485_RX_PIN = 16;
static constexpr int RS485_TX_PIN = 17;
static constexpr int RS485_DERE_PIN = -1;

static constexpr int VOC_PIN = 34;

static constexpr int I2C_SDA_PIN = 21;
static constexpr int I2C_SCL_PIN = 22;

#define LED_HEPA_G   13
#define LED_VENT_G   14
#define LED_CARBON_G 25
#define LED_AC_G     32
#define LED_HUMID_G  33

#define LED_CO2_R    18
#define LED_PM_R     19
#define LED_VOC_R    23
#define LED_TEMP_R   4
#define LED_RH_R     5

#endif
