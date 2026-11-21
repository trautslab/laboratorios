// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IVault, VulnerableVault, SafeVault, ReentrantAttacker} from "../src/ReentrancyLab.sol";

contract ReentrancyLabTest {
    function testAttackDrainsVulnerableVault() public {
        VulnerableVault vault = new VulnerableVault();
        vault.deposit{value: 3 ether}();
        ReentrantAttacker attacker = new ReentrantAttacker(IVault(address(vault)));
        attacker.attack{value: 1 ether}();
        require(address(vault).balance == 0, "attack evidence");
        require(address(attacker).balance == 4 ether, "drained balance");
    }

    function testSafeVaultPreservesOtherDeposits() public {
        SafeVault vault = new SafeVault();
        vault.deposit{value: 3 ether}();
        ReentrantAttacker attacker = new ReentrantAttacker(IVault(address(vault)));
        try attacker.attack{value: 1 ether}() {
            revert("attack on SafeVault should revert");
        } catch {}
        require(address(vault).balance == 3 ether, "safe balance");
        require(vault.balances(address(this)) == 3 ether, "victim deposit intact");
        require(address(attacker).balance == 0, "attacker got nothing");
    }

    receive() external payable {}
}
