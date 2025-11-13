import { useState, useEffect } from 'react';

export default function Network() {
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [peerInfo, setPeerInfo] = useState<any[]>([]);
  const [blockchainInfo, setBlockchainInfo] = useState<any>(null);

  useEffect(() => {
    loadNetworkData();
    const interval = setInterval(loadNetworkData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadNetworkData = async () => {
    try {
      const [network, peers, blockchain] = await Promise.all([
        window.bitcoinAPI.daemon.getNetworkInfo(),
        window.bitcoinAPI.daemon.getPeerInfo(),
        window.bitcoinAPI.daemon.getBlockchainInfo(),
      ]);

      setNetworkInfo(network);
      setPeerInfo(peers || []);
      setBlockchainInfo(blockchain);
    } catch (error) {
      console.error('Failed to load network data:', error);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Network</h2>
        <p className="text-gray-400">Monitor Bitcoin network status and peers</p>
      </div>

      {/* Network Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🌐</span>
            </div>
            <div className="text-sm text-gray-400">Network Status</div>
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {networkInfo?.networkactive ? 'Active' : 'Inactive'}
          </div>
          <div className="text-xs text-gray-500">
            {networkInfo?.connections || 0} peer connections
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <div className="text-sm text-gray-400">Protocol Version</div>
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {networkInfo?.protocolversion || 'N/A'}
          </div>
          <div className="text-xs text-gray-500">
            Subversion: {networkInfo?.subversion || 'N/A'}
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📡</span>
            </div>
            <div className="text-sm text-gray-400">Relay Fee</div>
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {networkInfo?.relayfee?.toFixed(8) || '0.00000000'}
          </div>
          <div className="text-xs text-orange-400">BTC/kB</div>
        </div>
      </div>

      {/* Blockchain Sync Status */}
      {blockchainInfo && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Synchronization Status</h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Verification Progress</span>
                <span className="text-white font-mono">
                  {(blockchainInfo.verificationprogress * 100).toFixed(4)}%
                </span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-orange transition-all duration-500"
                  style={{ width: `${blockchainInfo.verificationprogress * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <div className="text-sm text-gray-400">Current Height</div>
                <div className="text-white font-mono text-lg">
                  {blockchainInfo.blocks.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Headers</div>
                <div className="text-white font-mono text-lg">
                  {blockchainInfo.headers.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connected Peers */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          Connected Peers ({peerInfo.length})
        </h3>

        {peerInfo.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-6xl mb-4">🔌</div>
            <p>No peers connected</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {peerInfo.map((peer, index) => (
              <div
                key={index}
                className="bg-black/50 rounded-lg p-4 hover:bg-black/70 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl">
                        {peer.inbound ? '📥' : '📤'}
                      </span>
                      <div>
                        <div className="font-mono text-sm text-white">
                          {peer.addr}
                        </div>
                        <div className="text-xs text-gray-400">
                          {peer.subver || 'Unknown client'}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-6 text-xs mt-2">
                      <div>
                        <span className="text-gray-400">Sent: </span>
                        <span className="text-blue-400">{formatBytes(peer.bytessent || 0)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Received: </span>
                        <span className="text-green-400">{formatBytes(peer.bytesrecv || 0)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Ping: </span>
                        <span className="text-purple-400">{peer.pingtime?.toFixed(3) || 'N/A'}s</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${
                      peer.inbound
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {peer.inbound ? 'INBOUND' : 'OUTBOUND'}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Height: {peer.synced_headers?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Network Info */}
      {networkInfo && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Network Information</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400">Network Active</div>
              <div className="text-white font-mono">
                {networkInfo.networkactive ? 'Yes' : 'No'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Local Services</div>
              <div className="text-white font-mono text-sm">
                {networkInfo.localservices || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Increment Fee</div>
              <div className="text-white font-mono">
                {networkInfo.incrementalfee?.toFixed(8) || 'N/A'} BTC
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Warnings</div>
              <div className="text-white font-mono">
                {networkInfo.warnings || 'None'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
