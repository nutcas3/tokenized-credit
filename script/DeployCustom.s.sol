// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import "../src/AccessController.sol";
import "../src/LPToken.sol";
import "../src/TrancheManager.sol";
import "../src/CreditPool.sol";

contract DeployCustomScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        
        // Custom yield rates from environment
        uint256 seniorYieldRate = vm.envUint("SENIOR_YIELD_RATE");
        uint256 juniorYieldRate = vm.envUint("JUNIOR_YIELD_RATE");
        
        // Custom token names and symbols
        string memory seniorName = vm.envString("SENIOR_TOKEN_NAME");
        string memory seniorSymbol = vm.envString("SENIOR_TOKEN_SYMBOL");
        string memory juniorName = vm.envString("JUNIOR_TOKEN_NAME");
        string memory juniorSymbol = vm.envString("JUNIOR_TOKEN_SYMBOL");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy AccessController
        AccessController accessController = new AccessController();
        console.log("AccessController deployed at:", address(accessController));

        // Deploy LP Tokens with custom names
        LPToken seniorLPToken = new LPToken(seniorName, seniorSymbol);
        console.log("Senior LP Token deployed at:", address(seniorLPToken));

        LPToken juniorLPToken = new LPToken(juniorName, juniorSymbol);
        console.log("Junior LP Token deployed at:", address(juniorLPToken));

        // Deploy TrancheManager with custom yield rates
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

        // Add additional admins if specified
        string memory additionalAdminsStr = vm.envOr("ADDITIONAL_ADMINS", string(""));
        if (bytes(additionalAdminsStr).length > 0) {
            // Parse comma-separated list of addresses
            // This is a simplified approach - in production, you'd want more robust parsing
            bytes memory additionalAdminsBytes = bytes(additionalAdminsStr);
            uint256 start = 0;
            for (uint256 i = 0; i < additionalAdminsBytes.length; i++) {
                if (additionalAdminsBytes[i] == ',') {
                    string memory addressStr = substring(additionalAdminsStr, start, i);
                    address admin = parseAddr(addressStr);
                    if (admin != address(0)) {
                        accessController.addAdmin(admin);
                        console.log("Added admin:", admin);
                    }
                    start = i + 1;
                }
            }
            // Add the last address if there's any
            if (start < additionalAdminsBytes.length) {
                string memory addressStr = substring(additionalAdminsStr, start, additionalAdminsBytes.length);
                address admin = parseAddr(addressStr);
                if (admin != address(0)) {
                    accessController.addAdmin(admin);
                    console.log("Added admin:", admin);
                }
            }
        }

        vm.stopBroadcast();
    }

    // Helper function to parse address from string
    function parseAddr(string memory _a) internal pure returns (address) {
        bytes memory tmp = bytes(_a);
        if (tmp.length != 42) return address(0);
        uint160 iaddr = 0;
        uint160 b1;
        uint160 b2;
        for (uint i = 2; i < 2 + 2 * 20; i += 2) {
            iaddr *= 256;
            b1 = uint160(uint8(tmp[i]));
            b2 = uint160(uint8(tmp[i + 1]));
            if ((b1 >= 97) && (b1 <= 102)) b1 -= 87;
            else if ((b1 >= 65) && (b1 <= 70)) b1 -= 55;
            else if ((b1 >= 48) && (b1 <= 57)) b1 -= 48;
            if ((b2 >= 97) && (b2 <= 102)) b2 -= 87;
            else if ((b2 >= 65) && (b2 <= 70)) b2 -= 55;
            else if ((b2 >= 48) && (b2 <= 57)) b2 -= 48;
            iaddr += (b1 * 16 + b2);
        }
        return address(iaddr);
    }

    // Helper function to get substring
    function substring(string memory str, uint startIndex, uint endIndex) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);
        bytes memory result = new bytes(endIndex - startIndex);
        for (uint i = startIndex; i < endIndex; i++) {
            result[i - startIndex] = strBytes[i];
        }
        return string(result);
    }
}
