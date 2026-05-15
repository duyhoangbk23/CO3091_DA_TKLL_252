-- Create IoT Database

-- Step with MySQL Workbench: import this file (see comments at top of original if any)



CREATE DATABASE IF NOT EXISTS iot_db;

USE iot_db;



-- sensor_data — khớp payload RTOS / MQTT (common/data_format.json → sensor_data_payload)

-- device_id, temperature, humidity, pm25, co2, voc, alert_level, timestamp (µs esp_timer)


CREATE TABLE IF NOT EXISTS sensor_data (

    id INT AUTO_INCREMENT PRIMARY KEY,

    device_id VARCHAR(50) NOT NULL,

    temperature FLOAT NOT NULL,

    humidity FLOAT NOT NULL,

    pm25 INT NOT NULL DEFAULT -1 COMMENT 'PM2.5 ug/m3, -1 = chua co / missing',

    co2 INT NOT NULL DEFAULT -1 COMMENT 'ppm CO2; 65535 (0xFFFF) = missing tren thiet bi',

    voc INT NOT NULL DEFAULT -1 COMMENT 'chi so VOC raw; -1 = missing',

    alert_level TINYINT NOT NULL DEFAULT 0,

    timestamp BIGINT NOT NULL COMMENT 'esp_timer_get_time us hoac ms tuy thiet bi',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_device_id (device_id),

    INDEX idx_timestamp (timestamp),

    INDEX idx_created_at (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



CREATE TABLE IF NOT EXISTS control_log (

    id INT AUTO_INCREMENT PRIMARY KEY,

    device_id VARCHAR(50) NOT NULL,

    command VARCHAR(100) NOT NULL,

    status VARCHAR(20) DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_device_id (device_id),

    INDEX idx_created_at (created_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
