// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import "../src/AccessController.sol";
import "../src/LPToken.sol";
import "../src/TrancheManager.sol";
import "../src/CreditPool.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        
        // Default yield rates if not specified in environment
        uint256 seniorYieldRate = vm.envOr("SENIOR_YIELD_RATE", uint256(500)); // 5% default
        uint256 juniorYieldRate = vm.envOr("JUNIOR_YIELD_RATE", uint256(1000)); // 10% default

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

        vm.stopBroadcast();
    }
}
