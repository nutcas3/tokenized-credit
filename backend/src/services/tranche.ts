import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { TrancheInfo } from '../types';

// Load environment variables
dotenv.config();

// ABI for TrancheManager contract
const TRANCHE_MANAGER_ABI = [
  "function depositToSenior(uint256 amount) external",
  "function depositToJunior(uint256 amount) external",
  "function withdrawFromSenior(uint256 shares) external",
  "function withdrawFromJunior(uint256 shares) external",
  "function getSeniorTrancheInfo() external view returns (uint256 totalInvested, uint256 totalShares, uint256 yieldRate)",
  "function getJuniorTrancheInfo() external view returns (uint256 totalInvested, uint256 totalShares, uint256 yieldRate)",
  "function getTotalValueLocked() external view returns (uint256)",
  "function calculateSeniorShares(uint256 amount) public view returns (uint256)",
  "function calculateJuniorShares(uint256 amount) public view returns (uint256)"
];

// ABI for LP Token contract
const LP_TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address recipient, uint256 amount) external returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)"
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
const getTrancheManagerContract = (signer: ethers.Wallet | ethers.Provider) => {
  const contractAddress = process.env.TRANCHE_MANAGER_ADDRESS;
  if (!contractAddress) {
    throw new Error('Tranche manager contract address not found in environment variables');
  }
  
  return new ethers.Contract(contractAddress, TRANCHE_MANAGER_ABI, signer);
};

// Get LP Token contract instance
const getLPTokenContract = (isSenior: boolean, signer: ethers.Wallet | ethers.Provider) => {
  const contractAddress = isSenior 
    ? process.env.SENIOR_LP_TOKEN_ADDRESS 
    : process.env.JUNIOR_LP_TOKEN_ADDRESS;
    
  if (!contractAddress) {
    throw new Error(`${isSenior ? 'Senior' : 'Junior'} LP token contract address not found in environment variables`);
  }
  
  return new ethers.Contract(contractAddress, LP_TOKEN_ABI, signer);
};

// Approve USDC for tranche deposit
export const approveUSDCForDeposit = async (
  amount: number,
  userAddress: string
): Promise<string> => {
  try {
    const { signer } = getProviderAndSigner();
    
    // Get USDC contract
    const usdcAddress = process.env.USDC_ADDRESS;
    if (!usdcAddress) {
      throw new Error('USDC address not found in environment variables');
    }
    
    const trancheManagerAddress = process.env.TRANCHE_MANAGER_ADDRESS;
    if (!trancheManagerAddress) {
      throw new Error('Tranche manager address not found in environment variables');
    }
    
    const usdcContract = new ethers.Contract(usdcAddress, [
      "function approve(address spender, uint256 amount) external returns (bool)"
    ], signer);
    
    // Convert amount to Wei
    const amountWei = ethers.parseUnits(amount.toString(), 6); // USDC has 6 decimals
    
    // Approve tranche manager to spend USDC
    const tx = await usdcContract.approve(trancheManagerAddress, amountWei);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return receipt.hash;
  } catch (error) {
    console.error('Error approving USDC for deposit:', error);
    throw new Error('Failed to approve USDC for deposit');
  }
};

// Deposit to tranche
export const depositToTranche = async (
  amount: number,
  isSenior: boolean,
  userAddress: string
): Promise<string> => {
  try {
    const { signer } = getProviderAndSigner();
    const contract = getTrancheManagerContract(signer);
    
    // Convert amount to Wei
    const amountWei = ethers.parseUnits(amount.toString(), 6); // USDC has 6 decimals
    
    // Deposit to tranche
    const tx = isSenior
      ? await contract.depositToSenior(amountWei)
      : await contract.depositToJunior(amountWei);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return receipt.hash;
  } catch (error) {
    console.error(`Error depositing to ${isSenior ? 'senior' : 'junior'} tranche:`, error);
    throw new Error(`Failed to deposit to ${isSenior ? 'senior' : 'junior'} tranche`);
  }
};

// Withdraw from tranche
export const withdrawFromTranche = async (
  shares: number,
  isSenior: boolean,
  userAddress: string
): Promise<string> => {
  try {
    const { signer } = getProviderAndSigner();
    const contract = getTrancheManagerContract(signer);
    
    // Convert shares to Wei
    const sharesWei = ethers.parseUnits(shares.toString(), 18); // LP tokens typically have 18 decimals
    
    // Withdraw from tranche
    const tx = isSenior
      ? await contract.withdrawFromSenior(sharesWei)
      : await contract.withdrawFromJunior(sharesWei);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    return receipt.hash;
  } catch (error) {
    console.error(`Error withdrawing from ${isSenior ? 'senior' : 'junior'} tranche:`, error);
    throw new Error(`Failed to withdraw from ${isSenior ? 'senior' : 'junior'} tranche`);
  }
};

