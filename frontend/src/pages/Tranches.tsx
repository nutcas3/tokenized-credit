import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { TrancheCard } from '../components/TrancheCard';
import { DepositModal } from '../components/DepositModal';
import { WithdrawModal } from '../components/WithdrawModal';
import { useWallet } from '../context/WalletContext';
import { useTranches } from '../hooks/useTranches';
import { formatCurrency } from '../utils/format';

export function Tranches() {
  const { address, isConnected } = useWallet();
  const [activeModal, setActiveModal] = useState<{
    type: 'deposit' | 'withdraw';
    isSenior: boolean;
  } | null>(null);
  
  const { 
    useTrancheInfo, 
    useTotalValueLocked, 
    useLPTokenBalance 
  } = useTranches();
  
  // Fetch tranche info
  const { data: seniorTrancheData, isLoading: isLoadingSenior } = useTrancheInfo(true);
  const { data: juniorTrancheData, isLoading: isLoadingJunior } = useTrancheInfo(false);
  const { data: tvlData, isLoading: isLoadingTVL } = useTotalValueLocked();
  
  // Fetch LP token balances if connected
  const { data: seniorLPBalance, isLoading: isLoadingSeniorLP } = useLPTokenBalance(address || '', true);
  const { data: juniorLPBalance, isLoading: isLoadingJuniorLP } = useLPTokenBalance(address || '', false);
  
  const isLoading = 
    isLoadingSenior || 
    isLoadingJunior || 
    isLoadingTVL || 
    (isConnected && (isLoadingSeniorLP || isLoadingJuniorLP));
  
  const seniorTranche = seniorTrancheData || { 
    totalInvested: 0, 
    totalShares: 0, 
    yieldRate: 0, 
    apy: 0 
  };
  
  const juniorTranche = juniorTrancheData || { 
    totalInvested: 0, 
    totalShares: 0, 
    yieldRate: 0, 
    apy: 0 
  };
  
  const tvl = tvlData?.tvl || 0;
  const seniorLPTokens = seniorLPBalance?.balance || 0;
  const juniorLPTokens = juniorLPBalance?.balance || 0;
  
  const handleDeposit = (isSenior: boolean) => {
    setActiveModal({ type: 'deposit', isSenior });
  };
  
  const handleWithdraw = (isSenior: boolean) => {
    setActiveModal({ type: 'withdraw', isSenior });
  };
  
  const closeModal = () => {
    setActiveModal(null);
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invest in Tranches</h1>
        <p className="text-gray-500">Earn yields by investing in senior or junior tranches</p>
      </div>
      
      <Card className="mb-8">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-2">Total Value Locked</h2>
          {isLoading ? (
            <div className="animate-pulse h-8 bg-gray-200 rounded mt-2 w-1/3 mx-auto"></div>
          ) : (
            <p className="text-3xl font-bold">{formatCurrency(tvl)}</p>
          )}
        </div>
      </Card>
      
      {isConnected ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Senior Tranche */}
          {isLoading ? (
            <Card className="h-96">
              <div className="animate-pulse space-y-4 h-full">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="mt-auto h-10 bg-gray-200 rounded"></div>
              </div>
            </Card>
          ) : (
            <TrancheCard
              trancheInfo={seniorTranche}
              isSenior={true}
              lpBalance={seniorLPTokens}
              onDeposit={() => handleDeposit(true)}
              onWithdraw={() => handleWithdraw(true)}
            />
          )}
          
          {/* Junior Tranche */}
          {isLoading ? (
            <Card className="h-96">
              <div className="animate-pulse space-y-4 h-full">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="mt-auto h-10 bg-gray-200 rounded"></div>
              </div>
            </Card>
          ) : (
            <TrancheCard
              trancheInfo={juniorTranche}
              isSenior={false}
              lpBalance={juniorLPTokens}
              onDeposit={() => handleDeposit(false)}
              onWithdraw={() => handleWithdraw(false)}
            />
          )}
        </div>
      ) : (
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Connect your wallet to invest</h2>
            <p className="text-gray-500 mb-6">
              You need to connect your wallet to deposit or withdraw from tranches.
            </p>
            <Button>Connect Wallet</Button>
          </div>
        </Card>
      )}
      
      {/* Tranche Information */}
      <div className="mt-12">
        <h2 className="text-xl font-medium text-gray-900 mb-4">How Tranches Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Senior Tranche</h3>
            <div className="prose">
              <p>The Senior Tranche offers lower risk and more stable returns:</p>
              <ul>
                <li>First to be repaid from borrower payments</li>
                <li>Lower but more predictable yield</li>
                <li>Suitable for risk-averse investors</li>
                <li>Protected by the Junior Tranche</li>
              </ul>
            </div>
          </Card>
          
          <Card>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Junior Tranche</h3>
            <div className="prose">
              <p>The Junior Tranche offers higher potential returns with higher risk:</p>
              <ul>
                <li>Paid after the Senior Tranche</li>
                <li>Higher potential yield</li>
                <li>Absorbs first losses if borrowers default</li>
                <li>Suitable for investors seeking higher returns</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Modals */}
      {activeModal?.type === 'deposit' && (
        <DepositModal
          isOpen={true}
          onClose={closeModal}
          isSenior={activeModal.isSenior}
        />
      )}
      
      {activeModal?.type === 'withdraw' && (
        <WithdrawModal
          isOpen={true}
          onClose={closeModal}
          isSenior={activeModal.isSenior}
          lpBalance={activeModal.isSenior ? seniorLPTokens : juniorLPTokens}
        />
      )}
    </div>
  );
}
