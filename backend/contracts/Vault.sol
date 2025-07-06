// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Vault is ERC4626 {
    constructor(ERC20 asset_)
        ERC4626(asset_)
        ERC20("OneToken Vault Share", "1TVS")
    {}
    // Les événements importants seront ajoutés selon la logique métier
} 
