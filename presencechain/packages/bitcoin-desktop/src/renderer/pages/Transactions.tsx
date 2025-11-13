import { useState, useEffect } from 'react';

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({
    to: '',
    amount: '',
    fee: '',
  });
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);

  useEffect(() => {
    loadTransactions();
    const interval = setInterval(loadTransactions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTransactions = async () => {
    try {
      const txs = await window.bitcoinAPI.wallet.getTransactions(100);
      setTransactions(txs || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const handleEstimateFee = async () => {
    if (!sendForm.to || !sendForm.amount) return;

    try {
      const fee = await window.bitcoinAPI.wallet.estimateFee(
        sendForm.to,
        parseFloat(sendForm.amount)
      );
      setEstimatedFee(fee);
    } catch (error) {
      console.error('Failed to estimate fee:', error);
    }
  };

  const handleSend = async () => {
    if (!sendForm.to || !sendForm.amount) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const txid = await window.bitcoinAPI.wallet.sendTransaction(
        sendForm.to,
        parseFloat(sendForm.amount),
        sendForm.fee ? parseFloat(sendForm.fee) : undefined
      );

      alert(`Transaction sent successfully!\n\nTXID: ${txid}`);
      setShowSendModal(false);
      setSendForm({ to: '', amount: '', fee: '' });
      setEstimatedFee(null);
      await loadTransactions();
    } catch (error: any) {
      console.error('Failed to send transaction:', error);
      alert(`Failed to send transaction: ${error.message}`);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getTransactionIcon = (category: string) => {
    switch (category) {
      case 'send':
        return '📤';
      case 'receive':
        return '📥';
      case 'generate':
        return '⛏️';
      default:
        return '📝';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Transactions</h2>
          <p className="text-gray-400">View and manage your Bitcoin transactions</p>
        </div>
        <button
          onClick={() => setShowSendModal(true)}
          className="px-6 py-3 bg-gradient-orange rounded-lg font-semibold hover:opacity-90 transition bitcoin-shadow"
        >
          📤 Send Bitcoin
        </button>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="glass rounded-xl p-6 max-w-lg w-full m-4">
            <h3 className="text-xl font-bold text-white mb-4">Send Bitcoin</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Recipient Address *
                </label>
                <input
                  type="text"
                  value={sendForm.to}
                  onChange={(e) => setSendForm({ ...sendForm, to: e.target.value })}
                  placeholder="bc1q..."
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Amount (BTC) *
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  value={sendForm.amount}
                  onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
                  onBlur={handleEstimateFee}
                  placeholder="0.00000000"
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Fee (BTC/kB) - Optional
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  value={sendForm.fee}
                  onChange={(e) => setSendForm({ ...sendForm, fee: e.target.value })}
                  placeholder="Auto"
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-orange-500"
                />
                {estimatedFee && (
                  <div className="text-xs text-gray-400 mt-2">
                    Estimated fee: {estimatedFee.toFixed(8)} BTC/kB
                  </div>
                )}
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">⚠️</span>
                  <div className="text-sm text-yellow-200">
                    <strong>Warning:</strong> This transaction will be broadcast to the Bitcoin
                    mainnet. Double-check the recipient address before sending.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSend}
                className="flex-1 px-4 py-3 bg-gradient-orange rounded-lg font-semibold hover:opacity-90 transition"
              >
                Send Transaction
              </button>
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setSendForm({ to: '', amount: '', fee: '' });
                  setEstimatedFee(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-800 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Transaction History</h3>

        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📭</div>
              <p>No transactions yet</p>
            </div>
          ) : (
            transactions.map((tx, index) => (
              <div
                key={index}
                className="bg-black/50 rounded-lg p-4 hover:bg-black/70 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-3xl">{getTransactionIcon(tx.category)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          tx.category === 'send'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {tx.category.toUpperCase()}
                        </span>
                        {tx.confirmations > 0 && (
                          <span className="text-xs text-gray-400">
                            {tx.confirmations} confirmations
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-sm text-gray-400 mb-1">
                        {tx.txid}
                      </div>
                      {tx.address && (
                        <div className="font-mono text-xs text-gray-500">
                          {tx.address}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        {tx.time ? formatDate(tx.time) : 'Pending'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${
                      tx.category === 'send' ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {tx.category === 'send' ? '-' : '+'}{Math.abs(tx.amount).toFixed(8)} BTC
                    </div>
                    {tx.fee && (
                      <div className="text-xs text-gray-400 mt-1">
                        Fee: {Math.abs(tx.fee).toFixed(8)} BTC
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
