// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {LabToken} from "../src/LabToken.sol";

contract TokenActor {
    function approve(LabToken token, address spender, uint256 amount) external returns (bool) {
        return token.approve(spender, amount);
    }
}

contract LabTokenTest {
    LabToken internal token;
    TokenActor internal alice;
    address internal bob = address(0xB0B);

    function setUp() public {
        token = new LabToken("TrautsLab Token", "TLAB", 1_000_000);
        alice = new TokenActor();
    }

    function testInitialSupplyBelongsToDeployer() public {
        assertEq(token.totalSupply(), 1_000_000 ether);
        assertEq(token.balanceOf(address(this)), 1_000_000 ether);
    }

    function testTransferMovesBalance() public {
        assertTrue(token.transfer(address(alice), 100 ether));
        assertEq(token.balanceOf(address(alice)), 100 ether);
        assertEq(token.balanceOf(address(this)), 999_900 ether);
    }

    function testApproveAndTransferFrom() public {
        token.transfer(address(alice), 250 ether);

        assertTrue(alice.approve(token, address(this), 50 ether));

        assertTrue(token.transferFrom(address(alice), bob, 40 ether));

        assertEq(token.balanceOf(bob), 40 ether);
        assertEq(token.allowance(address(alice), address(this)), 10 ether);
    }

    function testRevertWhenAllowanceIsTooSmall() public {
        token.transfer(address(alice), 10 ether);

        alice.approve(token, address(this), 1 ether);

        try token.transferFrom(address(alice), bob, 2 ether) returns (bool ok) {
            require(!ok, "transferFrom should fail");
        } catch {
            return;
        }

        revert("expected insufficient allowance revert");
    }

    function testFuzzTransferPreservesTotalSupply(uint256 rawAmount) public {
        uint256 amount = (rawAmount % token.balanceOf(address(this))) + 1;
        uint256 supplyBefore = token.totalSupply();

        token.transfer(address(alice), amount);

        assertEq(token.totalSupply(), supplyBefore);
        assertEq(token.balanceOf(address(this)) + token.balanceOf(address(alice)), supplyBefore);
    }

    function assertTrue(bool value) internal pure {
        require(value, "expected true");
    }

    function assertEq(uint256 actual, uint256 expected) internal pure {
        require(actual == expected, "uint256 mismatch");
    }
}
