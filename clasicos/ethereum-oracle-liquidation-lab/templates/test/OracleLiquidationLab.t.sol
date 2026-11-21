// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {MockPriceFeed, LendingFixture} from "../src/OracleLiquidationLab.sol";

contract OracleLiquidationLabTest {
    function testPriceChangesLiquidationDecision() public {
        MockPriceFeed feed = new MockPriceFeed();
        LendingFixture lending = new LendingFixture(feed);
        lending.position(address(this), 2, 200);
        feed.set(200, block.timestamp);
        require(!lending.liquidatable(address(this)), "healthy");
        feed.set(100, block.timestamp);
        require(lending.liquidatable(address(this)), "liquidatable");
    }

    function testStalePriceReverts() public {
        MockPriceFeed feed = new MockPriceFeed();
        LendingFixture lending = new LendingFixture(feed);
        lending.position(address(this), 2, 200);
        feed.set(200, 0);
        (bool ok,) = address(lending).call(abi.encodeCall(lending.healthAt, (address(this), 4001)));
        require(!ok, "stale price must fail closed");
    }
}
