import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { ethers } from 'ethers';

import { uploadToIPFS, getFromIPFS } from './services/ipfs';
import {
  issueLoan,
  repayLoan,
  getLoanDetails,
  getPoolBalance,
  getLoanCount,
  getRepaymentAmount,
  approveUSDCForRepayment,
  getUSDCBalance,
  getUSDCAllowance as getLoanUSDCAllowance,
  isUnderwriter,
  isAdmin
} from './services/loan';
import {
  depositToTranche,
  withdrawFromTranche,
  getTrancheInfo,
  getTotalValueLocked,
  getLPTokenBalance,
  calculateShares,
  approveUSDCForDeposit,
  getUSDCAllowance
} from './services/tranche';
import { LoanApplication, LoanApproval } from './types';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Loan application endpoint
app.post('/api/loan/apply', async (req, res) => {
  try {
    const loanApplication: LoanApplication = req.body;
    
    // Validate request
    if (!loanApplication.borrowerAddress || !loanApplication.invoiceData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Upload invoice data to IPFS
    const metadataURI = await uploadToIPFS(loanApplication.invoiceData);
    
    // Save loan application to database (simplified for now)
    const applicationId = Date.now().toString(); // This would be a DB ID in production
    
    res.status(201).json({ 
      message: 'Loan application submitted successfully',
      applicationId,
      metadataURI
    });
  } catch (error) {
    console.error('Error submitting loan application:', error);
    res.status(500).json({ error: 'Failed to process loan application' });
  }
});

// Loan approval endpoint (for underwriters)
app.post('/api/loan/approve', async (req, res) => {
  try {
    const loanApproval: LoanApproval = req.body;
    
    // Validate request
    if (!loanApproval.borrowerAddress || !loanApproval.valuation || !loanApproval.principal || 
        !loanApproval.interest || !loanApproval.duration || !loanApproval.metadataURI) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Call smart contract to issue loan
    const txHash = await issueLoan(
      loanApproval.borrowerAddress,
      loanApproval.valuation,
      loanApproval.principal,
      loanApproval.interest,
      loanApproval.duration,
      loanApproval.metadataURI
    );
    
    res.status(200).json({ 
      message: 'Loan approved and issued successfully',
      txHash
    });
  } catch (error) {
    console.error('Error approving loan:', error);
    res.status(500).json({ error: 'Failed to approve loan' });
  }
});

// Loan repayment endpoint
app.post('/api/loan/repay/:loanId', async (req, res) => {
  try {
    const { loanId } = req.params;
    
    // Call smart contract to repay loan
    const txHash = await repayLoan(parseInt(loanId));
    
    res.status(200).json({ 
      message: 'Loan repaid successfully',
      txHash
    });
  } catch (error) {
    console.error('Error repaying loan:', error);
    res.status(500).json({ error: 'Failed to repay loan' });
  }
});

// Get loan details endpoint
app.get('/api/loan/:loanId', async (req, res) => {
  try {
    const { loanId } = req.params;
    
    // Get loan details from smart contract
    const loanDetails = await getLoanDetails(parseInt(loanId));
    
    res.status(200).json(loanDetails);
  } catch (error) {
    console.error('Error fetching loan details:', error);
    res.status(500).json({ error: 'Failed to fetch loan details' });
  }
});

// Deposit to tranche endpoint
app.post('/api/tranche/deposit', async (req, res) => {
  try {
    const { amount, isSenior, userAddress } = req.body;
    
    // Validate request
    if (!amount || userAddress === undefined || isSenior === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Call smart contract to deposit to tranche
    const txHash = await depositToTranche(amount, isSenior, userAddress);
    
    res.status(200).json({ 
      message: `Deposit to ${isSenior ? 'senior' : 'junior'} tranche successful`,
      txHash
    });
  } catch (error) {
    console.error('Error depositing to tranche:', error);
    res.status(500).json({ error: 'Failed to deposit to tranche' });
  }
});

// Withdraw from tranche endpoint
app.post('/api/tranche/withdraw', async (req, res) => {
  try {
    const { shares, isSenior, userAddress } = req.body;
    
    // Validate request
    if (!shares || userAddress === undefined || isSenior === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Call smart contract to withdraw from tranche
    const txHash = await withdrawFromTranche(shares, isSenior, userAddress);
    
    res.status(200).json({ 
      message: `Withdrawal from ${isSenior ? 'senior' : 'junior'} tranche successful`,
      txHash
    });
  } catch (error) {
    console.error('Error withdrawing from tranche:', error);
    res.status(500).json({ error: 'Failed to withdraw from tranche' });
  }
});

// Get tranche info endpoint
app.get('/api/tranche/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const isSenior = type === 'senior';
    
    // Get tranche info from smart contract
    const trancheInfo = await getTrancheInfo(isSenior);
    
    res.status(200).json(trancheInfo);
  } catch (error) {
    console.error('Error fetching tranche info:', error);
    res.status(500).json({ error: 'Failed to fetch tranche info' });
  }
});

// Get total value locked endpoint
app.get('/api/tranche/tvl', async (req, res) => {
  try {
    // Get total value locked from smart contract
    const tvl = await getTotalValueLocked();
    
    res.status(200).json({ tvl });
  } catch (error) {
    console.error('Error fetching total value locked:', error);
    res.status(500).json({ error: 'Failed to fetch total value locked' });
  }
});

// Get LP token balance endpoint
app.get('/api/tranche/balance/:type/:address', async (req, res) => {
  try {
    const { type, address } = req.params;
    const isSenior = type === 'senior';
    
    // Get LP token balance from smart contract
    const balance = await getLPTokenBalance(address, isSenior);
    
    res.status(200).json({ balance });
  } catch (error) {
    console.error('Error fetching LP token balance:', error);
    res.status(500).json({ error: 'Failed to fetch LP token balance' });
  }
});

// Calculate shares for deposit endpoint
app.get('/api/tranche/calculate-shares', async (req, res) => {
  try {
    const { amount, isSenior } = req.query;
    
    if (!amount || isSenior === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Calculate shares from smart contract
    const shares = await calculateShares(Number(amount), isSenior === 'true');
    
    res.status(200).json({ shares });
  } catch (error) {
    console.error('Error calculating shares:', error);
    res.status(500).json({ error: 'Failed to calculate shares' });
  }
});

// Approve USDC for deposit endpoint
app.post('/api/tranche/approve', async (req, res) => {
  try {
    const { amount, userAddress } = req.body;
    
    // Validate request
    if (!amount || !userAddress) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Call smart contract to approve USDC for deposit
    const txHash = await approveUSDCForDeposit(amount, userAddress);
    
    res.status(200).json({ 
      message: 'USDC approved for deposit successfully',
      txHash
    });
  } catch (error) {
    console.error('Error approving USDC for deposit:', error);
    res.status(500).json({ error: 'Failed to approve USDC for deposit' });
  }
});

// Get USDC allowance for tranche manager endpoint
app.get('/api/tranche/allowance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Get USDC allowance from smart contract
    const allowance = await getUSDCAllowance(address);
    
    res.status(200).json({ allowance });
  } catch (error) {
    console.error('Error fetching USDC allowance:', error);
    res.status(500).json({ error: 'Failed to fetch USDC allowance' });
  }
});

