import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loanAPI } from '../services/api';
import { LoanApplication, LoanApproval } from '../types';

export function useLoans() {
  const queryClient = useQueryClient();

  // Get loan details
  const useLoanDetails = (loanId: number) => {
    return useQuery({
      queryKey: ['loan', loanId],
      queryFn: () => loanAPI.getLoanDetails(loanId),
      enabled: !!loanId,
    });
  };

  // Get pool balance
  const usePoolBalance = () => {
    return useQuery({
      queryKey: ['poolBalance'],
      queryFn: () => loanAPI.getPoolBalance(),
    });
  };

  // Get loan count
  const useLoanCount = () => {
    return useQuery({
      queryKey: ['loanCount'],
      queryFn: () => loanAPI.getLoanCount(),
    });
  };

  // Get repayment amount
  const useRepaymentAmount = (loanId: number) => {
    return useQuery({
      queryKey: ['repaymentAmount', loanId],
      queryFn: () => loanAPI.getRepaymentAmount(loanId),
      enabled: !!loanId,
    });
  };

  // Apply for loan mutation
  const useApplyForLoan = () => {
    return useMutation({
      mutationFn: (application: LoanApplication) => loanAPI.applyForLoan(application),
      onSuccess: () => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['loanCount'] });
      },
    });
  };

  // Approve loan mutation (underwriter only)
  const useApproveLoan = () => {
    return useMutation({
      mutationFn: (approval: LoanApproval) => loanAPI.approveLoan(approval),
      onSuccess: () => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['loanCount'] });
        queryClient.invalidateQueries({ queryKey: ['poolBalance'] });
      },
    });
  };

  // Repay loan mutation
  const useRepayLoan = () => {
    return useMutation({
      mutationFn: (loanId: number) => loanAPI.repayLoan(loanId),
      onSuccess: (_, loanId) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['loan', loanId] });
        queryClient.invalidateQueries({ queryKey: ['poolBalance'] });
      },
    });
  };

  // Approve USDC for repayment mutation
  const useApproveUSDCForRepayment = () => {
    return useMutation({
      mutationFn: (loanId: number) => loanAPI.approveUSDCForRepayment(loanId),
      onSuccess: (_, loanId) => {
        // Invalidate USDC allowance query
        queryClient.invalidateQueries({ queryKey: ['usdcAllowance'] });
      },
    });
  };

  return {
    useLoanDetails,
    usePoolBalance,
    useLoanCount,
    useRepaymentAmount,
    useApplyForLoan,
    useApproveLoan,
    useRepayLoan,
    useApproveUSDCForRepayment,
  };
}
