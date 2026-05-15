-- Chay mot lan tren DB da ton tai (bang sensor_data cu khong co pm25/co2/voc).
-- Cai moi: import schema.sql day du.

USE iot_db;

ALTER TABLE sensor_data
    ADD COLUMN pm25 INT NOT NULL DEFAULT -1 COMMENT 'PM2.5 ug/m3' AFTER humidity,
    ADD COLUMN co2 INT NOT NULL DEFAULT -1 COMMENT 'CO2 ppm' AFTER pm25,
    ADD COLUMN voc INT NOT NULL DEFAULT -1 COMMENT 'VOC raw' AFTER co2;
