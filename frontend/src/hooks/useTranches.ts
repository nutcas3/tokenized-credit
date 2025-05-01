import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trancheAPI } from '../services/api';

export function useTranches() {
  const queryClient = useQueryClient();

  // Get tranche info
  const useTrancheInfo = (isSenior: boolean) => {
    return useQuery({
      queryKey: ['tranche', isSenior ? 'senior' : 'junior'],
      queryFn: () => trancheAPI.getTrancheInfo(isSenior),
    });
  };

  // Get total value locked
  const useTotalValueLocked = () => {
    return useQuery({
      queryKey: ['tvl'],
      queryFn: () => trancheAPI.getTotalValueLocked(),
    });
  };

  // Get LP token balance
  const useLPTokenBalance = (userAddress: string, isSenior: boolean) => {
    return useQuery({
      queryKey: ['lpBalance', userAddress, isSenior ? 'senior' : 'junior'],
      queryFn: () => trancheAPI.getLPTokenBalance(userAddress, isSenior),
      enabled: !!userAddress,
    });
  };

  // Calculate shares for a given amount
  const useCalculateShares = (amount: number, isSenior: boolean) => {
    return useQuery({
      queryKey: ['calculateShares', amount, isSenior ? 'senior' : 'junior'],
      queryFn: () => trancheAPI.calculateShares(amount, isSenior),
      enabled: amount > 0,
    });
  };

  // Deposit to tranche mutation
  const useDepositToTranche = () => {
    return useMutation({
      mutationFn: ({
        amount,
        isSenior,
        userAddress,
      }: {
        amount: number;
        isSenior: boolean;
        userAddress: string;
      }) => trancheAPI.depositToTranche(amount, isSenior, userAddress),
      onSuccess: (_, { isSenior, userAddress }) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['tranche', isSenior ? 'senior' : 'junior'] });
        queryClient.invalidateQueries({ queryKey: ['lpBalance', userAddress, isSenior ? 'senior' : 'junior'] });
        queryClient.invalidateQueries({ queryKey: ['tvl'] });
      },
    });
  };

  // Withdraw from tranche mutation
  const useWithdrawFromTranche = () => {
    return useMutation({
      mutationFn: ({
        shares,
        isSenior,
        userAddress,
      }: {
        shares: number;
        isSenior: boolean;
        userAddress: string;
      }) => trancheAPI.withdrawFromTranche(shares, isSenior, userAddress),
      onSuccess: (_, { isSenior, userAddress }) => {
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['tranche', isSenior ? 'senior' : 'junior'] });
        queryClient.invalidateQueries({ queryKey: ['lpBalance', userAddress, isSenior ? 'senior' : 'junior'] });
        queryClient.invalidateQueries({ queryKey: ['tvl'] });
      },
    });
  };

  // Approve USDC for deposit mutation
  const useApproveUSDCForDeposit = () => {
    return useMutation({
      mutationFn: ({
        amount,
        userAddress,
      }: {
        amount: number;
        userAddress: string;
      }) => trancheAPI.approveUSDCForDeposit(amount, userAddress),
      onSuccess: () => {
        // Invalidate USDC allowance query
        queryClient.invalidateQueries({ queryKey: ['usdcAllowance'] });
      },
    });
  };

  // Get USDC allowance for tranche deposit
  const useUSDCAllowance = (userAddress: string) => {
    return useQuery({
      queryKey: ['usdcAllowance', userAddress],
      queryFn: () => trancheAPI.getUSDCAllowance(userAddress),
      enabled: !!userAddress,
    });
  };

  return {
    useTrancheInfo,
    useTotalValueLocked,
    useLPTokenBalance,
    useCalculateShares,
    useDepositToTranche,
    useWithdrawFromTranche,
    useApproveUSDCForDeposit,
    useUSDCAllowance,
  };
}
