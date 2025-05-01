import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useWallet } from '../context/WalletContext';
import { useLoans } from '../hooks/useLoans';
import { useTranches } from '../hooks/useTranches';
import { LoanApplicationModal } from '../components/LoanApplicationModal';
import { formatCurrency, formatPercentage } from '../utils/format';

export function Dashboard() {
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const navigate = useNavigate();
  const { address, isConnected, userRoles } = useWallet();
  
  const { usePoolBalance, useLoanCount } = useLoans();
  const { useTotalValueLocked } = useTranches();
  
  const { data: poolBalanceData, isLoading: isLoadingPoolBalance } = usePoolBalance();
  const { data: loanCountData, isLoading: isLoadingLoanCount } = useLoanCount();
  const { data: tvlData, isLoading: isLoadingTVL } = useTotalValueLocked();
  
  const poolBalance = poolBalanceData?.balance || 0;
  const loanCount = loanCountData?.count || 0;
  const tvl = tvlData?.tvl || 0;
  
  const isLoading = isLoadingPoolBalance || isLoadingLoanCount || isLoadingTVL;
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>
      
      {isConnected ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-500">Total Value Locked</h3>
                {isLoading ? (
                  <div className="animate-pulse h-8 bg-gray-200 rounded mt-2"></div>
                ) : (
                  <p className="text-3xl font-bold mt-2">{formatCurrency(tvl)}</p>
                )}
              </div>
            </Card>
            
            <Card>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-500">Pool Balance</h3>
                {isLoading ? (
                  <div className="animate-pulse h-8 bg-gray-200 rounded mt-2"></div>
                ) : (
                  <p className="text-3xl font-bold mt-2">{formatCurrency(poolBalance)}</p>
                )}
              </div>
            </Card>
            
            <Card>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-500">Active Loans</h3>
                {isLoading ? (
                  <div className="animate-pulse h-8 bg-gray-200 rounded mt-2"></div>
                ) : (
                  <p className="text-3xl font-bold mt-2">{loanCount}</p>
                )}
              </div>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card title="For Borrowers">
              <div className="prose">
                <p>Need financing for your invoices? Apply for a loan and get funded quickly.</p>
                <ul>
                  <li>Fast approval process</li>
                  <li>Competitive interest rates</li>
                  <li>Flexible repayment terms</li>
                </ul>
              </div>
              <div className="mt-4">
                <Button onClick={() => setIsLoanModalOpen(true)}>
                  Apply for a Loan
                </Button>
              </div>
            </Card>
            
            <Card title="For Investors">
              <div className="prose">
                <p>Invest in tokenized credit and earn competitive yields.</p>
                <ul>
                  <li>Senior Tranche: Lower risk, stable returns</li>
                  <li>Junior Tranche: Higher risk, higher potential returns</li>
                  <li>Liquidity through LP tokens</li>
                </ul>
              </div>
              <div className="mt-4">
                <Button onClick={() => navigate('/tranches')}>
                  Invest Now
                </Button>
              </div>
            </Card>
          </div>
          
          {userRoles.isUnderwriter && (
            <Card title="Underwriter Dashboard" className="mb-8">
              <div className="prose">
                <p>As an underwriter, you can review and approve loan applications.</p>
              </div>
              <div className="mt-4">
                <Button onClick={() => navigate('/underwriter')}>
                  Go to Underwriter Dashboard
                </Button>
              </div>
            </Card>
          )}
          
          {userRoles.isAdmin && (
            <Card title="Admin Dashboard">
              <div className="prose">
                <p>As an admin, you have access to platform management features.</p>
              </div>
              <div className="mt-4">
                <Button onClick={() => navigate('/admin')}>
                  Go to Admin Dashboard
                </Button>
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Connect your wallet to get started</h2>
            <p className="text-gray-500 mb-6">
              You need to connect your wallet to access the tokenized credit platform.
            </p>
            <Button>Connect Wallet</Button>
          </div>
        </Card>
      )}
      
      <LoanApplicationModal 
        isOpen={isLoanModalOpen} 
        onClose={() => setIsLoanModalOpen(false)} 
      />
    </div>
  );
}
