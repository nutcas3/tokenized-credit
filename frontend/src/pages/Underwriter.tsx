import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useWallet } from '../context/WalletContext';
import { LoanApprovalModal } from '../components/LoanApprovalModal';
import { formatAddress, formatCurrency } from '../utils/format';

// Mock loan applications for demo purposes
// In a real app, these would come from the backend
const mockLoanApplications = [
  {
    id: 'APP-001',
    borrowerAddress: '0x1234567890123456789012345678901234567890',
    metadataURI: 'ipfs://QmXyZ123',
    invoiceData: {
      invoiceNumber: 'INV-001',
      amount: 5000,
      dueDate: '2025-06-01',
      description: 'Consulting services',
      counterparty: 'Acme Corp',
    },
    status: 'pending',
    submittedAt: '2025-04-28T10:30:00Z',
  },
  {
    id: 'APP-002',
    borrowerAddress: '0x2345678901234567890123456789012345678901',
    metadataURI: 'ipfs://QmAbC456',
    invoiceData: {
      invoiceNumber: 'INV-002',
      amount: 7500,
      dueDate: '2025-06-15',
      description: 'Software development',
      counterparty: 'TechCo Inc',
    },
    status: 'pending',
    submittedAt: '2025-04-29T14:45:00Z',
  },
  {
    id: 'APP-003',
    borrowerAddress: '0x3456789012345678901234567890123456789012',
    metadataURI: 'ipfs://QmDeF789',
    invoiceData: {
      invoiceNumber: 'INV-003',
      amount: 3200,
      dueDate: '2025-05-30',
      description: 'Marketing services',
      counterparty: 'MarketPro LLC',
    },
    status: 'pending',
    submittedAt: '2025-04-30T09:15:00Z',
  },
];

export function Underwriter() {
  const { isConnected, userRoles } = useWallet();
  const [selectedApplication, setSelectedApplication] = useState<any | null>(null);
  
  const handleApprove = (application: any) => {
    setSelectedApplication(application);
  };
  
  const closeModal = () => {
    setSelectedApplication(null);
  };
  
  // Check if user is an underwriter
  const isUnderwriter = userRoles.isUnderwriter;
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Underwriter Dashboard</h1>
        <p className="text-gray-500">Review and approve loan applications</p>
      </div>
      
      {isConnected ? (
        isUnderwriter ? (
          <>
            <h2 className="text-xl font-medium text-gray-900 mb-4">Pending Applications</h2>
            
            {mockLoanApplications.length > 0 ? (
              <div className="space-y-6">
                {mockLoanApplications.map((application) => (
                  <Card key={application.id}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Application #{application.id}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Borrower: {formatAddress(application.borrowerAddress)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Submitted: {new Date(application.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="mt-4 md:mt-0">
                        <div className="flex flex-col space-y-2">
                          <p className="text-sm font-medium">
                            Invoice: {application.invoiceData.invoiceNumber}
                          </p>
                          <p className="text-sm font-medium">
                            Amount: {formatCurrency(application.invoiceData.amount)}
                          </p>
                          <p className="text-sm font-medium">
                            Due: {new Date(application.invoiceData.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-6 md:mt-0">
                        <Button
                          variant="success"
                          onClick={() => handleApprove(application)}
                        >
                          Review & Approve
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending applications</h3>
                  <p className="text-gray-500">
                    There are currently no loan applications pending review.
                  </p>
                </div>
              </Card>
            )}
            
            <div className="mt-12">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Underwriting Guidelines</h2>
              <Card>
                <div className="prose">
                  <p>When reviewing loan applications, consider the following factors:</p>
                  <ul>
                    <li>Verify the invoice details and counterparty information</li>
                    <li>Assess the borrower's repayment history (if available)</li>
                    <li>Set appropriate loan-to-value ratio (typically 70-80% of invoice value)</li>
                    <li>Determine interest rate based on risk assessment</li>
                    <li>Set loan duration aligned with invoice due date</li>
                  </ul>
                </div>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <div className="text-center py-8">
              <h2 className="text-xl font-medium text-gray-900 mb-4">Access Restricted</h2>
              <p className="text-gray-500 mb-6">
                You need underwriter permissions to access this page.
              </p>
            </div>
          </Card>
        )
      ) : (
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Connect your wallet</h2>
            <p className="text-gray-500 mb-6">
              You need to connect your wallet to access the underwriter dashboard.
            </p>
            <Button>Connect Wallet</Button>
          </div>
        </Card>
      )}
      
      {selectedApplication && (
        <LoanApprovalModal
          isOpen={true}
          onClose={closeModal}
          applicationId={selectedApplication.id}
          borrowerAddress={selectedApplication.borrowerAddress}
          metadataURI={selectedApplication.metadataURI}
          invoiceAmount={selectedApplication.invoiceData.amount}
        />
      )}
    </div>
  );
}
