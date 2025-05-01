import { useState } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { useWallet } from '../context/WalletContext';
import { useTranches } from '../hooks/useTranches';
import { formatCurrency } from '../utils/format';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSenior: boolean;
  lpBalance: number;
}

export function WithdrawModal({ isOpen, onClose, isSenior, lpBalance }: WithdrawModalProps) {
  const [shares, setShares] = useState<string>('');
  const { address } = useWallet();
  const { useWithdrawFromTranche } = useTranches();
  
  const { mutate: withdraw, isPending: isWithdrawing } = useWithdrawFromTranche();
  
  const handleWithdraw = () => {
    if (!address || !shares) return;
    
    withdraw(
      { shares: Number(shares), isSenior, userAddress: address },
      {
        onSuccess: () => {
          onClose();
          setShares('');
        },
      }
    );
  };
  
  const handleClose = () => {
    onClose();
    setShares('');
  };
  
  const isSharesValid = Number(shares) > 0 && Number(shares) <= lpBalance;
  
  const handleMax = () => {
    setShares(lpBalance.toString());
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Withdraw from ${isSenior ? 'Senior' : 'Junior'} Tranche`}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} className="mr-2">
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleWithdraw}
            disabled={!isSharesValid}
            isLoading={isWithdrawing}
          >
            Withdraw
          </Button>
        </>
      }
    >
      <div className="mb-4">
        <div className="flex items-end">
          <div className="flex-grow">
            <Input
              label="LP Tokens to Withdraw"
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="0.00"
              min="0"
              max={lpBalance.toString()}
              step="0.000001"
              helperText={`Available LP tokens: ${lpBalance.toFixed(6)}`}
            />
          </div>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleMax}
            className="ml-2 mb-1"
          >
            Max
          </Button>
        </div>
      </div>
      
      {Number(shares) > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-500">
            Tranche Type: <span className="font-medium">{isSenior ? 'Senior' : 'Junior'}</span>
          </p>
          <p className="text-sm text-gray-500">
            Withdrawing: <span className="font-medium">{Number(shares).toFixed(6)} LP Tokens</span>
          </p>
        </div>
      )}
    </Modal>
  );
}
