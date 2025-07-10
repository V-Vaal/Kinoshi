// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockBTC is ERC20 {
    uint8 private immutable _customDecimals;

    constructor() ERC20("Mock Bitcoin", "mBTC") {
        _customDecimals = 8; // 8 décimales pour BTC
    }

    function decimals() public view override returns (uint8) {
        return _customDecimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
} 