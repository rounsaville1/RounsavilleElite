import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [blockchainInfo, setBlockchainInfo] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [blockchain, network, bal] = await Promise.all([
        window.bitcoinAPI.daemon.getBlockchainInfo(),
        window.bitcoinAPI.daemon.getNetworkInfo(),
        window.bitcoinAPI.wallet.getBalance().catch(() => null),
      ]);

      setBlockchainInfo(blockchain);
      setNetworkInfo(network);
      setBalance(bal);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-gray-400">Bitcoin Full Node Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔗</span>
            </div>
            <div className="text-sm text-gray-400">Block Height</div>
          </div>
          <div className="text-3xl font-bold text-white">
            {blockchainInfo ? formatNumber(blockchainInfo.blocks) : '---'}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {blockchainInfo?.chain || 'main'}
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-sm text-gray-400">Balance</div>
          </div>
          <div className="text-3xl font-bold text-white">
            {balance ? balance.total.toFixed(8) : '0.00000000'}
          </div>
          <div className="text-xs text-orange-400 mt-2">BTC</div>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🌐</span>
            </div>
            <div className="text-sm text-gray-400">Connections</div>
          </div>
          <div className="text-3xl font-bold text-white">
            {networkInfo ? networkInfo.connections : '0'}
          </div>
          <div className="text-xs text-gray-500 mt-2">Peers</div>
        </div>

        <div className="glass rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-sm text-gray-400">Verification</div>
          </div>
          <div className="text-3xl font-bold text-white">
            {blockchainInfo ? (blockchainInfo.verificationprogress * 100).toFixed(1) : '0.0'}%
          </div>
          <div className="text-xs text-gray-500 mt-2">Progress</div>
        </div>
      </div>

      {/* Blockchain Info */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Blockchain Information</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-400">Chain</div>
              <div className="text-white font-mono">{blockchainInfo?.chain || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Difficulty</div>
              <div className="text-white font-mono">
                {blockchainInfo ? blockchainInfo.difficulty.toExponential(2) : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Size on Disk</div>
              <div className="text-white font-mono">
                {blockchainInfo ? (blockchainInfo.size_on_disk / 1e9).toFixed(2) + ' GB' : 'N/A'}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-400">Best Block Hash</div>
              <div className="text-white font-mono text-xs truncate">
                {blockchainInfo?.bestblockhash || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Network</div>
              <div className="text-white font-mono">
                {networkInfo?.networkactive ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Protocol Version</div>
              <div className="text-white font-mono">
                {networkInfo?.protocolversion || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Owner Info */}
      <div className="glass rounded-xl p-6 border-2 border-orange-500/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-orange rounded-full flex items-center justify-center text-white font-bold text-2xl bitcoin-shadow">
            JMR
          </div>
          <div>
            <div className="text-sm text-gray-400">Node Operator</div>
            <div className="text-2xl font-bold gradient-text">
              Joseph Michael Rounsaville
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Full Node • Maximum Security • Offline Signing
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
