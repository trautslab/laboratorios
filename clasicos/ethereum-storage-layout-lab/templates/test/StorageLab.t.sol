// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {StorageLab} from "../src/StorageLab.sol";

contract StorageLabTest {
    function testInitialStateAndPacking() public {
        StorageLab lab = new StorageLab();
        require(lab.owner() == address(this), "owner");
        require(lab.counter() == 7, "counter");
        require(lab.enabled(), "enabled");
        require(lab.mode() == 42, "mode");
        require(lab.credits(address(this)) == 100, "credits");

        // Slot 0: owner (bytes 0..19) + counter (bytes 20..31).
        bytes32 expectedSlot0 = bytes32((uint256(7) << 160) | uint256(uint160(address(this))));
        require(lab.rawSlot(0) == expectedSlot0, "slot 0 packs owner + counter");

        // Slot 1: enabled (byte 0) + mode (bytes 1..2).
        bytes32 expectedSlot1 = bytes32((uint256(42) << 8) | uint256(1));
        require(lab.rawSlot(1) == expectedSlot1, "slot 1 packs enabled + mode");

        // Slot 2 is the mapping marker; the value lives at keccak256(key . slot).
        require(lab.rawSlot(2) == bytes32(0), "mapping marker slot stays empty");
        uint256 creditSlot = uint256(keccak256(abi.encode(address(this), uint256(2))));
        require(uint256(lab.rawSlot(creditSlot)) == 100, "credits[deployer] at keccak slot");
    }
}
