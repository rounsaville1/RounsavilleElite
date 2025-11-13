import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Wallet from './pages/Wallet';
import Transactions from './pages/Transactions';
import Network from './pages/Network';
import Settings from './pages/Settings';
import Header from './components/Header';

type Page = 'dashboard' | 'wallet' | 'transactions' | 'network' | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [daemonStatus, setDaemonStatus] = useState<any>(null);

  useEffect(() => {
    loadSystemInfo();
    loadDaemonStatus();

    // Update daemon status every 5 seconds
    const interval = setInterval(loadDaemonStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemInfo = async () => {
    try {
      const info = await window.bitcoinAPI.system.getInfo();
      setSystemInfo(info);
    } catch (error) {
      console.error('Failed to load system info:', error);
    }
  };

  const loadDaemonStatus = async () => {
    try {
      const status = await window.bitcoinAPI.daemon.getStatus();
      setDaemonStatus(status);
    } catch (error) {
      console.error('Failed to load daemon status:', error);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'wallet':
        return <Wallet />;
      case 'transactions':
        return <Transactions />;
      case 'network':
        return <Network />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Header
        owner={systemInfo?.owner || 'Joseph Michael Rounsaville'}
        syncProgress={daemonStatus?.syncProgress || 0}
        isRunning={daemonStatus?.running || false}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto animate-fadeIn">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
