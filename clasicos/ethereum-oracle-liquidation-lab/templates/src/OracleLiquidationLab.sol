// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockPriceFeed {
    uint256 public price;
    uint256 public updatedAt;
    function set(uint256 price_, uint256 updatedAt_) external { price = price_; updatedAt = updatedAt_; }
}

contract LendingFixture {
    MockPriceFeed public immutable feed;
    uint256 public constant MAX_AGE = 1 hours;
    mapping(address => uint256) public collateral;
    mapping(address => uint256) public debt;

    constructor(MockPriceFeed feed_) { feed = feed_; }
    function position(address user, uint256 collateral_, uint256 debt_) external {
        collateral[user] = collateral_;
        debt[user] = debt_;
    }
    function healthAt(address user, uint256 observedAt) public view returns (uint256) {
        require(observedAt >= feed.updatedAt(), "future price");
        require(observedAt - feed.updatedAt() <= MAX_AGE, "stale price");
        if (debt[user] == 0) return type(uint256).max;
        return collateral[user] * feed.price() * 100 / debt[user];
    }
    function health(address user) public view returns (uint256) { return healthAt(user, block.timestamp); }
    function liquidatable(address user) external view returns (bool) { return health(user) < 150; }
}
