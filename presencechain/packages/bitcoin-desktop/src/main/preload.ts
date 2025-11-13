import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('bitcoinAPI', {
  // Daemon operations
  daemon: {
    getStatus: () => ipcRenderer.invoke('daemon:getStatus'),
    getBlockchainInfo: () => ipcRenderer.invoke('daemon:getBlockchainInfo'),
    getNetworkInfo: () => ipcRenderer.invoke('daemon:getNetworkInfo'),
    getPeerInfo: () => ipcRenderer.invoke('daemon:getPeerInfo'),
  },

  // Wallet operations
  wallet: {
    create: (walletName: string, passphrase: string) =>
      ipcRenderer.invoke('wallet:create', walletName, passphrase),
    load: (walletName: string) =>
      ipcRenderer.invoke('wallet:load', walletName),
    getBalance: () =>
      ipcRenderer.invoke('wallet:getBalance'),
    getAddresses: () =>
      ipcRenderer.invoke('wallet:getAddresses'),
    generateAddress: (label?: string) =>
      ipcRenderer.invoke('wallet:generateAddress', label),
    getTransactions: (limit?: number) =>
      ipcRenderer.invoke('wallet:getTransactions', limit),
    sendTransaction: (to: string, amount: number, fee?: number) =>
      ipcRenderer.invoke('wallet:sendTransaction', to, amount, fee),
    estimateFee: (to: string, amount: number) =>
      ipcRenderer.invoke('wallet:estimateFee', to, amount),
    backup: (destination: string) =>
      ipcRenderer.invoke('wallet:backup', destination),
  },

  // Settings operations
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (settings: any) => ipcRenderer.invoke('settings:update', settings),
  },

  // System info
  system: {
    getInfo: () => ipcRenderer.invoke('system:getInfo'),
  },
});

// Type definitions for TypeScript
export interface BitcoinAPI {
  daemon: {
    getStatus: () => Promise<any>;
    getBlockchainInfo: () => Promise<any>;
    getNetworkInfo: () => Promise<any>;
    getPeerInfo: () => Promise<any>;
  };
  wallet: {
    create: (walletName: string, passphrase: string) => Promise<any>;
    load: (walletName: string) => Promise<any>;
    getBalance: () => Promise<any>;
    getAddresses: () => Promise<any[]>;
    generateAddress: (label?: string) => Promise<string>;
    getTransactions: (limit?: number) => Promise<any[]>;
    sendTransaction: (to: string, amount: number, fee?: number) => Promise<string>;
    estimateFee: (to: string, amount: number) => Promise<number>;
    backup: (destination: string) => Promise<void>;
  };
  settings: {
    get: () => Promise<any>;
    update: (settings: any) => Promise<any>;
  };
  system: {
    getInfo: () => Promise<any>;
  };
}

declare global {
  interface Window {
    bitcoinAPI: BitcoinAPI;
  }
}
