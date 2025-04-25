// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract AccessController is Ownable {
    address public creditPool;
    mapping(address => bool) public underwriters;
    mapping(address => bool) public admins;
    
    event UnderwriterAdded(address underwriter);
    event UnderwriterRemoved(address underwriter);
    event AdminAdded(address admin);
    event AdminRemoved(address admin);
    event CreditPoolSet(address creditPool);
    
    constructor() Ownable(msg.sender) {
        admins[msg.sender] = true;
        emit AdminAdded(msg.sender);
    }
    
    modifier onlyAdmin() {
        require(admins[msg.sender], "Only admin can perform this action");
        _;
    }
    
    function setCreditPool(address _creditPool) external onlyOwner {
        require(_creditPool != address(0), "Invalid credit pool address");
        creditPool = _creditPool;
        emit CreditPoolSet(_creditPool);
    }
    
    function addUnderwriter(address underwriter) external onlyAdmin {
        require(underwriter != address(0), "Invalid underwriter address");
        underwriters[underwriter] = true;
        emit UnderwriterAdded(underwriter);
    }
    
    function removeUnderwriter(address underwriter) external onlyAdmin {
        underwriters[underwriter] = false;
        emit UnderwriterRemoved(underwriter);
    }
    
    function addAdmin(address admin) external onlyOwner {
        require(admin != address(0), "Invalid admin address");
        admins[admin] = true;
        emit AdminAdded(admin);
    }
    
    function removeAdmin(address admin) external onlyOwner {
        require(admin != msg.sender, "Cannot remove yourself as admin");
        admins[admin] = false;
        emit AdminRemoved(admin);
    }
    
    function isUnderwriter(address account) external view returns (bool) {
        return underwriters[account];
    }
    
    function isAdmin(address account) external view returns (bool) {
        return admins[account];
    }
    
    function getCreditPool() external view returns (address) {
        return creditPool;
    }
}
