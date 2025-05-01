import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { LoanCard } from '../components/LoanCard';
import { useWallet } from '../context/WalletContext';
import { useLoans } from '../hooks/useLoans';
import { LoanDetails } from '../types';

export function Loans() {
  const { address, isConnected } = useWallet();
  const [activeLoanId, setActiveLoanId] = useState<number | null>(null);
  
  // In a real application, you would fetch all loans for the user
  // For now, we'll simulate with a loan count and fetch each loan
  const { useLoanCount, useLoanDetails, useRepayLoan, useApproveUSDCForRepayment } = useLoans();
  
  const { data: loanCountData, isLoading: isLoadingLoanCount } = useLoanCount();
  const loanCount = loanCountData?.count || 0;
  
  // Create an array of loan IDs based on the count
  const loanIds = Array.from({ length: loanCount }, (_, i) => i + 1);
  
  // Fetch details for each loan
  const loanQueries = loanIds.map(id => {
    return useLoanDetails(id);
  });
  
  const isLoadingLoans = isLoadingLoanCount || loanQueries.some(query => query.isLoading);
  
  // Collect all loan details
  const loans: LoanDetails[] = loanQueries
    .filter(query => query.data)
    .map(query => query.data as LoanDetails);
  
  // Filter loans for the current user if connected
  const userLoans = isConnected 
    ? loans.filter(loan => loan.borrower.toLowerCase() === address?.toLowerCase())
    : [];
  
  // Mutations for loan repayment
  const { mutate: approveUSDC, isPending: isApproving } = useApproveUSDCForRepayment();
  const { mutate: repayLoan, isPending: isRepaying } = useRepayLoan();
  
  const handleRepayLoan = (loanId: number) => {
    setActiveLoanId(loanId);
    
    // First approve USDC for repayment
    approveUSDC(loanId, {
      onSuccess: () => {
        // Then repay the loan
        repayLoan(loanId, {
          onSuccess: () => {
            setActiveLoanId(null);
          },
          onError: () => {
            setActiveLoanId(null);
          }
        });
      },
      onError: () => {
        setActiveLoanId(null);
      }
    });
  };
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Loans</h1>
        <p className="text-gray-500">View and manage your loans</p>
      </div>
      
      {isConnected ? (
        <>
          <div className="mb-8">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Your Loans</h2>
            
            {isLoadingLoans ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="h-64">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : userLoans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userLoans.map(loan => (
                  <LoanCard 
                    key={loan.id} 
                    loan={loan} 
                    onRepay={!loan.repaid ? handleRepayLoan : undefined}
                    isRepaying={activeLoanId === loan.id && (isApproving || isRepaying)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No loans found</h3>
                  <p className="text-gray-500 mb-4">
                    You don't have any active or past loans.
                  </p>
                  <Button onClick={() => window.location.href = '/'}>
                    Apply for a Loan
                  </Button>
                </div>
              </Card>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-medium text-gray-900 mb-4">All Active Loans</h2>
            
            {isLoadingLoans ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="h-64">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : loans.filter(loan => !loan.repaid).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loans
                  .filter(loan => !loan.repaid)
                  .map(loan => (
                    <LoanCard 
                      key={loan.id} 
                      loan={loan} 
                      onRepay={
                        !loan.repaid && 
                        loan.borrower.toLowerCase() === address?.toLowerCase() 
                          ? handleRepayLoan 
                          : undefined
                      }
                      isRepaying={activeLoanId === loan.id && (isApproving || isRepaying)}
                    />
                  ))}
              </div>
            ) : (
              <Card>
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active loans</h3>
                  <p className="text-gray-500">
                    There are currently no active loans in the system.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </>
      ) : (
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-medium text-gray-900 mb-4">Connect your wallet to view loans</h2>
            <p className="text-gray-500 mb-6">
              You need to connect your wallet to access loan information.
            </p>
            <Button>Connect Wallet</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
