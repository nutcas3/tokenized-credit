import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { LoanDetails, TransactionResponse } from '../types';

// Load environment variables
dotenv.config();

// ABI for CreditPool contract
const CREDIT_POOL_ABI = [
  "function issueLoan(address borrower, uint256 valuation, uint256 principal, uint256 interest, uint256 duration, string calldata metadataURI) external",
  "function repayLoan(uint256 id) external",
  "function getLoan(uint256 id) external view returns (tuple(address borrower, uint256 principal, uint256 valuation, uint256 interest, uint256 dueDate, bool repaid, string metadataURI))",
  "function getPoolBalance() external view returns (uint256)",
  "function calculateRepaymentAmount(uint256 id) public view returns (uint256)",
  "function loanCounter() public view returns (uint256)"
];

// ABI for USDC contract
const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address recipient, uint256 amount) external returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)"
];

// ABI for AccessController contract
const ACCESS_CONTROLLER_ABI = [
  "function isUnderwriter(address account) external view returns (bool)",
  "function isAdmin(address account) external view returns (bool)",
  "function getCreditPool() external view returns (address)"
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
const getCreditPoolContract = (signer: ethers.Wallet | ethers.Provider) => {
  const contractAddress = process.env.CREDIT_POOL_ADDRESS;
  if (!contractAddress) {
    throw new Error('Credit pool contract address not found in environment variables');
  }
  
  return new ethers.Contract(contractAddress, CREDIT_POOL_ABI, signer);
};

// Get USDC contract instance
const getUSDCContract = (signer: ethers.Wallet | ethers.Provider) => {
  const contractAddress = process.env.USDC_ADDRESS;
  if (!contractAddress) {
    throw new Error('USDC address not found in environment variables');
  }
  
  return new ethers.Contract(contractAddress, USDC_ABI, signer);
};

// Get AccessController contract instance
const getAccessControllerContract = (signer: ethers.Wallet | ethers.Provider) => {
  const contractAddress = process.env.ACCESS_CONTROLLER_ADDRESS;
  if (!contractAddress) {
    throw new Error('Access controller address not found in environment variables');
  }
  
  return new ethers.Contract(contractAddress, ACCESS_CONTROLLER_ABI, signer);
};

// Check if user is an underwriter
export const isUnderwriter = async (address: string): Promise<boolean> => {
  try {
    const { provider } = getProviderAndSigner();
    const contract = getAccessControllerContract(provider);
    
    return await contract.isUnderwriter(address);
  } catch (error) {
    console.error('Error checking underwriter status:', error);
    throw new Error('Failed to check underwriter status');
  }
};

// Check if user is an admin
export const isAdmin = async (address: string): Promise<boolean> => {
  try {
    const { provider } = getProviderAndSigner();
    const contract = getAccessControllerContract(provider);
    
    return await contract.isAdmin(address);
  } catch (error) {
    console.error('Error checking admin status:', error);
    throw new Error('Failed to check admin status');
  }
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
    
    // Check if the signer is an underwriter
    const accessController = getAccessControllerContract(signer);
    const isUnderwriter = await accessController.isUnderwriter(await signer.getAddress());
    if (!isUnderwriter) {
      throw new Error('Only underwriters can issue loans');
    }
    
    // Convert values to appropriate format for blockchain
    const valuationWei = ethers.parseUnits(valuation.toString(), 6); // USDC has 6 decimals
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
    throw new Error('Failed to issue loan: ' + (error as Error).message);
  }
};

// Approve USDC for loan repayment
export const approveUSDCForRepayment = async (loanId: number): Promise<string> => {
  try {
    const { signer } = getProviderAndSigner();
    const creditPoolContract = getCreditPoolContract(signer);
    const usdcContract = getUSDCContract(signer);
    
    // Get repayment amount
    const repaymentAmount = await creditPoolContract.calculateRepaymentAmount(loanId);
    
    // Get credit pool address
    const creditPoolAddress = process.env.CREDIT_POOL_ADDRESS;
    if (!creditPoolAddress) {
      throw new Error('Credit pool address not found in environment variables');
    }
    
    // Approve credit pool to spend USDC
    const tx = await usdcContract.approve(creditPoolAddress, repaymentAmount);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return receipt.hash;
  } catch (error) {
    console.error('Error approving USDC for repayment:', error);
    throw new Error('Failed to approve USDC for repayment');
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
    throw new Error('Failed to repay loan: ' + (error as Error).message);
  }
};

// Get loan details
export const getLoanDetails = async (loanId: number): Promise<LoanDetails> => {
  try {
    const { provider } = getProviderAndSigner();
    const contract = getCreditPoolContract(provider);
    
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

// Get repayment amount for a loan
export const getRepaymentAmount = async (loanId: number): Promise<number> => {
  try {
    const { provider } = getProviderAndSigner();
    const contract = getCreditPoolContract(provider);
    
    // Get repayment amount
    const repaymentAmount = await contract.calculateRepaymentAmount(loanId);
    
    // Convert from Wei to USDC
    return Number(ethers.formatUnits(repaymentAmount, 6));
  } catch (error) {
    console.error('Error getting repayment amount:', error);
    throw new Error('Failed to get repayment amount');
  }
};

// Get pool balance
export const getPoolBalance = async (): Promise<number> => {
  try {
    const { provider } = getProviderAndSigner();
    const contract = getCreditPoolContract(provider);
    
    // Get pool balance
    const balance = await contract.getPoolBalance();
    
    // Convert from Wei to USDC
    return Number(ethers.formatUnits(balance, 6));
  } catch (error) {
    console.error('Error getting pool balance:', error);
    throw new Error('Failed to get pool balance');
  }
};

// Get total number of loans
export const getLoanCount = async (): Promise<number> => {
  try {
    const { provider } = getProviderAndSigner();
    const contract = getCreditPoolContract(provider);
    
    // Get loan counter
    const counter = await contract.loanCounter();
    
    return Number(counter);
  } catch (error) {
    console.error('Error getting loan count:', error);
    throw new Error('Failed to get loan count');
  }
};

// Get USDC balance of a user
export const getUSDCBalance = async (userAddress: string): Promise<number> => {
  try {
    const { provider } = getProviderAndSigner();
    const contract = getUSDCContract(provider);
    
    // Get USDC balance
    const balance = await contract.balanceOf(userAddress);
    
    // Convert from Wei to USDC
    return Number(ethers.formatUnits(balance, 6));
  } catch (error) {
    console.error('Error getting USDC balance:', error);
    throw new Error('Failed to get USDC balance');
  }
};

// Get USDC allowance for credit pool
export const getUSDCAllowance = async (userAddress: string): Promise<number> => {
  try {
    const { provider } = getProviderAndSigner();
    const usdcContract = getUSDCContract(provider);
    
    const creditPoolAddress = process.env.CREDIT_POOL_ADDRESS;
    if (!creditPoolAddress) {
      throw new Error('Credit pool address not found in environment variables');
    }
    
    // Get allowance
    const allowance = await usdcContract.allowance(userAddress, creditPoolAddress);
    
    // Convert from Wei to USDC
    return Number(ethers.formatUnits(allowance, 6));
  } catch (error) {
    console.error('Error getting USDC allowance:', error);
    throw new Error('Failed to get USDC allowance');
  }
};
