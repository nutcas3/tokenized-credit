export interface LoanApplication {
  borrowerAddress: string;
  invoiceData: {
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    description: string;
    counterparty: string;
    additionalInfo?: any;
  };
  contactInfo?: {
    email: string;
    phone?: string;
  };
}

export interface LoanApproval {
  borrowerAddress: string;
  valuation: number;
  principal: number;
  interest: number; // In percentage, e.g., 12 for 12%
  duration: number; // In seconds
  metadataURI: string;
  underwriterNotes?: string;
}

export interface LoanDetails {
  id: number;
  borrower: string;
  principal: number;
  valuation: number;
  interest: number;
  dueDate: number;
  repaid: boolean;
  metadataURI: string;
}

export interface TrancheInfo {
  totalInvested: number;
  totalShares: number;
  yieldRate: number;
  apy: number; // Calculated APY based on yield rate
}

export interface TransactionResponse {
  txHash: string;
  blockNumber?: number;
  status?: string;
}