// Get loan count endpoint
app.get('/api/loan/count', async (req, res) => {
  try {
    // Get loan count from smart contract
    const count = await getLoanCount();
    
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching loan count:', error);
    res.status(500).json({ error: 'Failed to fetch loan count' });
  }
});

// Get repayment amount endpoint
app.get('/api/loan/repayment/:loanId', async (req, res) => {
  try {
    const { loanId } = req.params;
    
    // Get repayment amount from smart contract
    const amount = await getRepaymentAmount(parseInt(loanId));
    
    res.status(200).json({ amount });
  } catch (error) {
    console.error('Error fetching repayment amount:', error);
    res.status(500).json({ error: 'Failed to fetch repayment amount' });
  }
});

// Approve USDC for loan repayment endpoint
app.post('/api/loan/approve-repayment/:loanId', async (req, res) => {
  try {
    const { loanId } = req.params;
    
    // Call smart contract to approve USDC for repayment
    const txHash = await approveUSDCForRepayment(parseInt(loanId));
    
    res.status(200).json({ 
      message: 'USDC approved for repayment successfully',
      txHash
    });
  } catch (error) {
    console.error('Error approving USDC for repayment:', error);
    res.status(500).json({ error: 'Failed to approve USDC for repayment' });
  }
});

// Get pool balance endpoint
app.get('/api/pool/balance', async (req, res) => {
  try {
    // Get pool balance from smart contract
    const balance = await getPoolBalance();
    
    res.status(200).json({ balance });
  } catch (error) {
    console.error('Error fetching pool balance:', error);
    res.status(500).json({ error: 'Failed to fetch pool balance' });
  }
});

// Get USDC balance endpoint
app.get('/api/usdc/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Get USDC balance from smart contract
    const balance = await getUSDCBalance(address);
    
    res.status(200).json({ balance });
  } catch (error) {
    console.error('Error fetching USDC balance:', error);
    res.status(500).json({ error: 'Failed to fetch USDC balance' });
  }
});

// Get USDC allowance for credit pool endpoint
app.get('/api/usdc/allowance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Get USDC allowance from smart contract
    const allowance = await getLoanUSDCAllowance(address);
    
    res.status(200).json({ allowance });
  } catch (error) {
    console.error('Error fetching USDC allowance:', error);
    res.status(500).json({ error: 'Failed to fetch USDC allowance' });
  }
});

// Check if user is an underwriter endpoint
app.get('/api/access/underwriter/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Check if user is an underwriter
    const isUserUnderwriter = await isUnderwriter(address);
    
    res.status(200).json({ isUnderwriter: isUserUnderwriter });
  } catch (error) {
    console.error('Error checking underwriter status:', error);
    res.status(500).json({ error: 'Failed to check underwriter status' });
  }
});

// Check if user is an admin endpoint
app.get('/api/access/admin/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Check if user is an admin
    const isUserAdmin = await isAdmin(address);
    
    res.status(200).json({ isAdmin: isUserAdmin });
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ error: 'Failed to check admin status' });
  }
});

// Get IPFS content endpoint
app.get('/api/ipfs/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    // Get content from IPFS
    const content = await getFromIPFS(hash);
    
    res.status(200).json(content);
  } catch (error) {
    console.error('Error fetching IPFS content:', error);
    res.status(500).json({ error: 'Failed to fetch IPFS content' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
