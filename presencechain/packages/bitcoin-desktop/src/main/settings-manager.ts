import Store from 'electron-store';
import * as path from 'path';
import * as os from 'os';
import { BitcoinSettings } from './bitcoin-daemon';

interface AppSettings extends BitcoinSettings {
  theme: 'dark' | 'light';
  autoStart: boolean;
  minimizeToTray: boolean;
  notifications: boolean;
  currency: string;
}

export class SettingsManager {
  private store: Store<AppSettings>;

  constructor() {
    this.store = new Store<AppSettings>({
      name: 'bitcoin-desktop-settings',
      defaults: this.getDefaultSettings(),
    });
  }

  private getDefaultSettings(): AppSettings {
    const homeDir = os.homedir();
    const defaultDataDir = path.join(homeDir, '.bitcoin-desktop-jmr');

    return {
      // Bitcoin daemon settings
      dataDir: defaultDataDir,
      rpcUser: 'bitcoinrpc',
      rpcPassword: this.generateSecurePassword(),
      rpcPort: 8332,
      network: 'mainnet',
      pruned: false,
      maxConnections: 125,
      txIndex: true,

      // App settings
      theme: 'dark',
      autoStart: false,
      minimizeToTray: true,
      notifications: true,
      currency: 'USD',
    };
  }

  private generateSecurePassword(): string {
    return Array.from({ length: 32 }, () =>
      Math.random().toString(36)[2]
    ).join('');
  }

  getSettings(): AppSettings {
    return this.store.store;
  }

  updateSettings(settings: Partial<AppSettings>): AppSettings {
    // Merge with existing settings
    const newSettings = {
      ...this.store.store,
      ...settings,
    };

    this.store.store = newSettings;
    console.log('⚙️ Settings updated');

    return newSettings;
  }

  resetSettings(): AppSettings {
    const defaults = this.getDefaultSettings();
    this.store.store = defaults;
    console.log('🔄 Settings reset to defaults');
    return defaults;
  }

  getSetting<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.store.get(key);
  }

  setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.store.set(key, value);
  }
}