// Get tranche information
export const getTrancheInfo = async (isSenior: boolean): Promise<TrancheInfo> => {
  try {
    const { provider } = getProviderAndSigner();
    const contract = getTrancheManagerContract(provider);
    
    // Get tranche info
    const trancheInfo = isSenior
      ? await contract.getSeniorTrancheInfo()
      : await contract.getJuniorTrancheInfo();
    
    // Format tranche info
    const totalInvested = Number(ethers.formatUnits(trancheInfo[0], 6)); // Convert from Wei to USDC
    const totalShares = Number(ethers.formatUnits(trancheInfo[1], 18)); // LP tokens typically have 18 decimals
    const yieldRate = Number(trancheInfo[2]);
    
    // Calculate APY (simplified)
    const apy = (yieldRate / 100); // Convert basis points to percentage
    
    return {
      totalInvested,
      totalShares,
      yieldRate,
      apy
    };
  } catch (error) {
    console.error(`Error getting ${isSenior ? 'senior' : 'junior'} tranche info:`, error);
    throw new Error(`Failed to get ${isSenior ? 'senior' : 'junior'} tranche info`);
  }
};

// Get total value locked
export const getTotalValueLocked = async (): Promise<number> => {
  try {
    const { provider } = getProviderAndSigner();
    const contract = getTrancheManagerContract(provider);
    
    // Get total value locked
    const tvl = await contract.getTotalValueLocked();
    
    // Convert from Wei to USDC
    return Number(ethers.formatUnits(tvl, 6));
  } catch (error) {
    console.error('Error getting total value locked:', error);
    throw new Error('Failed to get total value locked');
  }
};

// Get LP token balance for a user
export const getLPTokenBalance = async (userAddress: string, isSenior: boolean): Promise<number> => {
  try {
    const { provider } = getProviderAndSigner();
    const lpTokenContract = getLPTokenContract(isSenior, provider);
    
    // Get LP token balance
    const balance = await lpTokenContract.balanceOf(userAddress);
    
    // Convert from Wei to tokens
    return Number(ethers.formatUnits(balance, 18)); // LP tokens typically have 18 decimals
  } catch (error) {
    console.error(`Error getting ${isSenior ? 'senior' : 'junior'} LP token balance:`, error);
    throw new Error(`Failed to get ${isSenior ? 'senior' : 'junior'} LP token balance`);
  }
};

// Calculate shares for a given deposit amount
export const calculateShares = async (amount: number, isSenior: boolean): Promise<number> => {
  try {
    const { provider } = getProviderAndSigner();
    const contract = getTrancheManagerContract(provider);
    
    // Convert amount to Wei
    const amountWei = ethers.parseUnits(amount.toString(), 6); // USDC has 6 decimals
    
    // Calculate shares
    const shares = isSenior
      ? await contract.calculateSeniorShares(amountWei)
      : await contract.calculateJuniorShares(amountWei);
    
    // Convert from Wei to tokens
    return Number(ethers.formatUnits(shares, 18)); // LP tokens typically have 18 decimals
  } catch (error) {
    console.error(`Error calculating ${isSenior ? 'senior' : 'junior'} shares:`, error);
    throw new Error(`Failed to calculate ${isSenior ? 'senior' : 'junior'} shares`);
  }
};

// Get USDC allowance for tranche manager
export const getUSDCAllowance = async (userAddress: string): Promise<number> => {
  try {
    const { provider } = getProviderAndSigner();
    
    // Get USDC contract
    const usdcAddress = process.env.USDC_ADDRESS;
    if (!usdcAddress) {
      throw new Error('USDC address not found in environment variables');
    }
    
    const trancheManagerAddress = process.env.TRANCHE_MANAGER_ADDRESS;
    if (!trancheManagerAddress) {
      throw new Error('Tranche manager address not found in environment variables');
    }
    
    const usdcContract = new ethers.Contract(usdcAddress, [
      "function allowance(address owner, address spender) external view returns (uint256)"
    ], provider);
    
    // Get allowance
    const allowance = await usdcContract.allowance(userAddress, trancheManagerAddress);
    
    // Convert from Wei to USDC
    return Number(ethers.formatUnits(allowance, 6)); // USDC has 6 decimals
  } catch (error) {
    console.error('Error getting USDC allowance:', error);
    throw new Error('Failed to get USDC allowance');
  }
};
