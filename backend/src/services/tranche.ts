import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { TrancheInfo } from '../types';

// Load environment variables
dotenv.config();

// ABI for TrancheManager contract (simplified for this example)
const TRANCHE_MANAGER_ABI = [
  "function depositToSenior(uint256 amount) external",
  "function depositToJunior(uint256 amount) external",
  "function withdrawFromSenior(uint256 shares) external",
  "function withdrawFromJunior(uint256 shares) external",
  "function getSeniorTrancheInfo() external view returns (uint256 totalInvested, uint256 totalShares, uint256 yieldRate)",
  "function getJuniorTrancheInfo() external view returns (uint256 totalInvested, uint256 totalShares, uint256 yieldRate)",
  "function getTotalValueLocked() external view returns (uint256)"
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
    const amountWei = ethers.parseUnits(amount.toString(), 6); // Assuming USDC with 6 decimals
    
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
