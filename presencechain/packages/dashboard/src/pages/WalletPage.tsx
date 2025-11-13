import { useWallet } from '../hooks/useWallet';
import { Copy, ExternalLink } from 'lucide-react';

export default function WalletPage() {
  const { address, balance, isConnected } = useWallet();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold text-white">My Wallet</h2>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
        <div className="text-sm opacity-80 mb-2">Total Balance</div>
        <div className="text-5xl font-bold mb-6">{balance || '0.00'} PSC</div>
        <div className="flex items-center gap-2 text-sm">
          <span className="opacity-80">Address:</span>
          <code className="bg-black/30 px-3 py-1 rounded">{address || 'Not connected'}</code>
          {address && (
            <button className="p-1 hover:bg-white/20 rounded">
              <Copy size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/10 rounded-xl p-6 text-white transition-all">
          <div className="text-xl font-semibold mb-2">Send</div>
          <div className="text-sm opacity-70">Transfer tokens</div>
        </button>
        <button className="bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/10 rounded-xl p-6 text-white transition-all">
          <div className="text-xl font-semibold mb-2">Receive</div>
          <div className="text-sm opacity-70">Get your address</div>
        </button>
        <button className="bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/10 rounded-xl p-6 text-white transition-all">
          <div className="text-xl font-semibold mb-2">Swap</div>
          <div className="text-sm opacity-70">Exchange tokens</div>
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Recent Transactions</h3>
        <div className="text-gray-400 text-center py-8">
          No recent transactions
        </div>
      </div>
    </div>
  );
}
