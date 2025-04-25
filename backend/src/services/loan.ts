import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { LoanDetails, TransactionResponse } from '../types';

// Load environment variables
dotenv.config();

// ABI for CreditPool contract (simplified for this example)
const CREDIT_POOL_ABI = [
  "function issueLoan(address borrower, uint256 valuation, uint256 principal, uint256 interest, uint256 duration, string calldata metadataURI) external",
  "function repayLoan(uint256 id) external",
  "function getLoan(uint256 id) external view returns (tuple(address borrower, uint256 principal, uint256 valuation, uint256 interest, uint256 dueDate, bool repaid, string metadataURI))",
  "function getPoolBalance() external view returns (uint256)"
];

// Get provider and signer
const getProviderAndSigner = () => {
  const rpcUrl = process.env.RPC_URL;
  if (!rpcUrl) {
    throw new Error('RPC URL not found in environment variables');
  }
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('Private key not found in environment variables');
  }
  
  const signer = new ethers.Wallet(privateKey, provider);
  return { provider, signer };
};

// Get contract instance
const getCreditPoolContract = (signer: ethers.Wallet) => {
  const contractAddress = process.env.CREDIT_POOL_ADDRESS;
  if (!contractAddress) {
    throw new Error('Credit pool contract address not found in environment variables');
  }
  
  return new ethers.Contract(contractAddress, CREDIT_POOL_ABI, signer);
};

// Issue a new loan
export const issueLoan = async (
  borrowerAddress: string,
  valuation: number,
  principal: number,
  interest: number,
  duration: number,
  metadataURI: string
): Promise<string> => {
  try {
    const { signer } = getProviderAndSigner();
    const contract = getCreditPoolContract(signer);
    
    // Convert values to appropriate format for blockchain
    const valuationWei = ethers.parseUnits(valuation.toString(), 6); // Assuming USDC with 6 decimals
    const principalWei = ethers.parseUnits(principal.toString(), 6);
    
    // Issue loan
    const tx = await contract.issueLoan(
      borrowerAddress,
      valuationWei,
      principalWei,
      interest,
      duration,
      metadataURI
    );
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return receipt.hash;
  } catch (error) {
    console.error('Error issuing loan:', error);
    throw new Error('Failed to issue loan');
  }
};

// Repay a loan
export const repayLoan = async (loanId: number): Promise<string> => {
  try {
    const { signer } = getProviderAndSigner();
    const contract = getCreditPoolContract(signer);
    
    // Repay loan
    const tx = await contract.repayLoan(loanId);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return receipt.hash;
  } catch (error) {
    console.error('Error repaying loan:', error);
    throw new Error('Failed to repay loan');
  }
};

// Get loan details
export const getLoanDetails = async (loanId: number): Promise<LoanDetails> => {
  try {
    const { provider } = getProviderAndSigner();
    const contractAddress = process.env.CREDIT_POOL_ADDRESS;
    if (!contractAddress) {
      throw new Error('Credit pool contract address not found in environment variables');
    }
    
    const contract = new ethers.Contract(contractAddress, CREDIT_POOL_ABI, provider);
    
    // Get loan details
    const loan = await contract.getLoan(loanId);
    
    // Format loan details
    return {
      id: loanId,
      borrower: loan[0],
      principal: Number(ethers.formatUnits(loan[1], 6)), // Convert from Wei to USDC
      valuation: Number(ethers.formatUnits(loan[2], 6)),
      interest: Number(loan[3]),
      dueDate: Number(loan[4]),
      repaid: loan[5],
      metadataURI: loan[6]
    };
  } catch (error) {
    console.error('Error getting loan details:', error);
    throw new Error('Failed to get loan details');
  }
};

// Get pool balance
export const getPoolBalance = async (): Promise<number> => {
  try {
    const { provider } = getProviderAndSigner();
    const contractAddress = process.env.CREDIT_POOL_ADDRESS;
    if (!contractAddress) {
      throw new Error('Credit pool contract address not found in environment variables');
    }
    
    const contract = new ethers.Contract(contractAddress, CREDIT_POOL_ABI, provider);
    
    // Get pool balance
    const balance = await contract.getPoolBalance();
    
    // Convert from Wei to USDC
    return Number(ethers.formatUnits(balance, 6));
  } catch (error) {
    console.error('Error getting pool balance:', error);
    throw new Error('Failed to get pool balance');
  }
};
