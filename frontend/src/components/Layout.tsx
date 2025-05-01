import { ReactNode } from 'react';
import { Link } from 'react-router';
import { useConnect, useDisconnect } from 'wagmi';
import { useWallet } from '../context/WalletContext';
import { formatAddress } from '../utils/format';
import { Button } from './Button';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { address, isConnected, userRoles, usdcInfo } = useWallet();
  const { connectors, connect, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  
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
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => disconnect()}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div>
                  {connectors.map((connector) => (
                    <Button
                      key={connector.uid}
                      variant="primary"
                      onClick={() => connect({ connector })}
                      className="mr-2"
                    >
                      Connect {connector.name}
                    </Button>
                  ))}
                  {connectError && <div className="text-sm text-red-500 mt-1">{connectError.message}</div>}
                </div>
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
