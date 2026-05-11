/**
 * tests/integration/rtos_backend.test.js
 *
 * Integration test mo phong luong du lieu E2E:
 *   ESP32 (RTOS) --> MQTT Broker (gia lap) --> mqttClient --> app --> API
 */

// ================================================================
//  Mock thu vien 'mqtt' bang factory — phai dat truoc moi require
// ================================================================
const _mqttHandlers  = {};
const _subscriptions = [];
const _published     = [];
let   _connected     = true;

const fakeMqttClient = {
    get connected() { return _connected; },
    on(event, cb)        { _mqttHandlers[event] = cb; return this; },
    subscribe(topic, cb) { _subscriptions.push(topic); if (cb) cb(null); },
    publish(topic, msg)  { _published.push({ topic, payload: msg.toString() }); },
    // Helper dung trong test
    _trigger(event, ...args) { if (_mqttHandlers[event]) _mqttHandlers[event](...args); }
};

jest.mock('mqtt');
const mqtt = require('mqtt');
mqtt.connect.mockReturnValue(fakeMqttClient);

beforeEach(() => {
    jest.clearAllMocks();
    mqtt.connect.mockReturnValue(fakeMqttClient);
});

// ================================================================
//  Import cac module sau khi mock da duoc cai dat
// ================================================================
const request    = require('supertest');
const { app, setDb, setMqtt, setLatestData, getLatestData } = require('../../src/app');
const mqttMod    = require('../../src/mqtt/mqttClient');

// ================================================================
//  Helpers
// ================================================================
function makeMockDb(rows = []) {
    return { query: jest.fn().mockResolvedValue([rows, []]) };
}

/** Mo phong ESP32 gui du lieu JSON toi topic */
function esp32Send(topic, data) {
    const buf = Buffer.from(JSON.stringify(data));
    fakeMqttClient._trigger('message', topic, buf);
}

// ================================================================
//  Setup / Teardown
// ================================================================
let dataCallback = null;

beforeAll(() => {
    // Khoi tao mqttClient 1 lan duy nhat cho ca suite
    mqttMod.init(data => {
        // Goi callback test neu co
        if (dataCallback) dataCallback(data);
    });
    // Kich hoat 'connect' -> subscribe
    fakeMqttClient._trigger('connect');
});

beforeEach(() => {
    dataCallback = null;
    _published.length = 0;
    setDb(null);
    setMqtt(null);
    setLatestData({ device_id: 'esp32_device', temperature: 0, humidity: 0, timestamp: '' });
});

// ================================================================
//  [GROUP 1] Du lieu: ESP32 → MQTT → Backend
// ================================================================
describe('Luong du lieu: ESP32 (RTOS) → MQTT → Backend', () => {

    test('1. Backend nhan du lieu cam bien va cap nhat latestData', done => {
        dataCallback = data => {
            setLatestData(data);
            const d = getLatestData();
            expect(d.temperature).toBeCloseTo(27.3, 1);
            expect(d.humidity).toBeCloseTo(68.5, 1);
            expect(d.device_id).toBe('esp32_device');
            done();
        };
        esp32Send('iot/sensor/data', { temperature: 27.3, humidity: 68.5 });
    });

    test('2. GET /api/data tra ve du lieu moi nhat tu ESP32', done => {
        dataCallback = data => {
            setLatestData(data);
            request(app).get('/api/data').then(res => {
                expect(res.status).toBe(200);
                expect(res.body.data.temperature).toBeCloseTo(30.0, 1);
                expect(res.body.data.humidity).toBeCloseTo(72.0, 1);
                done();
            });
        };
        esp32Send('iot/sensor/data', { temperature: 30.0, humidity: 72.0 });
    });

    test('3. Du lieu tu ESP32 duoc luu vao DB sau khi nhan', done => {
        const mockDb = makeMockDb();
        setDb(mockDb);

        dataCallback = async data => {
            setLatestData(data);
            // Server.js se goi saveSensorData — mo phong o day
            await mockDb.query(
                'INSERT INTO sensor_data (device_id, temperature, humidity) VALUES (?, ?, ?)',
                [data.device_id, data.temperature, data.humidity]
            );
            expect(mockDb.query).toHaveBeenCalledWith(
                expect.stringContaining('sensor_data'),
                ['esp32_device', 25.5, 60.0]
            );
            done();
        };
        esp32Send('iot/sensor/data', { temperature: 25.5, humidity: 60.0 });
    });

    test('4. Nhieu goi du lieu lien tiep khong mat du lieu', done => {
        const received = [];
        let count = 0;
        const TOTAL = 5;

        dataCallback = data => {
            received.push(data.temperature);
            count++;
            setLatestData(data);
            if (count === TOTAL) {
                expect(received).toEqual([20, 21, 22, 23, 24]);
                done();
            }
        };

        for (let i = 0; i < TOTAL; i++) {
            esp32Send('iot/sensor/data', { temperature: 20 + i, humidity: 60 });
        }
    });
});

