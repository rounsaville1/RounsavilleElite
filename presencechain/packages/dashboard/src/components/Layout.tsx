import { Outlet, Link, useLocation } from 'react-router-dom';
import { Wallet, Send, Coins, Vote } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/wallet', icon: Wallet, label: 'Wallet' },
    { path: '/send-receive', icon: Send, label: 'Send/Receive' },
    { path: '/staking', icon: Coins, label: 'Staking' },
    { path: '/governance', icon: Vote, label: 'Governance' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg" />
              PresenceChain
            </h1>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm">
                Connected
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-6 py-3 transition-colors ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-lg border-t border-white/10 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-gray-400 text-sm">
          <p>PresenceChain v1.0.0 - Powered by Proof-of-Stake</p>
        </div>
      </footer>
    </div>
  );
}
