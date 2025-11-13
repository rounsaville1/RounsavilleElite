import { Coins, TrendingUp } from 'lucide-react';

export default function StakingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold text-white">Staking</h2>

      {/* Staking Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Total Staked</div>
          <div className="text-3xl font-bold text-white">0.00 PSC</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">APY</div>
          <div className="text-3xl font-bold text-green-400">12.5%</div>
        </div>
        <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-6">
          <div className="text-gray-400 text-sm mb-2">Rewards Earned</div>
          <div className="text-3xl font-bold text-white">0.00 PSC</div>
        </div>
      </div>

      {/* Stake Form */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Coins className="text-purple-400" />
          <h3 className="text-xl font-semibold text-white">Stake Tokens</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Amount to Stake (PSC)</label>
            <input
              type="number"
              placeholder="0.00"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex gap-2">
            <button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-lg transition-all">
              Stake
            </button>
            <button className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-semibold py-3 rounded-lg transition-all">
              Unstake
            </button>
          </div>
        </div>
      </div>

      {/* Validators */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Active Validators</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-black/30 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="text-white font-semibold">Validator {i}</div>
                <div className="text-gray-400 text-sm">Commission: 5%</div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-semibold">98.5% Uptime</div>
                <div className="text-gray-400 text-sm">1.2M PSC Staked</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
