# Pharos Credit Protocol

A tokenized financing protocol for real-world assets (invoices, trade receivables, private loans) with underwriter-set valuations, on-chain capital pools, and yield-bearing LP tokens — deployed on Pharos Network.

## Vision

Enable tokenized financing of real-world assets with **underwriter-set valuations**, **on-chain capital pools**, and **yield-bearing LP tokens** — all deployed on **Pharos Network**.

## Problem it Solves

- Real-world borrowers lack access to flexible, low-cost credit
- DeFi capital is trapped in yield-farming loops, disconnected from the real economy
- Underwriters can't easily connect their credit analysis to DeFi liquidity
- Risk exposure in DeFi is often homogeneous — we solve this with **tranches**

## How It Works

### 1. Borrowers Submit Credit Assets (Off-chain)
They apply via a web portal with:
- Invoice / trade receivable data
- Identity/KYC (off-chain)
- Expected valuation

### 2. Underwriters Review (Off-chain)
An underwriter uses domain knowledge to assess risk and assign a **valuation** to the credit asset. This valuation is uploaded to IPFS and then linked to the on-chain loan.

### 3. Smart Contract: Loan Issuance
The underwriter calls `issueLoan()` with:
- Borrower address
- Valuation
- Principal (e.g., 80% of valuation)
- Interest rate
- Duration

The pool disburses USDC to the borrower.

### 4. Smart Contract: LPs and Tranches
- Lenders deposit USDC into **Senior** or **Junior** tranches
- Tranche priority determines risk/reward:
  - **Senior** gets repaid first, lower APY
  - **Junior** gets higher APY, but absorbs defaults first
- LPs receive `LPToken` representing their share

### 5. Repayment
Borrowers repay the principal + interest. Funds flow back to the pool and are distributed via the tranche waterfall.

## Architecture Components

### Smart Contracts (Solidity on Pharos via Foundry)
- `CreditPool.sol`: Core pool that disburses/repays
- `TrancheManager.sol`: Tracks senior/junior tranches
- `LPToken.sol`: ERC-20 shares
- `AccessController.sol`: Role-based access (admin, underwriter)

### Backend (Node.js + Ethers.js + IPFS)
- Express API to manage:
  - Loan application submission
  - Underwriter review + valuation
  - IPFS uploads
  - Contract calls to issue loans
  - Repayment logic + events watcher
- Stores minimal metadata; sensitive docs are off-chain

## Getting Started

### Prerequisites
- Node.js (v16+)
- Foundry (for smart contract development)
- Pharos Network RPC access

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/pharos-credit-protocol.git
cd pharos-credit-protocol
```

2. Install smart contract dependencies
```bash
forge install
```

3. Install backend dependencies
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
```

### Building and Testing

1. Build smart contracts
```bash
forge build
```

2. Run smart contract tests
```bash
forge test
```

3. Start the backend server
```bash
cd backend
npm run dev
```

## Security Considerations
- **Loan valuation** is human-dependent — underwriters must be whitelisted
- **Non-repayment risk** handled via tranches + conservative LTVs
- Oracle integration for USD stablecoin valuation (optional)

## Example Loan Lifecycle

| Step | Action |
|---------------------|---------------------------------------------------|
| 1. Loan Application | Alice submits invoice worth $10k |
| 2. Valuation | Underwriter gives it $9k valuation |
| 3. Disbursement | Pool disburses $7.2k (80% LTV) |
| 4. Repayment | Alice repays $7.2k + 10% interest after 30 days |
| 5. LPs Paid | Senior gets 3.6%, Junior gets 6.4% |

## Future Enhancements
- Integrate Chainlink proof-of-reserve for creditworthiness
- Auto-liquidation on default
- Secondary markets for LP tokens
- Zero-knowledge attestations for borrower data

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
