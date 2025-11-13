import { useState, useEffect } from 'react';

export default function Settings() {
  const [settings, setSettings] = useState<any>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);

  useEffect(() => {
    loadSettings();
    loadSystemInfo();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await window.bitcoinAPI.settings.get();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadSystemInfo = async () => {
    try {
      const info = await window.bitcoinAPI.system.getInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error('Failed to load system info:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
        <p className="text-gray-400">Configure your Bitcoin full node</p>
      </div>

      {/* Owner Information */}
      <div className="glass rounded-xl p-6 border-2 border-orange-500/30">
        <h3 className="text-xl font-bold text-white mb-4">Owner Information</h3>

        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gradient-orange rounded-full flex items-center justify-center text-white font-bold text-4xl bitcoin-shadow">
            JMR
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold gradient-text mb-2">
              Joseph Michael Rounsaville
            </div>
            <div className="text-gray-400 space-y-1">
              <div>🔐 Node Operator & Owner</div>
              <div>🌐 Running Bitcoin Full Node (Mainnet)</div>
              <div>💼 Offline Cold Storage Configuration</div>
              <div>⚡ Maximum Security Mode Enabled</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      {systemInfo && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">System Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400">Application Version</div>
              <div className="text-white font-mono">{systemInfo.version}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Platform</div>
              <div className="text-white font-mono capitalize">{systemInfo.platform}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Architecture</div>
              <div className="text-white font-mono">{systemInfo.arch}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Electron Version</div>
              <div className="text-white font-mono">{systemInfo.electronVersion}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Node.js Version</div>
              <div className="text-white font-mono">{systemInfo.nodeVersion}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Owner</div>
              <div className="text-white font-mono">{systemInfo.owner}</div>
            </div>
          </div>
        </div>
      )}

      {/* Bitcoin Settings */}
      {settings && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Bitcoin Core Settings</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400">Network</div>
                <div className="text-white font-mono uppercase">{settings.network}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">RPC Port</div>
                <div className="text-white font-mono">{settings.rpcPort}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Data Directory</div>
                <div className="text-white font-mono text-sm truncate" title={settings.dataDir}>
                  {settings.dataDir}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Max Connections</div>
                <div className="text-white font-mono">{settings.maxConnections}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Transaction Index</div>
                <div className="text-white font-mono">{settings.txIndex ? 'Enabled' : 'Disabled'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Pruned Mode</div>
                <div className="text-white font-mono">{settings.pruned ? 'Yes' : 'No (Full Node)'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Features */}
      <div className="glass rounded-xl p-6 border-2 border-green-500/30">
        <h3 className="text-xl font-bold text-white mb-4">Security Features</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔒</div>
              <div>
                <div className="text-white font-semibold">Offline Mode</div>
                <div className="text-sm text-gray-400">Full node running without external API dependencies</div>
              </div>
            </div>
            <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-semibold text-green-400">
              ACTIVE
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🛡️</div>
              <div>
                <div className="text-white font-semibold">Cold Storage</div>
                <div className="text-sm text-gray-400">Private keys never exposed to network</div>
              </div>
            </div>
            <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-semibold text-green-400">
              ACTIVE
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔐</div>
              <div>
                <div className="text-white font-semibold">Encrypted Wallet</div>
                <div className="text-sm text-gray-400">Wallet protected with strong encryption</div>
              </div>
            </div>
            <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-semibold text-green-400">
              ACTIVE
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl">⚡</div>
              <div>
                <div className="text-white font-semibold">Full Node Verification</div>
                <div className="text-sm text-gray-400">Independently verifying all transactions</div>
              </div>
            </div>
            <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs font-semibold text-green-400">
              ACTIVE
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">About</h3>

        <div className="space-y-3 text-gray-300">
          <p>
            This is a Bitcoin Full Node desktop application designed for maximum security and privacy.
            Running on Bitcoin mainnet with offline capabilities for cold storage operations.
          </p>
          <p className="text-sm text-gray-400">
            Built exclusively for Joseph Michael Rounsaville. This application provides complete
            control over your Bitcoin funds with enterprise-grade security features.
          </p>
          <div className="pt-4 border-t border-gray-800">
            <div className="text-sm text-gray-500">
              For support or questions about this application, consult the technical documentation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
