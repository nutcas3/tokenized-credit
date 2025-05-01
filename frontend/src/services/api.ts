import { LoanApplication, LoanApproval, LoanDetails, TrancheInfo, TransactionResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'An error occurred');
  }

  return response.json();
}

export const loanAPI = {
  applyForLoan: (application: LoanApplication): Promise<{ applicationId: string; metadataURI: string }> => {
    return fetchAPI('/api/loan/apply', {
      method: 'POST',
      body: JSON.stringify(application),
    });
  },

  approveLoan: (approval: LoanApproval): Promise<TransactionResponse> => {
    return fetchAPI('/api/loan/approve', {
      method: 'POST',
      body: JSON.stringify(approval),
    });
  },

  repayLoan: (loanId: number): Promise<TransactionResponse> => {
    return fetchAPI(`/api/loan/repay/${loanId}`, {
      method: 'POST',
    });
  },

  getLoanDetails: (loanId: number): Promise<LoanDetails> => {
    return fetchAPI(`/api/loan/${loanId}`);
  },

  getPoolBalance: (): Promise<{ balance: number }> => {
    return fetchAPI('/api/loan/pool-balance');
  },

  getLoanCount: (): Promise<{ count: number }> => {
    return fetchAPI('/api/loan/count');
  },

  getRepaymentAmount: (loanId: number): Promise<{ amount: number }> => {
    return fetchAPI(`/api/loan/repayment-amount/${loanId}`);
  },

  approveUSDCForRepayment: (loanId: number): Promise<TransactionResponse> => {
    return fetchAPI(`/api/loan/approve-repayment/${loanId}`, {
      method: 'POST',
    });
  },

  isUnderwriter: (address: string): Promise<{ isUnderwriter: boolean }> => {
    return fetchAPI(`/api/access/is-underwriter/${address}`);
  },

  isAdmin: (address: string): Promise<{ isAdmin: boolean }> => {
    return fetchAPI(`/api/access/is-admin/${address}`);
  },

  getUSDCBalance: (address: string): Promise<{ balance: number }> => {
    return fetchAPI(`/api/usdc/balance/${address}`);
  },

  getUSDCAllowance: (address: string): Promise<{ allowance: number }> => {
    return fetchAPI(`/api/usdc/allowance/${address}`);
  },
};

export const trancheAPI = {
  depositToTranche: (
    amount: number,
    isSenior: boolean,
    userAddress: string
  ): Promise<TransactionResponse> => {
    return fetchAPI('/api/tranche/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, isSenior, userAddress }),
    });
  },

  withdrawFromTranche: (
    shares: number,
    isSenior: boolean,
    userAddress: string
  ): Promise<TransactionResponse> => {
    return fetchAPI('/api/tranche/withdraw', {
      method: 'POST',
      body: JSON.stringify({ shares, isSenior, userAddress }),
    });
  },

  getTrancheInfo: (isSenior: boolean): Promise<TrancheInfo> => {
    const type = isSenior ? 'senior' : 'junior';
    return fetchAPI(`/api/tranche/${type}`);
  },

  getTotalValueLocked: (): Promise<{ tvl: number }> => {
    return fetchAPI('/api/tranche/tvl');
  },

  getLPTokenBalance: (
    userAddress: string,
    isSenior: boolean
  ): Promise<{ balance: number }> => {
    const type = isSenior ? 'senior' : 'junior';
    return fetchAPI(`/api/tranche/balance/${type}/${userAddress}`);
  },

  calculateShares: (
    amount: number,
    isSenior: boolean
  ): Promise<{ shares: number }> => {
    const type = isSenior ? 'senior' : 'junior';
    return fetchAPI(`/api/tranche/calculate-shares/${type}/${amount}`);
  },

  approveUSDCForDeposit: (
    amount: number,
    userAddress: string
  ): Promise<TransactionResponse> => {
    return fetchAPI('/api/tranche/approve-deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, userAddress }),
    });
  },

  getUSDCAllowance: (address: string): Promise<{ allowance: number }> => {
    return fetchAPI(`/api/tranche/usdc-allowance/${address}`);
  },
};

export const ipfsAPI = {
  getFromIPFS: (cid: string): Promise<any> => {
    return fetchAPI(`/api/ipfs/${cid}`);
  },
};
