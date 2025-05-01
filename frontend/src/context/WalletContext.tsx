import { createContext, useContext, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { useUser } from '../hooks/useUser';
import { UserRole, USDCInfo } from '../types';

interface WalletContextType {
  address: string | undefined;
  isConnected: boolean;
  userRoles: UserRole;
  usdcInfo: USDCInfo;
  isLoading: boolean;
}

const WalletContext = createContext<WalletContextType>({
  address: undefined,
  isConnected: false,
  userRoles: { isAdmin: false, isUnderwriter: false },
  usdcInfo: { balance: 0, allowance: 0 },
  isLoading: false,
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useAccount();
  const { useUserRoles, useUSDCInfo } = useUser();

  const { roles, isLoading: rolesLoading } = useUserRoles(address);
  const { usdcInfo, isLoading: usdcLoading } = useUSDCInfo(address);

  const isLoading = rolesLoading || usdcLoading;

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        userRoles: roles,
        usdcInfo,
        isLoading,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
