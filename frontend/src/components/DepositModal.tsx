import { useState } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { useWallet } from '../context/WalletContext';
import { useTranches } from '../hooks/useTranches';
import { formatCurrency } from '../utils/format';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSenior: boolean;
}

export function DepositModal({ isOpen, onClose, isSenior }: DepositModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [step, setStep] = useState<'input' | 'approve' | 'deposit'>('input');
  
  const { address, usdcInfo } = useWallet();
  const { useCalculateShares, useApproveUSDCForDeposit, useDepositToTranche } = useTranches();
  
  const { data: sharesData } = useCalculateShares(Number(amount) || 0, isSenior);
  const estimatedShares = sharesData?.shares || 0;
  
  const { mutate: approveUSDC, isPending: isApproving } = useApproveUSDCForDeposit();
  const { mutate: deposit, isPending: isDepositing } = useDepositToTranche();
  
  const handleApprove = () => {
    if (!address || !amount) return;
    
    approveUSDC(
      { amount: Number(amount), userAddress: address },
      {
        onSuccess: () => {
          setStep('deposit');
        },
      }
    );
  };
  
  const handleDeposit = () => {
    if (!address || !amount) return;
    
    deposit(
      { amount: Number(amount), isSenior, userAddress: address },
      {
        onSuccess: () => {
          onClose();
          setAmount('');
          setStep('input');
        },
      }
    );
  };
  
  const handleClose = () => {
    onClose();
    setAmount('');
    setStep('input');
  };
  
  const isAmountValid = Number(amount) > 0 && Number(amount) <= usdcInfo.balance;
  const needsApproval = Number(amount) > usdcInfo.allowance;
  
  const renderStepContent = () => {
    switch (step) {
      case 'input':
        return (
          <>
            <div className="mb-4">
              <Input
                label="Amount to Deposit (USDC)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                helperText={`Available balance: ${formatCurrency(usdcInfo.balance)}`}
              />
            </div>
            
            {Number(amount) > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-500">
                  Estimated LP Tokens: <span className="font-medium">{estimatedShares.toFixed(6)}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Tranche Type: <span className="font-medium">{isSenior ? 'Senior' : 'Junior'}</span>
                </p>
              </div>
            )}
          </>
        );
        
      case 'approve':
        return (
          <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700 mb-2">
              You need to approve the smart contract to spend your USDC before depositing.
            </p>
            <p className="text-sm font-medium">
              Amount to approve: {formatCurrency(Number(amount))}
            </p>
          </div>
        );
        
      case 'deposit':
        return (
          <div className="mb-4 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700 mb-2">
              Ready to deposit to the {isSenior ? 'Senior' : 'Junior'} tranche.
            </p>
            <p className="text-sm font-medium">
              Amount: {formatCurrency(Number(amount))}
            </p>
            <p className="text-sm font-medium">
              Estimated LP Tokens: {estimatedShares.toFixed(6)}
            </p>
          </div>
        );
    }
  };
  
  const renderFooter = () => {
    switch (step) {
      case 'input':
        return (
          <>
            <Button variant="secondary" onClick={handleClose} className="mr-2">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              disabled={!isAmountValid}
              onClick={() => setStep(needsApproval ? 'approve' : 'deposit')}
            >
              Continue
            </Button>
          </>
        );
        
      case 'approve':
        return (
          <>
            <Button variant="secondary" onClick={() => setStep('input')} className="mr-2">
              Back
            </Button>
            <Button 
              variant="primary" 
              onClick={handleApprove}
              isLoading={isApproving}
            >
              Approve USDC
            </Button>
          </>
        );
        
      case 'deposit':
        return (
          <>
            <Button variant="secondary" onClick={() => setStep('input')} className="mr-2">
              Back
            </Button>
            <Button 
              variant="primary" 
              onClick={handleDeposit}
              isLoading={isDepositing}
            >
              Deposit
            </Button>
          </>
        );
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Deposit to ${isSenior ? 'Senior' : 'Junior'} Tranche`}
      footer={renderFooter()}
    >
      {renderStepContent()}
    </Modal>
  );
}
