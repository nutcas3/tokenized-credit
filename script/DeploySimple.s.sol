// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import "../src/AccessController.sol";
import "../src/LPToken.sol";
import "../src/TrancheManager.sol";
import "../src/CreditPool.sol";

/**
 * @title DeploySimple
 * @notice Simplified deployment script that reads wallet address from .env
 * @dev Main contract to be deployed by Forge
 */
contract DeploySimpleScript is Script {
    // Wallet address from .env file
    address public walletAddress;
    
    function setUp() public {
        // Read wallet address from .env file
        walletAddress = vm.envAddress("WALLET_ADDRESS");
    }

    function run() public returns (AccessController, LPToken, LPToken, TrancheManager, CreditPool) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Default to user's wallet address as mock USDC if not specified
        address usdcAddress = vm.envOr("USDC_ADDRESS", walletAddress);
        
        // Default yield rates
        uint256 seniorYieldRate = 500; // 5%
        uint256 juniorYieldRate = 1000; // 10%

        vm.startBroadcast(deployerPrivateKey);

        // Deploy AccessController
        AccessController accessController = new AccessController();
        console.log("AccessController deployed at:", address(accessController));

        // Deploy LP Tokens
        LPToken seniorLPToken = new LPToken("Senior Tranche LP Token", "srLPT");
        console.log("Senior LP Token deployed at:", address(seniorLPToken));

        LPToken juniorLPToken = new LPToken("Junior Tranche LP Token", "jrLPT");
        console.log("Junior LP Token deployed at:", address(juniorLPToken));

        // Deploy TrancheManager
        TrancheManager trancheManager = new TrancheManager(
            usdcAddress,
            address(accessController),
            address(seniorLPToken),
            address(juniorLPToken),
            seniorYieldRate,
            juniorYieldRate
        );
        console.log("TrancheManager deployed at:", address(trancheManager));

        // Deploy CreditPool
        CreditPool creditPool = new CreditPool(
            usdcAddress,
            address(trancheManager),
            address(accessController)
        );
        console.log("CreditPool deployed at:", address(creditPool));

        // Set up relationships between contracts
        accessController.setCreditPool(address(creditPool));
        seniorLPToken.setTrancheManager(address(trancheManager));
        juniorLPToken.setTrancheManager(address(trancheManager));

        // Add your wallet as admin and underwriter
        if (!accessController.isAdmin(walletAddress)) {
            accessController.addAdmin(walletAddress);
            console.log("Added wallet as admin:", walletAddress);
        }
        
        if (!accessController.isUnderwriter(walletAddress)) {
            accessController.addUnderwriter(walletAddress);
            console.log("Added wallet as underwriter:", walletAddress);
        }

        vm.stopBroadcast();
        
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Your wallet address:", walletAddress);
        console.log("AccessController:", address(accessController));
        console.log("Senior LP Token:", address(seniorLPToken));
        console.log("Junior LP Token:", address(juniorLPToken));
        console.log("Tranche Manager:", address(trancheManager));
        console.log("Credit Pool:", address(creditPool));
        console.log("USDC Address:", usdcAddress);
        console.log("=========================\n");
        
        console.log("To deploy, run:");
        console.log("forge script script/DeploySimple.s.sol:DeploySimpleScript --rpc-url <RPC_URL> --private-key <YOUR_PRIVATE_KEY> --broadcast");
        console.log("\nNOTE: Make sure your .env file contains WALLET_ADDRESS and PRIVATE_KEY");
        console.log("Using your wallet address as the mock USDC address by default!");
        
        // Return deployed contracts
        return (accessController, seniorLPToken, juniorLPToken, trancheManager, creditPool);
    }
}
