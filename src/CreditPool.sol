// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./LPToken.sol";
import "./TrancheManager.sol";
import "./AccessController.sol";

contract CreditPool {
    IERC20 public usdc;
    TrancheManager public trancheManager;
    AccessController public accessController;
    uint256 public loanCounter;
    mapping(uint256 => Loan) public loans;

    struct Loan {
        address borrower;
        uint256 principal;
        uint256 valuation;
        uint256 interest; // e.g. 12 = 12%
        uint256 dueDate;
        bool repaid;
        string metadataURI; // IPFS hash for loan metadata
    }

    event LoanIssued(uint256 id, address borrower, uint256 principal, uint256 valuation, string metadataURI);
    event LoanRepaid(uint256 id, uint256 amount);
    event FundsDistributed(uint256 loanId, uint256 amount);

    modifier onlyAdmin() {
        require(accessController.isAdmin(msg.sender), "Only admin can perform this action");
        _;
    }

    modifier onlyUnderwriter() {
        require(accessController.isUnderwriter(msg.sender), "Only underwriter can perform this action");
        _;
    }

    constructor(address _usdc, address _trancheManager, address _accessController) {
        usdc = IERC20(_usdc);
        trancheManager = TrancheManager(_trancheManager);
        accessController = AccessController(_accessController);
    }

    function issueLoan(
        address borrower,
        uint256 valuation,
        uint256 principal,
        uint256 interest,
        uint256 duration,
        string calldata metadataURI
    ) external onlyUnderwriter {
        require(principal <= valuation, "Principal exceeds valuation");
        require(usdc.balanceOf(address(this)) >= principal, "Insufficient funds in pool");

        uint256 id = ++loanCounter;
        loans[id] = Loan(
            borrower, 
            principal, 
            valuation, 
            interest, 
            block.timestamp + duration, 
            false,
            metadataURI
        );

        // Transfer funds to borrower
        require(usdc.transfer(borrower, principal), "Transfer to borrower failed");
        
        emit LoanIssued(id, borrower, principal, valuation, metadataURI);
    }

    function repayLoan(uint256 id) external {
        Loan storage loan = loans[id];
        require(!loan.repaid, "Loan already repaid");
        require(block.timestamp <= loan.dueDate, "Loan is overdue");

        uint256 amountDue = calculateRepaymentAmount(id);
        
        // Transfer funds from borrower to pool
        require(usdc.transferFrom(msg.sender, address(this), amountDue), "Transfer from borrower failed");
        
        loan.repaid = true;
        emit LoanRepaid(id, amountDue);
        
        // Distribute repayment to tranches
        trancheManager.distributeRepayment(amountDue);
        emit FundsDistributed(id, amountDue);
    }

    function calculateRepaymentAmount(uint256 id) public view returns (uint256) {
        Loan storage loan = loans[id];
        return loan.principal + (loan.principal * loan.interest) / 100;
    }

    function getLoan(uint256 id) external view returns (Loan memory) {
        return loans[id];
    }

    function getPoolBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
}
