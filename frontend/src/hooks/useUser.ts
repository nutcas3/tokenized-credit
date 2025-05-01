import { useQuery } from '@tanstack/react-query';
import { loanAPI } from '../services/api';
import { UserRole, USDCInfo } from '../types';

export function useUser() {
  // Check if user is underwriter
  const useUserRoles = (address: string | undefined) => {
    const isUnderwriterQuery = useQuery({
      queryKey: ['isUnderwriter', address],
      queryFn: () => loanAPI.isUnderwriter(address!),
      enabled: !!address,
    });

    const isAdminQuery = useQuery({
      queryKey: ['isAdmin', address],
      queryFn: () => loanAPI.isAdmin(address!),
      enabled: !!address,
    });

    const isLoading = isUnderwriterQuery.isLoading || isAdminQuery.isLoading;
    const error = isUnderwriterQuery.error || isAdminQuery.error;

    const roles: UserRole = {
      isUnderwriter: isUnderwriterQuery.data?.isUnderwriter || false,
      isAdmin: isAdminQuery.data?.isAdmin || false,
    };

    return {
      roles,
      isLoading,
      error,
    };
  };

  // Get USDC balance and allowance
  const useUSDCInfo = (address: string | undefined) => {
    const balanceQuery = useQuery({
      queryKey: ['usdcBalance', address],
      queryFn: () => loanAPI.getUSDCBalance(address!),
      enabled: !!address,
    });

    const allowanceQuery = useQuery({
      queryKey: ['usdcAllowance', address],
      queryFn: () => loanAPI.getUSDCAllowance(address!),
      enabled: !!address,
    });

    const isLoading = balanceQuery.isLoading || allowanceQuery.isLoading;
    const error = balanceQuery.error || allowanceQuery.error;

    const usdcInfo: USDCInfo = {
      balance: balanceQuery.data?.balance || 0,
      allowance: allowanceQuery.data?.allowance || 0,
    };

    return {
      usdcInfo,
      isLoading,
      error,
    };
  };

  return {
    useUserRoles,
    useUSDCInfo,
  };
}
