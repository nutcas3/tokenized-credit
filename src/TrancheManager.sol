// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./LPToken.sol";
import "./AccessController.sol";

contract TrancheManager {
    IERC20 public usdc;
    AccessController public accessController;
    LPToken public seniorLPToken;
    LPToken public juniorLPToken;
    
    struct Tranche {
        uint256 totalInvested;
        uint256 totalShares;
        uint256 yieldRate; // Annual yield rate in basis points (e.g., 500 = 5%)
    }
    
    Tranche public seniorTranche;
    Tranche public juniorTranche;
    
    event DepositToTranche(address investor, uint256 amount, bool isSenior, uint256 sharesIssued);
    event WithdrawalFromTranche(address investor, uint256 amount, bool isSenior, uint256 sharesBurned);
    event RepaymentDistributed(uint256 seniorAmount, uint256 juniorAmount);
    
    modifier onlyAdmin() {
        require(accessController.isAdmin(msg.sender), "Only admin can perform this action");
        _;
    }
    
    modifier onlyCreditPool() {
        require(msg.sender == address(accessController.getCreditPool()), "Only CreditPool can call this function");
        _;
    }
    
    constructor(
        address _usdc, 
        address _accessController,
        address _seniorLPToken,
        address _juniorLPToken,
        uint256 _seniorYieldRate,
        uint256 _juniorYieldRate
    ) {
        usdc = IERC20(_usdc);
        accessController = AccessController(_accessController);
        seniorLPToken = LPToken(_seniorLPToken);
        juniorLPToken = LPToken(_juniorLPToken);
        
        seniorTranche.yieldRate = _seniorYieldRate;
        juniorTranche.yieldRate = _juniorYieldRate;
    }
    
    function depositToSenior(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        
        // Transfer USDC from user to this contract
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Calculate shares based on current tranche value
        uint256 shares = calculateSeniorShares(amount);
        
        // Update tranche state
        seniorTranche.totalInvested += amount;
        seniorTranche.totalShares += shares;
        
        // Mint LP tokens to the user
        seniorLPToken.mint(msg.sender, shares);
        
        emit DepositToTranche(msg.sender, amount, true, shares);
    }
    
    function depositToJunior(uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        
        // Transfer USDC from user to this contract
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Calculate shares based on current tranche value
        uint256 shares = calculateJuniorShares(amount);
        
        // Update tranche state
        juniorTranche.totalInvested += amount;
        juniorTranche.totalShares += shares;
        
        // Mint LP tokens to the user
        juniorLPToken.mint(msg.sender, shares);
        
        emit DepositToTranche(msg.sender, amount, false, shares);
    }
    
    function withdrawFromSenior(uint256 shares) external {
        require(shares > 0, "Shares must be positive");
        require(seniorLPToken.balanceOf(msg.sender) >= shares, "Insufficient LP token balance");
        
        // Calculate USDC amount based on shares
        uint256 amount = (shares * seniorTranche.totalInvested) / seniorTranche.totalShares;
        require(amount <= usdc.balanceOf(address(this)), "Insufficient liquidity in pool");
        
        // Update tranche state
        seniorTranche.totalInvested -= amount;
        seniorTranche.totalShares -= shares;
        
        // Burn LP tokens
        seniorLPToken.burn(msg.sender, shares);
        
        // Transfer USDC to user
        require(usdc.transfer(msg.sender, amount), "Transfer failed");
        
        emit WithdrawalFromTranche(msg.sender, amount, true, shares);
    }
    
    function withdrawFromJunior(uint256 shares) external {
        require(shares > 0, "Shares must be positive");
        require(juniorLPToken.balanceOf(msg.sender) >= shares, "Insufficient LP token balance");
        
        // Calculate USDC amount based on shares
        uint256 amount = (shares * juniorTranche.totalInvested) / juniorTranche.totalShares;
        require(amount <= usdc.balanceOf(address(this)), "Insufficient liquidity in pool");
        
        // Update tranche state
        juniorTranche.totalInvested -= amount;
        juniorTranche.totalShares -= shares;
        
        // Burn LP tokens
        juniorLPToken.burn(msg.sender, shares);
        
        // Transfer USDC to user
        require(usdc.transfer(msg.sender, amount), "Transfer failed");
        
        emit WithdrawalFromTranche(msg.sender, amount, false, shares);
    }
    
    function distributeRepayment(uint256 amount) external onlyCreditPool {
        require(amount > 0, "Amount must be positive");
        
        // Calculate share for each tranche based on waterfall model
        // Senior tranche gets paid first up to their expected yield
        uint256 totalInvested = seniorTranche.totalInvested + juniorTranche.totalInvested;
        require(totalInvested > 0, "No investments in tranches");
        
        uint256 seniorShare = (seniorTranche.totalInvested * amount) / totalInvested;
        uint256 juniorShare = amount - seniorShare;
        
        // Update tranche state with new yield
        seniorTranche.totalInvested += seniorShare;
        juniorTranche.totalInvested += juniorShare;
        
        emit RepaymentDistributed(seniorShare, juniorShare);
    }
    
    function calculateSeniorShares(uint256 amount) public view returns (uint256) {
        if (seniorTranche.totalShares == 0 || seniorTranche.totalInvested == 0) {
            return amount; // Initial 1:1 ratio
        }
        return (amount * seniorTranche.totalShares) / seniorTranche.totalInvested;
    }
    
    function calculateJuniorShares(uint256 amount) public view returns (uint256) {
        if (juniorTranche.totalShares == 0 || juniorTranche.totalInvested == 0) {
            return amount; // Initial 1:1 ratio
        }
        return (amount * juniorTranche.totalShares) / juniorTranche.totalInvested;
    }
    
    function getSeniorTrancheInfo() external view returns (uint256 totalInvested, uint256 totalShares, uint256 yieldRate) {
        return (seniorTranche.totalInvested, seniorTranche.totalShares, seniorTranche.yieldRate);
    }
    
    function getJuniorTrancheInfo() external view returns (uint256 totalInvested, uint256 totalShares, uint256 yieldRate) {
        return (juniorTranche.totalInvested, juniorTranche.totalShares, juniorTranche.yieldRate);
    }
    
    function getTotalValueLocked() external view returns (uint256) {
        return seniorTranche.totalInvested + juniorTranche.totalInvested;
    }
}
