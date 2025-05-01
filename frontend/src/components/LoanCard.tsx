import { useIPFS } from '../hooks/useIPFS';
import { LoanDetails } from '../types';
import { Card } from './Card';
import { Button } from './Button';
import { formatAddress, formatCurrency, formatDate, formatPercentage } from '../utils/format';

interface LoanCardProps {
  loan: LoanDetails;
  onRepay?: (loanId: number) => void;
  isRepaying?: boolean;
}

export function LoanCard({ loan, onRepay, isRepaying = false }: LoanCardProps) {
  const { useIPFSContent } = useIPFS();
  const { data: metadata, isLoading: isLoadingMetadata } = useIPFSContent(loan.metadataURI);

  return (
    <Card className="h-full">
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Loan #{loan.id}</h3>
            <p className="text-sm text-gray-500">Borrower: {formatAddress(loan.borrower)}</p>
          </div>
          <div className="px-2 py-1 rounded-full text-xs font-medium" 
               style={{ 
                 backgroundColor: loan.repaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                 color: loan.repaid ? 'rgb(16, 185, 129)' : 'rgb(245, 158, 11)'
               }}>
            {loan.repaid ? 'Repaid' : 'Active'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Principal</p>
            <p className="text-base font-medium">{formatCurrency(loan.principal)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Valuation</p>
            <p className="text-base font-medium">{formatCurrency(loan.valuation)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Interest</p>
            <p className="text-base font-medium">{formatPercentage(loan.interest / 100)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="text-base font-medium">{formatDate(loan.dueDate)}</p>
          </div>
        </div>

        {isLoadingMetadata ? (
          <div className="text-sm text-gray-500">Loading invoice details...</div>
        ) : metadata ? (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Invoice Details</h4>
            <div className="text-sm text-gray-500">
              <p>Invoice #: {metadata.invoiceNumber}</p>
              <p>Amount: {formatCurrency(metadata.amount)}</p>
              <p>Counterparty: {metadata.counterparty}</p>
              <p>Description: {metadata.description}</p>
            </div>
          </div>
        ) : null}

        {!loan.repaid && onRepay && (
          <div className="mt-auto pt-4">
            <Button 
              variant="primary" 
              fullWidth 
              onClick={() => onRepay(loan.id)}
              isLoading={isRepaying}
            >
              Repay Loan
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
