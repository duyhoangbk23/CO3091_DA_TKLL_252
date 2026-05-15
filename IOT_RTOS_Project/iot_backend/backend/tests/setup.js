/**
 * Jest Setup File
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Suppress logs during tests
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'iot_test_db';

// Increase timeout for database operations
jest.setTimeout(10000);

// Suppress console logs in test output (optional)
// global.console.log = jest.fn();
// global.console.error = jest.fn();
// global.console.warn = jest.fn();
