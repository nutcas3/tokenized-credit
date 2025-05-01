import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Loans } from './pages/Loans';
import { Tranches } from './pages/Tranches';
import { Underwriter } from './pages/Underwriter';
import { Admin } from './pages/Admin';
import { WalletProvider } from './context/WalletContext';

function App() {


  return (
    <BrowserRouter>
      <WalletProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/tranches" element={<Tranches />} />
            <Route path="/underwriter" element={<Underwriter />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </WalletProvider>
    </BrowserRouter>
  );
}

export default App;
