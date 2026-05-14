/**
 * tests/unit/api.test.js
 * Unit tests cho REST API — dung supertest, mock DB va MQTT.
 * Chay: npm test
 */

const request = require('supertest');
const { app, setDb, setMqtt, setLatestData, getLatestData } = require('../../src/app');

// ============================================================
//  Mock Helpers
// ============================================================

/** Tao mock DB thanh cong (query luon tra ve ket qua trong) */
function makeMockDb(overrides = {}) {
    return {
        query: jest.fn().mockResolvedValue([[],[]]),
        ...overrides
    };
}

/** Tao mock MQTT da ket noi */
function makeMockMqtt(connected = true) {
    return {
        publishControl: jest.fn().mockReturnValue(connected)
    };
}

/** Reset state giua cac test */
beforeEach(() => {
    setDb(null);
    setMqtt(null);
    setLatestData({
        device_id:   'esp32_device',
        temperature: 0,
        humidity:    0,
        alert_level: 0,
        timestamp_ms: 0,
        status:      'online'
    });
});

// ============================================================
//  GET /health
// ============================================================
describe('GET /health', () => {
    test('tra ve status ok khi khong co DB', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.database).toBe('disconnected');
    });

    test('tra ve database=connected khi DB co san', async () => {
        setDb(makeMockDb());
        const res = await request(app).get('/health');
        expect(res.body.database).toBe('connected');
    });
});

// ============================================================
//  GET /api/data
// ============================================================
describe('GET /api/data', () => {
    test('tra ve du lieu mac dinh khi chua co MQTT', async () => {
        const res = await request(app).get('/api/data');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('device_id');
        expect(res.body.data).toHaveProperty('temperature');
        expect(res.body.data).toHaveProperty('humidity');
    });

    test('tra ve du lieu moi nhat sau khi cap nhat latestData', async () => {
        setLatestData({ device_id: 'esp32_device', temperature: 31.5, humidity: 72.3, alert_level: 1, timestamp_ms: 123 });
        const res = await request(app).get('/api/data');
        expect(res.body.data.temperature).toBe(31.5);
        expect(res.body.data.humidity).toBe(72.3);
        expect(res.body.data.alert_level).toBe(1);
        expect(res.body.data.timestamp_ms).toBe(123);
    });

    test('response co truong timestamp', async () => {
        const res = await request(app).get('/api/data');
        expect(res.body).toHaveProperty('timestamp');
    });
});

// ============================================================
//  GET /api/history
// ============================================================
describe('GET /api/history', () => {
    test('tra ve mang rong khi khong co DB', async () => {
        const res = await request(app).get('/api/history');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.count).toBe(0);
    });

    test('tra ve lich su tu DB khi co ket noi', async () => {
        const fakeRows = [
            { id: 1, device_id: 'esp32_device', temperature: 28.0, humidity: 65.0, created_at: '2024-01-01' },
            { id: 2, device_id: 'esp32_device', temperature: 29.5, humidity: 63.0, created_at: '2024-01-01' }
        ];
        const mockDb = makeMockDb({ query: jest.fn().mockResolvedValue([fakeRows]) });
        setDb(mockDb);

        const res = await request(app).get('/api/history?limit=10&hours=24');
        expect(res.status).toBe(200);
        expect(res.body.count).toBe(2);
        expect(res.body.data[0].temperature).toBe(28.0);
    });

    test('tu choi limit > 1000', async () => {
        const res = await request(app).get('/api/history?limit=9999');
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/1000/);
    });

    test('dung tham so mac dinh limit=100 hours=24', async () => {
        const mockDb = makeMockDb();
        setDb(mockDb);

        await request(app).get('/api/history');
        // Query phai duoc goi voi [24, 100]
        expect(mockDb.query).toHaveBeenCalledWith(
            expect.any(String),
            [24, 100]
        );
    });
});

