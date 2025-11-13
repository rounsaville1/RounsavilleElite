import Client from 'bitcoin-core';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn, ChildProcess } from 'child_process';

export interface BitcoinSettings {
  dataDir: string;
  rpcUser: string;
  rpcPassword: string;
  rpcPort: number;
  network: 'mainnet' | 'testnet' | 'regtest';
  pruned: boolean;
  maxConnections: number;
  txIndex: boolean;
}

export class BitcoinDaemon extends EventEmitter {
  private client: Client | null = null;
  private process: ChildProcess | null = null;
  private settings: BitcoinSettings;
  private isRunning: boolean = false;
  private syncProgress: number = 0;

  constructor(settings: BitcoinSettings) {
    super();
    this.settings = settings;
  }

  async start(): Promise<void> {
    console.log('🔧 Starting Bitcoin Core daemon...');

    // Ensure data directory exists
    if (!fs.existsSync(this.settings.dataDir)) {
      fs.mkdirSync(this.settings.dataDir, { recursive: true });
    }

    // Create bitcoin.conf
    this.createConfigFile();

    // Start bitcoind process
    await this.startDaemon();

    // Initialize RPC client
    this.client = new Client({
      network: this.settings.network,
      host: '127.0.0.1',
      port: this.settings.rpcPort,
      username: this.settings.rpcUser,
      password: this.settings.rpcPassword,
    });

    // Wait for daemon to be ready
    await this.waitForReady();

    this.isRunning = true;
    console.log('✅ Bitcoin Core daemon started successfully');

    // Start monitoring sync progress
    this.monitorSync();
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping Bitcoin Core daemon...');

    if (this.client) {
      try {
        await this.client.stop();
      } catch (error) {
        console.error('Error stopping daemon via RPC:', error);
      }
    }

    if (this.process) {
      this.process.kill('SIGTERM');
    }

    this.isRunning = false;
    console.log('✅ Bitcoin Core daemon stopped');
  }

  private createConfigFile(): void {
    const configPath = path.join(this.settings.dataDir, 'bitcoin.conf');

    const config = `
# Bitcoin Configuration for Joseph Michael Rounsaville
# Network: ${this.settings.network}

# RPC Settings
server=1
rpcuser=${this.settings.rpcUser}
rpcpassword=${this.settings.rpcPassword}
rpcport=${this.settings.rpcPort}
rpcallowip=127.0.0.1

# Network Settings
${this.settings.network === 'testnet' ? 'testnet=1' : ''}
${this.settings.network === 'regtest' ? 'regtest=1' : ''}
maxconnections=${this.settings.maxConnections}

# Blockchain Settings
txindex=${this.settings.txIndex ? '1' : '0'}
${this.settings.pruned ? 'prune=550' : ''}

# Performance
dbcache=4096
par=4

# Daemon mode
daemon=1
`.trim();

    fs.writeFileSync(configPath, config);
    console.log('📝 Created bitcoin.conf');
  }

  private async startDaemon(): Promise<void> {
    return new Promise((resolve, reject) => {
      const bitcoindPath = this.findBitcoindPath();

      if (!bitcoindPath) {
        reject(new Error('bitcoind not found. Please install Bitcoin Core.'));
        return;
      }

      const args = [
        `-datadir=${this.settings.dataDir}`,
        '-daemon',
      ];

      console.log(`🚀 Executing: ${bitcoindPath} ${args.join(' ')}`);

      this.process = spawn(bitcoindPath, args);

      this.process.on('error', (error) => {
        console.error('Failed to start bitcoind:', error);
        reject(error);
      });

      // Give it a moment to start
      setTimeout(() => resolve(), 3000);
    });
  }

  private findBitcoindPath(): string | null {
    // Common locations for bitcoind
    const possiblePaths = [
      '/usr/local/bin/bitcoind',
      '/usr/bin/bitcoind',
      path.join(os.homedir(), '.bitcoin/bitcoind'),
      'C:\\Program Files\\Bitcoin\\daemon\\bitcoind.exe',
      'bitcoind', // System PATH
    ];

    for (const binPath of possiblePaths) {
      if (fs.existsSync(binPath) || binPath === 'bitcoind') {
        return binPath;
      }
    }

    return null;
  }

  private async waitForReady(timeout: number = 60000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        if (this.client) {
          await this.client.getBlockchainInfo();
          console.log('✅ Bitcoin daemon is ready');
          return;
        }
      } catch (error) {
        // Not ready yet, wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    throw new Error('Bitcoin daemon failed to start within timeout');
  }

  private async monitorSync(): Promise<void> {
    if (!this.isRunning) return;

    try {
      const info = await this.getBlockchainInfo();
      if (info) {
        this.syncProgress = info.verificationprogress * 100;
        this.emit('sync-progress', this.syncProgress);

        if (this.syncProgress < 99.99) {
          console.log(`⚡ Sync progress: ${this.syncProgress.toFixed(2)}%`);
        }
      }
    } catch (error) {
      console.error('Error monitoring sync:', error);
    }

    // Check again in 10 seconds
    setTimeout(() => this.monitorSync(), 10000);
  }

  async getStatus(): Promise<any> {
    return {
      running: this.isRunning,
      syncProgress: this.syncProgress,
      network: this.settings.network,
    };
  }

  async getBlockchainInfo(): Promise<any> {
    if (!this.client) return null;
    try {
      return await this.client.getBlockchainInfo();
    } catch (error) {
      console.error('Error getting blockchain info:', error);
      return null;
    }
  }

  async getNetworkInfo(): Promise<any> {
    if (!this.client) return null;
    try {
      return await this.client.getNetworkInfo();
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }

  async getPeerInfo(): Promise<any> {
    if (!this.client) return null;
    try {
      return await this.client.getPeerInfo();
    } catch (error) {
      console.error('Error getting peer info:', error);
      return null;
    }
  }

  getClient(): Client | null {
    return this.client;
  }
}
