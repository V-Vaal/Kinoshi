// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockBonds is ERC20 {
    uint8 private immutable _customDecimals;

    constructor() ERC20("Mock Bonds", "mBONDS") {
        _customDecimals = 18; // 18 décimales pour les obligations
    }

    function decimals() public view override returns (uint8) {
        return _customDecimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
} 