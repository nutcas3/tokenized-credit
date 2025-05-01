import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useWallet } from '../context/WalletContext';
import { formatAddress } from '../utils/format';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { address, isConnected, userRoles, usdcInfo } = useWallet();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Tokenized Credit</h1>
              <nav className="ml-10 flex items-center space-x-4">
                <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100">
                  Dashboard
                </Link>
                <Link to="/loans" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100">
                  Loans
                </Link>
                <Link to="/tranches" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100">
                  Invest
                </Link>
                {userRoles.isUnderwriter && (
                  <Link to="/underwriter" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100">
                    Underwriter
                  </Link>
                )}
                {userRoles.isAdmin && (
                  <Link to="/admin" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-100">
                    Admin
                  </Link>
                )}
              </nav>
            </div>
            <div className="flex items-center">
              {isConnected ? (
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    <span className="block">USDC: {usdcInfo.balance.toFixed(2)}</span>
                    <span className="block text-xs">{formatAddress(address || '')}</span>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Connected
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Tokenized Credit. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
