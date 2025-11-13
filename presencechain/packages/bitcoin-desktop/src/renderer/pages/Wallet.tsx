import { useState, useEffect } from 'react';

export default function Wallet() {
  const [balance, setBalance] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState('');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const [bal, addrs] = await Promise.all([
        window.bitcoinAPI.wallet.getBalance(),
        window.bitcoinAPI.wallet.getAddresses(),
      ]);

      setBalance(bal);
      setAddresses(addrs);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    }
  };

  const handleGenerateAddress = async () => {
    try {
      await window.bitcoinAPI.wallet.generateAddress(addressLabel || undefined);
      setAddressLabel('');
      setShowNewAddress(false);
      await loadWalletData();
    } catch (error) {
      console.error('Failed to generate address:', error);
      alert('Failed to generate address');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Wallet</h2>
          <p className="text-gray-400">Manage your Bitcoin addresses and balance</p>
        </div>
        <button
          onClick={() => setShowNewAddress(true)}
          className="px-6 py-3 bg-gradient-orange rounded-lg font-semibold hover:opacity-90 transition bitcoin-shadow"
        >
          + New Address
        </button>
      </div>

      {/* Balance Card */}
      <div className="glass rounded-xl p-8 border-2 border-orange-500/30 bitcoin-shadow">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400 mb-2">Total Balance</div>
            <div className="text-5xl font-bold text-white mb-2">
              {balance ? balance.total.toFixed(8) : '0.00000000'}
              <span className="text-2xl text-orange-400 ml-3">BTC</span>
            </div>
            <div className="flex gap-6 text-sm mt-4">
              <div>
                <span className="text-gray-400">Confirmed: </span>
                <span className="text-green-400 font-mono">
                  {balance ? balance.confirmed.toFixed(8) : '0.00000000'} BTC
                </span>
              </div>
              <div>
                <span className="text-gray-400">Unconfirmed: </span>
                <span className="text-yellow-400 font-mono">
                  {balance ? balance.unconfirmed.toFixed(8) : '0.00000000'} BTC
                </span>
              </div>
            </div>
          </div>
          <div className="w-24 h-24 bg-gradient-orange rounded-full flex items-center justify-center text-white font-bold text-4xl bitcoin-shadow">
            ₿
          </div>
        </div>
      </div>

      {/* New Address Modal */}
      {showNewAddress && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="glass rounded-xl p-6 max-w-md w-full m-4">
            <h3 className="text-xl font-bold text-white mb-4">Generate New Address</h3>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Label (Optional)
              </label>
              <input
                type="text"
                value={addressLabel}
                onChange={(e) => setAddressLabel(e.target.value)}
                placeholder="e.g., Savings, Trading, etc."
                className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleGenerateAddress}
                className="flex-1 px-4 py-3 bg-gradient-orange rounded-lg font-semibold hover:opacity-90 transition"
              >
                Generate
              </button>
              <button
                onClick={() => {
                  setShowNewAddress(false);
                  setAddressLabel('');
                }}
                className="flex-1 px-4 py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Addresses List */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Your Addresses</h3>

        <div className="space-y-3">
          {addresses.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📭</div>
              <p>No addresses yet. Generate your first address to get started.</p>
            </div>
          ) : (
            addresses.map((addr, index) => (
              <div
                key={index}
                className="bg-black/50 rounded-lg p-4 hover:bg-black/70 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {addr.label && (
                        <span className="px-2 py-1 bg-orange-500/20 border border-orange-500/30 rounded text-xs text-orange-400">
                          {addr.label}
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-sm text-white break-all">
                      {addr.address}
                    </div>
                    {addr.amount > 0 && (
                      <div className="text-xs text-green-400 mt-2">
                        Balance: {addr.amount.toFixed(8)} BTC
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => copyToClipboard(addr.address)}
                    className="ml-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Security Warning */}
      <div className="glass rounded-xl p-6 border-2 border-yellow-500/30">
        <div className="flex items-start gap-4">
          <div className="text-3xl">⚠️</div>
          <div>
            <h4 className="text-lg font-bold text-yellow-400 mb-2">
              Security Reminder
            </h4>
            <p className="text-gray-300 text-sm">
              This is a full node wallet running on Bitcoin mainnet. Always backup your wallet
              and keep your private keys secure. Never share your private keys or wallet backup
              with anyone. For Joseph Michael Rounsaville only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
