import { useState } from 'react';
import { Send, QrCode } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

export default function SendReceivePage() {
  const { sendTransaction } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!recipient || !amount) return;

    setSending(true);
    try {
      await sendTransaction(recipient, amount);
      setRecipient('');
      setAmount('');
    } catch (error) {
      console.error('Send failed:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold text-white">Send & Receive</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Send */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Send className="text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Send Tokens</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Amount (PSC)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={sending || !recipient || !amount}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all"
            >
              {sending ? 'Sending...' : 'Send Tokens'}
            </button>
          </div>
        </div>

        {/* Receive */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <QrCode className="text-green-400" />
            <h3 className="text-xl font-semibold text-white">Receive Tokens</h3>
          </div>

          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg p-4 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <QrCode size={120} />
                <div className="text-sm mt-2">QR Code</div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-2">Your Address</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value="0x1234...5678"
                  readOnly
                  className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none"
                />
                <button className="px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
