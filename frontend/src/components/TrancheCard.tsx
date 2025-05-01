import { TrancheInfo } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { formatCurrency, formatPercentage } from '@/utils/format';

interface TrancheCardProps {
  trancheInfo: TrancheInfo;
  isSenior: boolean;
  lpBalance?: number;
  onDeposit?: () => void;
  onWithdraw?: () => void;
}

export function TrancheCard({ 
  trancheInfo, 
  isSenior, 
  lpBalance = 0,
  onDeposit,
  onWithdraw
}: TrancheCardProps) {
  return (
    <Card className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isSenior ? 'Senior Tranche' : 'Junior Tranche'}
          </h3>
          <div 
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{ 
              backgroundColor: isSenior ? 'rgba(16, 185, 129, 0.1)' : 'rgba(79, 70, 229, 0.1)',
              color: isSenior ? 'rgb(16, 185, 129)' : 'rgb(79, 70, 229)'
            }}
          >
            {isSenior ? 'Lower Risk' : 'Higher Risk'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Total Invested</p>
            <p className="text-base font-medium">{formatCurrency(trancheInfo.totalInvested)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">APY</p>
            <p className="text-base font-medium">{formatPercentage(trancheInfo.apy)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Shares</p>
            <p className="text-base font-medium">{trancheInfo.totalShares.toFixed(6)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Your Shares</p>
            <p className="text-base font-medium">{lpBalance.toFixed(6)}</p>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2">
          {onDeposit && (
            <Button 
              variant={isSenior ? "success" : "primary"} 
              onClick={onDeposit}
            >
              Deposit
            </Button>
          )}
          {onWithdraw && (
            <Button 
              variant="secondary" 
              onClick={onWithdraw}
              disabled={lpBalance <= 0}
            >
              Withdraw
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