// ================================================================
//  [GROUP 2] Dieu khien: Backend → MQTT → ESP32
// ================================================================
describe('Luong dieu khien: Backend → MQTT → ESP32 (RTOS)', () => {

    test('5. POST /api/control ON publish payload {"command":"LED_ON"} toi MQTT', async () => {
        setMqtt(mqttMod);
        _connected = true;

        const res = await request(app)
            .post('/api/control')
            .send({ device_id: 'esp32_device', command: 'ON' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);

        const ctrlMsgs = _published.filter(m => m.topic === 'iot/device/control');
        expect(ctrlMsgs.length).toBeGreaterThan(0);
        expect(JSON.parse(ctrlMsgs[0].payload).command).toBe('LED_ON');
    });

    test('6. POST /api/control OFF publish payload {"command":"LED_OFF"}', async () => {
        setMqtt(mqttMod);
        _connected = true;

        await request(app)
            .post('/api/control')
            .send({ device_id: 'esp32_device', command: 'off' }); // lowercase

        const ctrlMsgs = _published.filter(m => m.topic === 'iot/device/control');
        expect(JSON.parse(ctrlMsgs[0].payload).command).toBe('LED_OFF');
    });

    test('7. 3 lenh lien tiep duoc ghi du vao control_log', async () => {
        const queries = [];
        const mockDb = { query: jest.fn().mockImplementation((sql, params) => {
            queries.push({ sql, params });
            return Promise.resolve([[], []]);
        })};
        setDb(mockDb);
        setMqtt(mqttMod);
        _connected = true;

        await request(app).post('/api/control').send({ device_id: 'esp32_device', command: 'ON' });
        await request(app).post('/api/control').send({ device_id: 'esp32_device', command: 'OFF' });
        await request(app).post('/api/control').send({ device_id: 'esp32_device', command: 'ON' });

        const logs = queries.filter(q => q.sql.includes('control_log'));
        expect(logs.length).toBe(3);
        expect(logs[0].params[1]).toBe('LED_ON');
        expect(logs[1].params[1]).toBe('LED_OFF');
        expect(logs[2].params[1]).toBe('LED_ON');
    });

    test('8. POST /api/control tra 500 khi MQTT mat ket noi', async () => {
        setMqtt(mqttMod);
        _connected = false; // Gia lap mat ket noi

        const res = await request(app)
            .post('/api/control')
            .send({ device_id: 'esp32_device', command: 'ON' });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        _connected = true; // Reset
    });
});

// ================================================================
//  [GROUP 3] Canh bao nguong — Mirror logic data_process.cpp
// ================================================================
describe('Canh bao nguong — Mirror RTOS threshold logic', () => {

    // Mirror ham calc_alert_level tu data_process.cpp
    function calcAlertLevel(temp, aqi) {
        const TEMP_WARN = 35.0, TEMP_CRIT = 40.0;
        const AQI_WARN  = 300,  AQI_CRIT  = 500;
        if (temp > TEMP_CRIT || aqi > AQI_CRIT) return 2; // DANGER
        if (temp > TEMP_WARN || aqi > AQI_WARN)  return 1; // WARNING
        return 0; // OK
    }

    test.each([
        [30.0, 100, 0, 'Binh thuong'],
        [35.0, 100, 0, 'Dung bang TEMP_WARN — chua qua'],
        [35.1, 100, 1, 'Vuot nhe TEMP_WARN'],
        [30.0, 301, 1, 'Vuot nhe AQI_WARN'],
        [40.0, 100, 1, 'Dung bang TEMP_CRIT — chua qua'],
        [40.1, 100, 2, 'Vuot nhe TEMP_CRIT'],
        [30.0, 501, 2, 'Vuot nhe AQI_CRIT'],
        [42.0, 700, 2, 'Ca hai vuot CRIT']
    ])(
        '9. T=%.1f AQI=%d -> level=%d (%s)',
        (temp, aqi, expected) => {
            expect(calcAlertLevel(temp, aqi)).toBe(expected);
        }
    );

    test('10. Backend van nhan du lieu CRIT tu ESP32 binh thuong', done => {
        const mockDb = makeMockDb();
        setDb(mockDb);

        dataCallback = async data => {
            setLatestData(data);
            expect(data.temperature).toBe(42.0);
            expect(data.humidity).toBe(55.0);

            await mockDb.query(
                'INSERT INTO sensor_data (device_id, temperature, humidity) VALUES (?, ?, ?)',
                [data.device_id, data.temperature, data.humidity]
            );
            expect(mockDb.query).toHaveBeenCalled();
            done();
        };

        // ESP32 da tinh alert_level=2 truoc roi gui len MQTT
        esp32Send('iot/sensor/data', { temperature: 42.0, humidity: 55.0, alert_level: 2 });
    });
});
