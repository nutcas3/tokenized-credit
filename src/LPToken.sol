// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LPToken is ERC20, Ownable {
    address public trancheManager;
    
    event Minted(address to, uint256 amount);
    event Burned(address from, uint256 amount);
    
    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender) {}
    
    function setTrancheManager(address _trancheManager) external onlyOwner {
        require(_trancheManager != address(0), "Invalid tranche manager address");
        trancheManager = _trancheManager;
    }
    
    modifier onlyTrancheManager() {
        require(msg.sender == trancheManager, "Only tranche manager can call this function");
        _;
    }
    
    function mint(address to, uint256 amount) external onlyTrancheManager {
        _mint(to, amount);
        emit Minted(to, amount);
    }
    
    function burn(address from, uint256 amount) external onlyTrancheManager {
        _burn(from, amount);
        emit Burned(from, amount);
    }
}
