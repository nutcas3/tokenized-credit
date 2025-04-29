// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import "../src/AccessController.sol";
import "../src/LPToken.sol";
import "../src/TrancheManager.sol";
import "../src/CreditPool.sol";

contract ConfigureDeploymentScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Get deployed contract addresses from environment
        address accessControllerAddress = vm.envAddress("ACCESS_CONTROLLER_ADDRESS");
        address seniorLPTokenAddress = vm.envAddress("SENIOR_LP_TOKEN_ADDRESS");
        address juniorLPTokenAddress = vm.envAddress("JUNIOR_LP_TOKEN_ADDRESS");
        address trancheManagerAddress = vm.envAddress("TRANCHE_MANAGER_ADDRESS");
        address creditPoolAddress = vm.envAddress("CREDIT_POOL_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        // Load deployed contracts
        AccessController accessController = AccessController(accessControllerAddress);
        LPToken seniorLPToken = LPToken(seniorLPTokenAddress);
        LPToken juniorLPToken = LPToken(juniorLPTokenAddress);
        TrancheManager trancheManager = TrancheManager(trancheManagerAddress);
        CreditPool creditPool = CreditPool(creditPoolAddress);

        console.log("Configuring deployed contracts...");

        // Configure relationships if needed
        if (accessController.getCreditPool() != creditPoolAddress) {
            accessController.setCreditPool(creditPoolAddress);
            console.log("Set CreditPool in AccessController");
        }

        if (seniorLPToken.trancheManager() != trancheManagerAddress) {
            seniorLPToken.setTrancheManager(trancheManagerAddress);
            console.log("Set TrancheManager in Senior LP Token");
        }

        if (juniorLPToken.trancheManager() != trancheManagerAddress) {
            juniorLPToken.setTrancheManager(trancheManagerAddress);
            console.log("Set TrancheManager in Junior LP Token");
        }

        // Add underwriters if specified
        string memory underwritersStr = vm.envOr("UNDERWRITERS", string(""));
        if (bytes(underwritersStr).length > 0) {
            // Parse comma-separated list of addresses
            string[] memory underwriters = split(underwritersStr, ",");
            for (uint i = 0; i < underwriters.length; i++) {
                address underwriter = parseAddr(underwriters[i]);
                if (underwriter != address(0)) {
                    accessController.addUnderwriter(underwriter);
                    console.log("Added underwriter:", underwriter);
                }
            }
        }

        // Add admins if specified
        string memory adminsStr = vm.envOr("ADMINS", string(""));
        if (bytes(adminsStr).length > 0) {
            // Parse comma-separated list of addresses
            string[] memory admins = split(adminsStr, ",");
            for (uint i = 0; i < admins.length; i++) {
                address admin = parseAddr(admins[i]);
                if (admin != address(0)) {
                    accessController.addAdmin(admin);
                    console.log("Added admin:", admin);
                }
            }
        }

        console.log("Configuration completed successfully");

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

    // Helper function to split a string by delimiter
    function split(string memory _base, string memory _delimiter) internal pure returns (string[] memory) {
        bytes memory baseBytes = bytes(_base);
        uint count = 1;
        for (uint i = 0; i < baseBytes.length; i++) {
            if (baseBytes[i] == bytes(_delimiter)[0]) {
                count++;
            }
        }
        
        string[] memory parts = new string[](count);
        
        uint lastIndex = 0;
        uint partIndex = 0;
        for (uint i = 0; i < baseBytes.length; i++) {
            if (baseBytes[i] == bytes(_delimiter)[0]) {
                parts[partIndex] = substring(_base, lastIndex, i);
                lastIndex = i + 1;
                partIndex++;
            }
        }
        
        // Add the last part
        parts[partIndex] = substring(_base, lastIndex, baseBytes.length);
        
        return parts;
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
