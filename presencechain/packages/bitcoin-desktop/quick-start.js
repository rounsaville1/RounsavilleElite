#!/usr/bin/env node

/**
 * Bitcoin Desktop Quick Start Script
 * For Joseph Michael Rounsaville
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkCommand(command, name) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    log(`✓ ${name} is installed`, colors.green);
    return true;
  } catch (error) {
    log(`✗ ${name} is not installed`, colors.red);
    return false;
  }
}

function checkRequirements() {
  log('\n📋 Checking system requirements...', colors.blue);

  const hasNode = checkCommand('node', 'Node.js');
  const hasNpm = checkCommand('npm', 'npm');
  const hasBitcoinCore = checkCommand('bitcoind', 'Bitcoin Core');

  if (!hasNode || !hasNpm) {
    log('\nPlease install Node.js from: https://nodejs.org/', colors.yellow);
    process.exit(1);
  }

  if (!hasBitcoinCore) {
    log('\nWARNING: Bitcoin Core not found!', colors.yellow);
    log('Download from: https://bitcoin.org/en/download', colors.yellow);
    log('The application will not work without Bitcoin Core.', colors.yellow);
  }

  return true;
}

function installDependencies() {
  log('\n📦 Installing dependencies...', colors.blue);

  if (!fs.existsSync('node_modules')) {
    try {
      execSync('npm install', { stdio: 'inherit' });
      log('✓ Dependencies installed successfully', colors.green);
    } catch (error) {
      log('✗ Failed to install dependencies', colors.red);
      process.exit(1);
    }
  } else {
    log('✓ Dependencies already installed', colors.green);
  }
}

function buildApplication() {
  log('\n🔨 Building application...', colors.blue);

  try {
    execSync('npm run build', { stdio: 'inherit' });
    log('✓ Build completed successfully', colors.green);
  } catch (error) {
    log('✗ Build failed', colors.red);
    process.exit(1);
  }
}

function startApplication() {
  log('\n🚀 Starting Bitcoin Full Node Desktop...', colors.blue);
  log('👤 Owner: Joseph Michael Rounsaville\n', colors.blue);

  const electron = spawn('npm', ['start'], {
    stdio: 'inherit',
    shell: true,
  });

  electron.on('close', (code) => {
    log(`\n✓ Application closed with code ${code}`, colors.green);
  });
}

function main() {
  console.clear();
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);
  log('  Bitcoin Full Node Desktop Application', colors.blue);
  log('  For Joseph Michael Rounsaville', colors.blue);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.blue);

  checkRequirements();
  installDependencies();
  buildApplication();
  startApplication();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
