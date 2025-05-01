import { useState } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { useWallet } from '../context/WalletContext';
import { useLoans } from '../hooks/useLoans';
import { LoanApplication } from '../types';

interface LoanApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoanApplicationModal({ isOpen, onClose }: LoanApplicationModalProps) {
  const { address } = useWallet();
  const { useApplyForLoan } = useLoans();
  
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    amount: '',
    dueDate: '',
    description: '',
    counterparty: '',
    email: '',
    phone: '',
  });
  
  const { mutate: applyForLoan, isPending, isSuccess } = useApplyForLoan();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = () => {
    if (!address) return;
    
    const loanApplication: LoanApplication = {
      borrowerAddress: address,
      invoiceData: {
        invoiceNumber: formData.invoiceNumber,
        amount: Number(formData.amount),
        dueDate: formData.dueDate,
        description: formData.description,
        counterparty: formData.counterparty,
      },
      contactInfo: {
        email: formData.email,
        phone: formData.phone || undefined,
      },
    };
    
    applyForLoan(loanApplication, {
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
      invoiceNumber: '',
      amount: '',
      dueDate: '',
      description: '',
      counterparty: '',
      email: '',
      phone: '',
    });
  };
  
  const isFormValid = 
    formData.invoiceNumber.trim() !== '' &&
    Number(formData.amount) > 0 &&
    formData.dueDate.trim() !== '' &&
    formData.description.trim() !== '' &&
    formData.counterparty.trim() !== '' &&
    formData.email.trim() !== '';
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply for a Loan"
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
            {isSuccess ? 'Application Submitted!' : 'Submit Application'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Invoice Number"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={handleChange}
            placeholder="INV-12345"
            required
          />
          
          <Input
            label="Invoice Amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            placeholder="1000.00"
            min="0"
            step="0.01"
            required
          />
        </div>
        
        <Input
          label="Due Date"
          name="dueDate"
          type="date"
          value={formData.dueDate}
          onChange={handleChange}
          required
        />
        
        <Input
          label="Counterparty"
          name="counterparty"
          value={formData.counterparty}
          onChange={handleChange}
          placeholder="Company Name"
          required
        />
        
        <Input
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief description of the invoice"
          required
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            required
          />
          
          <Input
            label="Phone (Optional)"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>
    </Modal>
  );
}