// ============================================================
//  POST /api/control
// ============================================================
describe('POST /api/control', () => {
    test('tu choi request thieu device_id', async () => {
        setMqtt(makeMockMqtt());
        const res = await request(app)
            .post('/api/control')
            .send({ command: 'ON' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Missing/i);
    });

    test('tu choi request thieu command', async () => {
        setMqtt(makeMockMqtt());
        const res = await request(app)
            .post('/api/control')
            .send({ device_id: 'esp32_device' });
        expect(res.status).toBe(400);
    });

    test('tu choi lenh khong hop le (khong phai supported command)', async () => {
        setMqtt(makeMockMqtt());
        const res = await request(app)
            .post('/api/control')
            .send({ device_id: 'esp32_device', command: 'INVALID_COMMAND' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Invalid command/i);
    });

    test('gui lenh LED_ON thanh cong qua MQTT', async () => {
        setMqtt(makeMockMqtt(true));
        const res = await request(app)
            .post('/api/control')
            .send({ device_id: 'esp32_device', command: 'LED_ON' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.result.command).toBe('LED_ON');
        expect(res.body.result.status).toBe('sent');
    });

    test('gui lenh LED_OFF thanh cong (case-insensitive)', async () => {
        setMqtt(makeMockMqtt(true));
        const res = await request(app)
            .post('/api/control')
            .send({ device_id: 'esp32_device', command: 'led_off' });
        expect(res.status).toBe(200);
        expect(res.body.result.command).toBe('LED_OFF');
    });

    test('tra 500 khi MQTT khong ket noi', async () => {
        setMqtt(makeMockMqtt(false)); // publishControl tra ve false
        const res = await request(app)
            .post('/api/control')
            .send({ device_id: 'esp32_device', command: 'ON' });
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
    });

    test('tra 500 khi chua set MQTT client', async () => {
        // mqttClient = null
        const res = await request(app)
            .post('/api/control')
            .send({ device_id: 'esp32_device', command: 'ON' });
        expect(res.status).toBe(500);
    });

    test('ghi vao DB sau khi gui lenh', async () => {
        const mockDb = makeMockDb();
        setDb(mockDb);
        setMqtt(makeMockMqtt(true));

        await request(app)
            .post('/api/control')
            .send({ device_id: 'esp32_device', command: 'ON' });

        expect(mockDb.query).toHaveBeenCalledWith(
            expect.stringContaining('control_log'),
            ['esp32_device', 'LED_ON', 'sent']
        );
    });
});

describe('control extensions', () => {
    test('set auto control publishes structured SET_AUTO command', async () => {
        const mqtt = makeMockMqtt(true);
        setMqtt(mqtt);
        const res = await request(app)
            .post('/api/control/auto')
            .send({ device_id: 'esp32_device', enabled: false });
        expect(res.status).toBe(200);
        expect(res.body.result.command).toBe('SET_AUTO');
        expect(mqtt.publishControl).toHaveBeenCalledWith(
            expect.objectContaining({ command: 'SET_AUTO', enabled: false }),
            'esp32_device'
        );
    });

    test('manual device API validates and publishes SET_DEVICE', async () => {
        const mqtt = makeMockMqtt(true);
        setMqtt(mqtt);
        const res = await request(app)
            .post('/api/control/device')
            .send({ device_id: 'esp32_device', device: 'hepa', state: true });
        expect(res.status).toBe(200);
        expect(res.body.result.command).toBe('SET_DEVICE');
        expect(mqtt.publishControl).toHaveBeenCalledWith(
            expect.objectContaining({ command: 'SET_DEVICE', device: 'hepa', state: true }),
            'esp32_device'
        );
    });

    test('threshold update publishes SET_THRESHOLDS payload', async () => {
        const mqtt = makeMockMqtt(true);
        setMqtt(mqtt);
        const thresholds = { co2_on: 1000, co2_off: 950 };
        const res = await request(app)
            .post('/api/control/thresholds')
            .send({ device_id: 'esp32_device', thresholds });
        expect(res.status).toBe(200);
        expect(mqtt.publishControl).toHaveBeenCalledWith(
            expect.objectContaining({ command: 'SET_THRESHOLDS', thresholds }),
            'esp32_device'
        );
    });
});

// ============================================================
//  GET /api/stats
// ============================================================
describe('GET /api/stats', () => {
    test('tra ve thong bao khi khong co DB', async () => {
        const res = await request(app).get('/api/stats');
        expect(res.status).toBe(200);
        expect(res.body.data.message).toMatch(/not connected/i);
    });

    test('tra ve thong ke tu DB', async () => {
        const fakeStats = {
            total_records:   120,
            avg_temperature: 28.5,
            max_temperature: 40.0,
            min_temperature: 20.0,
            avg_humidity:    65.0
        };
        const mockDb = makeMockDb({ query: jest.fn().mockResolvedValue([[fakeStats]]) });
        setDb(mockDb);

        const res = await request(app).get('/api/stats');
        expect(res.status).toBe(200);
        expect(res.body.data.total_records).toBe(120);
        expect(res.body.data.avg_temperature).toBe(28.5);
    });

    test('tra ve 500 khi DB query that bai', async () => {
        const mockDb = makeMockDb({ query: jest.fn().mockRejectedValue(new Error('DB Error')) });
        setDb(mockDb);

        const res = await request(app).get('/api/stats');
        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
    });
});

// ============================================================
//  404 - Endpoint khong ton tai
// ============================================================
describe('404 handler', () => {
    test('tra ve 404 cho route khong ton tai', async () => {
        const res = await request(app).get('/api/nonexistent');
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});
