/**
 * tests/unit/mqttClient.test.js
 * Unit tests cho module mqttClient.js — mock thu vien 'mqtt'
 */

jest.mock('mqtt');
const mqtt = require('mqtt');

// Reset module truoc moi test (vi mqttClient dung bien module-level)
beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
});

// ============================================================
//  Helper: tao mock mqtt.Client
// ============================================================
function makeFakeClient(connected = true) {
    const handlers = {};
    const fakeClient = {
        connected,
        on: jest.fn((event, cb) => { handlers[event] = cb; }),
        subscribe: jest.fn((topic, cb) => cb && cb(null)),
        publish: jest.fn(),
        _trigger: (event, ...args) => handlers[event] && handlers[event](...args)
    };
    return fakeClient;
}

// ============================================================
//  TEST: init()
// ============================================================
describe('mqttClient.init()', () => {
    test('goi mqtt.connect voi broker URL dung', () => {
        const fakeClient = makeFakeClient();
        mqtt.connect.mockReturnValue(fakeClient);

        const mqttClient = require('../../src/mqtt/mqttClient');
        mqttClient.init(jest.fn());

        expect(mqtt.connect).toHaveBeenCalledWith(expect.stringContaining('mqtt://'));
    });

    test('subscribe vao topic iot/sensor/data sau khi connect', () => {
        const fakeClient = makeFakeClient();
        mqtt.connect.mockReturnValue(fakeClient);

        const mqttClient = require('../../src/mqtt/mqttClient');
        mqttClient.init(jest.fn());

        // Kich hoat su kien 'connect'
        fakeClient._trigger('connect');

        expect(fakeClient.subscribe).toHaveBeenCalledWith(
            'iot/sensor/data',
            expect.any(Function)
        );
    });

    test('goi callback khi nhan duoc message JSON hop le', () => {
        const fakeClient = makeFakeClient();
        mqtt.connect.mockReturnValue(fakeClient);

        const callback = jest.fn();
        const mqttClient = require('../../src/mqtt/mqttClient');
        mqttClient.init(callback);

        fakeClient._trigger('connect');

        const payload = JSON.stringify({ temperature: 28.5, humidity: 65.0 });
        fakeClient._trigger('message', 'iot/sensor/data', Buffer.from(payload));

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith(
            expect.objectContaining({
                temperature: 28.5,
                humidity:    65.0,
                device_id:   'esp32_device'
            })
        );
    });

    test('khong crash khi nhan message JSON khong hop le', () => {
        const fakeClient = makeFakeClient();
        mqtt.connect.mockReturnValue(fakeClient);

        const callback = jest.fn();
        const mqttClient = require('../../src/mqtt/mqttClient');
        mqttClient.init(callback);

        // Kich hoat message voi payload khong phai JSON
        expect(() => {
            fakeClient._trigger('message', 'iot/sensor/data', Buffer.from('INVALID_JSON'));
        }).not.toThrow();

        expect(callback).not.toHaveBeenCalled();
    });

    test('khong goi callback khi topic khac', () => {
        const fakeClient = makeFakeClient();
        mqtt.connect.mockReturnValue(fakeClient);

        const callback = jest.fn();
        const mqttClient = require('../../src/mqtt/mqttClient');
        mqttClient.init(callback);

        fakeClient._trigger(
            'message',
            'iot/other/topic',
            Buffer.from(JSON.stringify({ temperature: 25 }))
        );

        expect(callback).not.toHaveBeenCalled();
    });
});

// ============================================================
//  TEST: publishControl()
// ============================================================
describe('mqttClient.publishControl()', () => {
    test('tra ve false khi client chua ket noi', () => {
        const fakeClient = makeFakeClient(false); // connected = false
        mqtt.connect.mockReturnValue(fakeClient);

        const mqttClient = require('../../src/mqtt/mqttClient');
        mqttClient.init(jest.fn());

        const result = mqttClient.publishControl('ON');
        expect(result).toBe(false);
    });

    test('publish payload dung dinh dang {"led":"ON"}', () => {
        const fakeClient = makeFakeClient(true);
        mqtt.connect.mockReturnValue(fakeClient);

        const mqttClient = require('../../src/mqtt/mqttClient');
        mqttClient.init(jest.fn());
        fakeClient._trigger('connect');

        mqttClient.publishControl('ON');

        expect(fakeClient.publish).toHaveBeenCalledWith(
            'iot/device/control',
            JSON.stringify({ led: 'ON' })
        );
    });

    test('tra ve true khi publish thanh cong', () => {
        const fakeClient = makeFakeClient(true);
        mqtt.connect.mockReturnValue(fakeClient);

        const mqttClient = require('../../src/mqtt/mqttClient');
        mqttClient.init(jest.fn());
        fakeClient._trigger('connect');

        const result = mqttClient.publishControl('OFF');
        expect(result).toBe(true);
    });
});

// ============================================================
//  TEST: getLatestData()
// ============================================================
describe('mqttClient.getLatestData()', () => {
    test('tra ve null truoc khi nhan bat ky message nao', () => {
        const fakeClient = makeFakeClient();
        mqtt.connect.mockReturnValue(fakeClient);

        const mqttClient = require('../../src/mqtt/mqttClient');
        mqttClient.init(jest.fn());

        expect(mqttClient.getLatestData()).toBeNull();
    });

    test('tra ve du lieu moi nhat sau khi nhan message', () => {
        const fakeClient = makeFakeClient();
        mqtt.connect.mockReturnValue(fakeClient);

        const mqttClient = require('../../src/mqtt/mqttClient');
        mqttClient.init(jest.fn());
        fakeClient._trigger('connect');

        const payload = JSON.stringify({ temperature: 33.1, humidity: 55.5 });
        fakeClient._trigger('message', 'iot/sensor/data', Buffer.from(payload));

        const data = mqttClient.getLatestData();
        expect(data).not.toBeNull();
        expect(data.temperature).toBe(33.1);
        expect(data.humidity).toBe(55.5);
    });
});
