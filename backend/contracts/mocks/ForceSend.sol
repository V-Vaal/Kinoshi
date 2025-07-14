// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ForceSend
 * @notice Permet d'envoyer de l'ETH de force via selfdestruct (DoS test)
 */
contract ForceSend {
    constructor() payable {}

    function forceSend(address payable target) external {
        selfdestruct(target);
    }
}
