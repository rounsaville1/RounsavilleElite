import { Outlet, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Layout() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    // Detect search type and navigate accordingly
    if (searchQuery.startsWith('0x') && searchQuery.length === 66) {
      navigate(`/tx/${searchQuery}`);
    } else if (searchQuery.startsWith('0x') && searchQuery.length === 42) {
      navigate(`/address/${searchQuery}`);
    } else if (!isNaN(Number(searchQuery))) {
      navigate(`/blocks/${searchQuery}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg" />
              PresenceChain Explorer
            </Link>
            <nav className="flex gap-6 text-gray-300">
              <Link to="/blocks" className="hover:text-white transition">
                Blocks
              </Link>
            </nav>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Address / Txn Hash / Block Number"
                className="w-full bg-white/10 border border-white/20 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-lg border-t border-white/10 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-gray-400 text-sm">
          <p>PresenceChain Explorer v1.0.0 - Powered by Proof-of-Stake</p>
        </div>
      </footer>
    </div>
  );
}
