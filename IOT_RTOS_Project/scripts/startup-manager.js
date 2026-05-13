#!/usr/bin/env node
/**
 * ================================================================
 * IoT Project - Startup Manager
 * 
 * Orchestrates starting backend, opening browser, and monitoring
 * Can be used as an alternative to run.bat for cross-platform
 * ================================================================
 * 
 * Usage:
 *   node startup-manager.js [options]
 * 
 * Options:
 *   --backend-only    Start only backend (no browser)
 *   --no-build        Skip firmware build check
 *   --port 3000       Custom backend port
 *   --help            Show this help
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const readline = require('readline');

// ================================================================
// Configuration
// ================================================================

const CONFIG = {
  projectRoot: path.resolve(__dirname, '..'),
  backendPort: process.env.PORT || 3000,
  backendDir: path.join(__dirname, '..', 'iot_backend', 'backend'),
  frontendUrl: null, // Will be set based on port
  skipBuild: process.argv.includes('--no-build'),
  backendOnly: process.argv.includes('--backend-only'),
  quiet: process.argv.includes('--quiet'),
};

CONFIG.frontendUrl = `http://localhost:${CONFIG.backendPort}`;

// ================================================================
// Logger
// ================================================================

class Logger {
  constructor(quiet = false) {
    this.quiet = quiet;
    this.colors = {
      reset: '\x1b[0m',
      green: '\x1b[92m',
      yellow: '\x1b[93m',
      red: '\x1b[91m',
      blue: '\x1b[94m',
      cyan: '\x1b[36m',
    };
  }

  log(msg, level = 'info') {
    if (this.quiet) return;

    const timestamp = new Date().toLocaleTimeString();
    let prefix = `[${timestamp}]`;

    switch (level) {
      case 'error':
        prefix += ` ${this.colors.red}[ERROR]${this.colors.reset}`;
        break;
      case 'warn':
        prefix += ` ${this.colors.yellow}[WARN]${this.colors.reset}`;
        break;
      case 'success':
        prefix += ` ${this.colors.green}[✓]${this.colors.reset}`;
        break;
      case 'info':
        prefix += ` ${this.colors.blue}[INFO]${this.colors.reset}`;
        break;
      default:
        break;
    }

    console.log(`${prefix} ${msg}`);
  }

  info(msg) { this.log(msg, 'info'); }
  error(msg) { this.log(msg, 'error'); }
  warn(msg) { this.log(msg, 'warn'); }
  success(msg) { this.log(msg, 'success'); }
}

const logger = new Logger(CONFIG.quiet);
CONFIG.colors = logger.colors;

// ================================================================
// Helper Functions
// ================================================================

function checkCommand(cmd) {
  return new Promise((resolve) => {
    exec(`${cmd} --version`, (error) => {
      resolve(!error);
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function openBrowser(url) {
  const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${start} "${url}"`);
}

function installDependencies() {
  return new Promise((resolve, reject) => {
    logger.info('Installing npm dependencies...');

    const npm = spawn('npm', ['install'], {
      cwd: CONFIG.backendDir,
      stdio: 'inherit',
    });

    npm.on('close', (code) => {
      if (code === 0) {
        logger.success('Dependencies installed');
        resolve();
      } else {
        logger.error('Failed to install dependencies');
        reject(new Error('npm install failed'));
      }
    });
  });
}

function startBackend() {
  return new Promise((resolve, reject) => {
    logger.info(`Starting backend on port ${CONFIG.backendPort}...`);

    const backend = spawn('npm', ['start'], {
      cwd: CONFIG.backendDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: CONFIG.backendPort,
      },
    });

    backend.on('error', (err) => {
      logger.error(`Backend process error: ${err.message}`);
      reject(err);
    });

    // Wait for server to start
    setTimeout(() => {
      resolve(backend);
    }, 3000);
  });
}

async function printInfo() {
  console.log('\n' + '='.repeat(60));
  console.log('   IoT Project - All Systems Running');
  console.log('='.repeat(60));
  console.log();
  console.log(`${CONFIG.colors.green}✓ Backend${CONFIG.colors.reset}:     ${CONFIG.frontendUrl}`);
    console.log(`${CONFIG.colors.green}Dashboard${CONFIG.colors.reset}:    http://localhost:8080`);
    console.log(`${CONFIG.colors.green}Analytics${CONFIG.colors.reset}:    http://localhost:8080/analytics.html`);
    console.log(`${CONFIG.colors.green}Control${CONFIG.colors.reset}:      http://localhost:8080/control.html`);
  console.log();
  console.log(`${CONFIG.colors.yellow}[Next Steps]${CONFIG.colors.reset}`);
  console.log();
  console.log('  1. Connect ESP32 to USB');
  console.log('  2. Configure WiFi in hardware/main/main.ino');
  console.log('  3. Build firmware: npm run build-firmware');
  console.log('  4. Upload: npm run upload');
  console.log('  5. Monitor: npm run monitor');
  console.log();
  console.log(`Press ${CONFIG.colors.cyan}Ctrl+C${CONFIG.colors.reset} to stop all services`);
  console.log();
}

// ================================================================
// Main Flow
// ================================================================

async function main() {
  try {
    console.log();
    console.log('='.repeat(60));
    console.log('   IoT Project Startup Manager');
    console.log('='.repeat(60));
    console.log();

    // Check prerequisites
    logger.info('Checking prerequisites...');
    const hasNode = await checkCommand('node');
    const hasNpm = await checkCommand('npm');

    if (!hasNode) {
      logger.error('Node.js not found. Install from https://nodejs.org/');
      process.exit(1);
    }
    if (!hasNpm) {
      logger.error('npm not found.');
      process.exit(1);
    }
    logger.success('Prerequisites OK');

    // Install dependencies
    if (!fs.existsSync(path.join(CONFIG.backendDir, 'node_modules'))) {
      await installDependencies();
    } else {
      logger.success('Dependencies already installed');
    }

    // Create .env if needed
    if (!fs.existsSync(path.join(CONFIG.backendDir, '.env'))) {
      logger.warn('.env not found, creating from .env.example');
      const envExample = path.join(CONFIG.backendDir, '.env.example');
      if (fs.existsSync(envExample)) {
        fs.copyFileSync(envExample, path.join(CONFIG.backendDir, '.env'));
        logger.success('.env created');
      }
    }

    // Start backend
    const backend = await startBackend();
    logger.success('Backend server started');

    // Open browser
    if (!CONFIG.backendOnly) {
      await sleep(2000);
      logger.info(`Opening browser to ${CONFIG.frontendUrl}`);
      openBrowser(CONFIG.frontendUrl);
    }

    // Print info
    await printInfo();

    // Handle cleanup
    process.on('SIGINT', () => {
      logger.info('Shutting down...');
      backend.kill();
      process.exit(0);
    });

  } catch (error) {
    logger.error(error.message);
    process.exit(1);
  }
}

// ================================================================
// Show Help
// ================================================================

if (process.argv.includes('--help')) {
  console.log(`
IoT Project - Startup Manager

Usage: node startup-manager.js [options]

Options:
  --backend-only    Start only backend (no browser)
  --no-build        Skip firmware build check
  --port 3000       Custom backend port (default: 3000)
  --quiet           Suppress log output
  --help            Show this help message

Examples:
  node startup-manager.js
  node startup-manager.js --backend-only
  node startup-manager.js --port 3000
  node startup-manager.js --backend-only --port 3000
  `);
  process.exit(0);
}

// ================================================================
// Run
// ================================================================

main().catch(err => {
  logger.error(err.message);
  process.exit(1);
});
