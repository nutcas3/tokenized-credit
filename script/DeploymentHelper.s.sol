// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";

/**
 * @title DeploymentHelper
 * @notice Helper contract with utility functions for deployments
 */
contract DeploymentHelper is Script {
    // Utility function to convert string to address
    function stringToAddress(string memory _addressString) public pure returns (address) {
        bytes memory _addressBytes = bytes(_addressString);
        require(_addressBytes.length == 42, "Invalid address length");
        
        // Check for '0x' prefix
        require(_addressBytes[0] == '0' && _addressBytes[1] == 'x', "Address must start with 0x");
        
        uint160 _parsedAddress = 0;
        
        for (uint i = 2; i < 42; i++) {
            uint8 digit = uint8(_addressBytes[i]);
            
            // Convert hex character to value
            if (digit >= 48 && digit <= 57) {
                // 0-9
                digit -= 48;
            } else if (digit >= 65 && digit <= 70) {
                // A-F
                digit = digit - 65 + 10;
            } else if (digit >= 97 && digit <= 102) {
                // a-f
                digit = digit - 97 + 10;
            } else {
                revert("Invalid hex character in address");
            }
            
            _parsedAddress = _parsedAddress * 16 + uint160(digit);
        }
        
        return address(_parsedAddress);
    }
    
    // Utility function to log deployment information
    function logDeployment(string memory contractName, address contractAddress) public {
        console.log(string(abi.encodePacked("Deployed ", contractName, ": ", toAsciiString(contractAddress))));
    }
    
    // Utility function to convert address to string
    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(42);
        s[0] = '0';
        s[1] = 'x';
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2+2*i] = char(hi);
            s[2+2*i+1] = char(lo);            
        }
        return string(s);
    }
    
    // Helper for toAsciiString
    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
    
    // Helper to save deployment addresses to a file
    function saveDeploymentAddresses(
        address accessController,
        address seniorLPToken,
        address juniorLPToken,
        address trancheManager,
        address creditPool,
        string memory network
    ) public {
        string memory deploymentInfo = string(abi.encodePacked(
            "# ", network, " Deployment Addresses\n\n",
            "AccessController: ", toAsciiString(accessController), "\n",
            "SeniorLPToken: ", toAsciiString(seniorLPToken), "\n",
            "JuniorLPToken: ", toAsciiString(juniorLPToken), "\n",
            "TrancheManager: ", toAsciiString(trancheManager), "\n",
            "CreditPool: ", toAsciiString(creditPool), "\n",
            "\n# Deployment Timestamp: ", vm.toString(block.timestamp)
        ));
        
        // This will write to the filesystem when using forge script
        // Note: This only works in forge script execution, not in actual blockchain deployment
        vm.writeFile(
            string(abi.encodePacked("./deployments/", network, "-", vm.toString(block.timestamp), ".txt")),
            deploymentInfo
        );
    }
}
