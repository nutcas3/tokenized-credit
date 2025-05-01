import { useState } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { useLoans } from '../hooks/useLoans';
import { LoanApproval } from '../types';

interface LoanApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  borrowerAddress: string;
  metadataURI: string;
  invoiceAmount: number;
}

export function LoanApprovalModal({ 
  isOpen, 
  onClose, 
  applicationId,
  borrowerAddress,
  metadataURI,
  invoiceAmount
}: LoanApprovalModalProps) {
  const { useApproveLoan } = useLoans();
  
  const [formData, setFormData] = useState({
    valuation: invoiceAmount.toString(),
    principal: (invoiceAmount * 0.8).toString(), // Default to 80% of invoice amount
    interest: '12', // Default to 12%
    duration: '30', // Default to 30 days
    notes: '',
  });
  
  const { mutate: approveLoan, isPending, isSuccess } = useApproveLoan();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = () => {
    const loanApproval: LoanApproval = {
      borrowerAddress,
      valuation: Number(formData.valuation),
      principal: Number(formData.principal),
      interest: Number(formData.interest),
      duration: Number(formData.duration) * 86400, // Convert days to seconds
      metadataURI,
      underwriterNotes: formData.notes || undefined,
    };
    
    approveLoan(loanApproval, {
      onSuccess: () => {
        setTimeout(() => {
          resetForm();
          onClose();
        }, 2000);
      },
    });
  };
  
  const resetForm = () => {
    setFormData({
      valuation: invoiceAmount.toString(),
      principal: (invoiceAmount * 0.8).toString(),
      interest: '12',
      duration: '30',
      notes: '',
    });
  };
  
  const isFormValid = 
    Number(formData.valuation) > 0 &&
    Number(formData.principal) > 0 &&
    Number(formData.principal) <= Number(formData.valuation) &&
    Number(formData.interest) > 0 &&
    Number(formData.duration) > 0;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Approve Loan Application #${applicationId}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="mr-2">
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={!isFormValid || isPending}
            isLoading={isPending}
          >
            {isSuccess ? 'Loan Approved!' : 'Approve Loan'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-md mb-4">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Borrower:</span> {borrowerAddress}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">Invoice Amount:</span> ${invoiceAmount.toFixed(2)}
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Valuation (USDC)"
            name="valuation"
            type="number"
            value={formData.valuation}
            onChange={handleChange}
            placeholder="1000.00"
            min="0"
            step="0.01"
            required
          />
          
          <Input
            label="Principal (USDC)"
            name="principal"
            type="number"
            value={formData.principal}
            onChange={handleChange}
            placeholder="800.00"
            min="0"
            step="0.01"
            helperText="Loan amount to be issued"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Interest Rate (%)"
            name="interest"
            type="number"
            value={formData.interest}
            onChange={handleChange}
            placeholder="12"
            min="0"
            max="100"
            required
          />
          
          <Input
            label="Duration (Days)"
            name="duration"
            type="number"
            value={formData.duration}
            onChange={handleChange}
            placeholder="30"
            min="1"
            required
          />
        </div>
        
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Underwriter Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Add any notes about this loan approval"
          />
        </div>
      </div>
    </Modal>
  );
}
