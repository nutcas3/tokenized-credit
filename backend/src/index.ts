import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { ethers } from 'ethers';

import { uploadToIPFS } from './services/ipfs';
import { issueLoan, repayLoan, getLoanDetails } from './services/loan';
import { depositToTranche, withdrawFromTranche, getTrancheInfo } from './services/tranche';
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
