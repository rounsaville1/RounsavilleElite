import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BlocksPage from './pages/BlocksPage';
import BlockDetailPage from './pages/BlockDetailPage';
import TransactionDetailPage from './pages/TransactionDetailPage';
import AddressPage from './pages/AddressPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="blocks" element={<BlocksPage />} />
            <Route path="blocks/:id" element={<BlockDetailPage />} />
            <Route path="tx/:hash" element={<TransactionDetailPage />} />
            <Route path="address/:address" element={<AddressPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
