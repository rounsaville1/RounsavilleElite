import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { BitcoinDaemon } from './bitcoin-daemon';
import { WalletManager } from './wallet-manager';
import { SettingsManager } from './settings-manager';

let mainWindow: BrowserWindow | null = null;
let bitcoinDaemon: BitcoinDaemon | null = null;
let walletManager: WalletManager | null = null;
let settingsManager: SettingsManager | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'Bitcoin Full Node - Joseph Michael Rounsaville',
    backgroundColor: '#1a1a1a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function initializeServices() {
  console.log('🚀 Initializing Bitcoin Full Node...');

  // Initialize settings
  settingsManager = new SettingsManager();
  const settings = settingsManager.getSettings();

  // Initialize Bitcoin daemon
  bitcoinDaemon = new BitcoinDaemon(settings);
  await bitcoinDaemon.start();

  // Initialize wallet manager
  walletManager = new WalletManager(bitcoinDaemon);

  console.log('✅ Bitcoin Full Node initialized successfully');
}

// App lifecycle
app.whenReady().then(async () => {
  await initializeServices();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  console.log('🛑 Shutting down Bitcoin daemon...');
  if (bitcoinDaemon) {
    await bitcoinDaemon.stop();
  }
});

// ===== IPC HANDLERS =====

// Daemon status
ipcMain.handle('daemon:getStatus', async () => {
  if (!bitcoinDaemon) return null;
  return bitcoinDaemon.getStatus();
});

ipcMain.handle('daemon:getBlockchainInfo', async () => {
  if (!bitcoinDaemon) return null;
  return bitcoinDaemon.getBlockchainInfo();
});

ipcMain.handle('daemon:getNetworkInfo', async () => {
  if (!bitcoinDaemon) return null;
  return bitcoinDaemon.getNetworkInfo();
});

ipcMain.handle('daemon:getPeerInfo', async () => {
  if (!bitcoinDaemon) return null;
  return bitcoinDaemon.getPeerInfo();
});

// Wallet operations
ipcMain.handle('wallet:create', async (_, walletName: string, passphrase: string) => {
  if (!walletManager) throw new Error('Wallet manager not initialized');
  return walletManager.createWallet(walletName, passphrase);
});

ipcMain.handle('wallet:load', async (_, walletName: string) => {
  if (!walletManager) throw new Error('Wallet manager not initialized');
  return walletManager.loadWallet(walletName);
});

ipcMain.handle('wallet:getBalance', async () => {
  if (!walletManager) throw new Error('Wallet manager not initialized');
  return walletManager.getBalance();
});

ipcMain.handle('wallet:getAddresses', async () => {
  if (!walletManager) throw new Error('Wallet manager not initialized');
  return walletManager.getAddresses();
});

ipcMain.handle('wallet:generateAddress', async (_, label?: string) => {
  if (!walletManager) throw new Error('Wallet manager not initialized');
  return walletManager.generateAddress(label);
});

ipcMain.handle('wallet:getTransactions', async (_, limit: number = 100) => {
  if (!walletManager) throw new Error('Wallet manager not initialized');
  return walletManager.getTransactions(limit);
});

ipcMain.handle('wallet:sendTransaction', async (_, to: string, amount: number, fee?: number) => {
  if (!walletManager) throw new Error('Wallet manager not initialized');
  return walletManager.sendTransaction(to, amount, fee);
});

ipcMain.handle('wallet:estimateFee', async (_, to: string, amount: number) => {
  if (!walletManager) throw new Error('Wallet manager not initialized');
  return walletManager.estimateFee(to, amount);
});

ipcMain.handle('wallet:backup', async (_, destination: string) => {
  if (!walletManager) throw new Error('Wallet manager not initialized');
  return walletManager.backupWallet(destination);
});

// Settings
ipcMain.handle('settings:get', () => {
  if (!settingsManager) throw new Error('Settings manager not initialized');
  return settingsManager.getSettings();
});

ipcMain.handle('settings:update', (_, settings: any) => {
  if (!settingsManager) throw new Error('Settings manager not initialized');
  return settingsManager.updateSettings(settings);
});

// System info
ipcMain.handle('system:getInfo', () => {
  return {
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    owner: 'Joseph Michael Rounsaville',
  };
});

console.log('🎯 Bitcoin Full Node Desktop Application');
console.log('👤 Owner: Joseph Michael Rounsaville');
console.log('📍 Mode: Offline Full Node with Daemon');
