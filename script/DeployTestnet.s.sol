// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import "../src/AccessController.sol";
import "../src/LPToken.sol";
import "../src/TrancheManager.sol";
import "../src/CreditPool.sol";

contract DeployTestnetScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // For testnet, we can use a mock USDC address or deploy a mock USDC
        address usdcAddress = vm.envOr("USDC_ADDRESS", address(0x07865c6E87B9F70255377e024ace6630C1Eaa37F)); // Goerli USDC
        
        // Default yield rates for testnet
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

        // Add the deployer as an underwriter for testing
        accessController.addUnderwriter(msg.sender);
        console.log("Added deployer as underwriter:", msg.sender);

        vm.stopBroadcast();
    }
}
