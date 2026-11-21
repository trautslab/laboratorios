// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract StorageLab {
    address public owner;
    uint96 public counter;
    bool public enabled;
    uint16 public mode;
    mapping(address => uint256) public credits;

    constructor() {
        owner = msg.sender;
        counter = 7;
        enabled = true;
        mode = 42;
        credits[msg.sender] = 100;
    }

    function rawSlot(uint256 slot) external view returns (bytes32 value) {
        assembly {
            value := sload(slot)
        }
    }
}

// Deliberately incompatible with StorageLab: do not use as an upgrade.
contract StorageLabUnsafeV2 {
    uint256 public counter;
    address public owner;
    bool public enabled;
    uint16 public mode;
    mapping(address => uint256) public credits;
}
