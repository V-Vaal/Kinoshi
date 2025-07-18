// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

error InvalidAmount();
error InvalidStrategy();
error NotOwner();
error InvalidWeightSum();
error VaultPaused();
error ZeroAddress();
error EtherNotAccepted();
error Pausable__Paused();
error InvalidSymbol();
error TokenAlreadyRegistered();
error TokenNotRegistered();
error VaultAlreadyBootstrapped();
error PriceNotSet(); 
error MinimumDepositNotMet(uint256 min);
error MinimumWithdrawNotMet(uint256 min);
error MinimumRedeemNotMet(uint256 min);
error ManagementFeeCooldownNotMet();
error ManagementFeeNotConfigured(); 