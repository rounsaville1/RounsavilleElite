import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import WalletPage from './pages/WalletPage';
import StakingPage from './pages/StakingPage';
import GovernancePage from './pages/GovernancePage';
import SendReceivePage from './pages/SendReceivePage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/wallet" replace />} />
            <Route path="wallet" element={<WalletPage />} />
            <Route path="send-receive" element={<SendReceivePage />} />
            <Route path="staking" element={<StakingPage />} />
            <Route path="governance" element={<GovernancePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
