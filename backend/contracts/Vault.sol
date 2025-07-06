// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./errors.sol";

contract Vault is ERC4626, Ownable, Pausable, ReentrancyGuard {
    struct AssetAllocation {
        address token;
        uint256 weight;
        bool active;
    }

    // Mapping des stratégies : id => allocations
    mapping(string => AssetAllocation[]) public strategies;

    // Mapping pour vérifier la whitelist
    mapping(string => bool) public whitelistedStrategies;

    event DepositWithStrategy(address indexed user, string strategyId, uint256 amount);
    event WithdrawExecuted(address indexed user, address indexed receiver, uint256 assets);

    // Constructeur : initialisation ERC4626 avec MockUSDC comme asset()
    constructor(IERC20 asset_)
        ERC4626(asset_)
        ERC20("OneToken Vault Share", "1TVS")
        Ownable(msg.sender)
        Pausable()
        ReentrancyGuard()
    {}

    // Ajout d'une stratégie (owner only)
    function addStrategy(string memory strategyId, AssetAllocation[] memory allocations) external onlyOwner {
        if (bytes(strategyId).length == 0) revert InvalidStrategy();

        delete strategies[strategyId];

        uint256 totalWeight;
        for (uint256 i = 0; i < allocations.length; i++) {
            if (allocations[i].token == address(0)) revert ZeroAddress();
            strategies[strategyId].push(allocations[i]);
            if (allocations[i].active) {
                totalWeight += allocations[i].weight;
            }
        }

        if (totalWeight != 1e18) revert InvalidWeightSum();
        whitelistedStrategies[strategyId] = true;
    }

    // Suppression d'une stratégie (owner only)
    function removeStrategy(string memory strategyId) external onlyOwner {
        delete strategies[strategyId];
        whitelistedStrategies[strategyId] = false;
    }

    // Dépôt avec choix de stratégie
    function deposit(uint256 assets, address receiver, string memory strategyId)
        public
        whenNotPaused
        returns (uint256)
    {
        if (!whitelistedStrategies[strategyId]) revert InvalidStrategy();
        if (assets == 0) revert InvalidAmount();

        uint256 shares = super.deposit(assets, receiver);
        emit DepositWithStrategy(receiver, strategyId, assets);
        return shares;
    }

    // Retrait classique ERC-4626
    function withdraw(uint256 assets, address receiver, address owner)
        public
        whenNotPaused
        nonReentrant
        override
        returns (uint256)
    {
        if (assets == 0) revert InvalidAmount();

        uint256 shares = super.withdraw(assets, receiver, owner);
        emit WithdrawExecuted(owner, receiver, assets);
        return shares;
    }

    // Redeem avec protection reentrancy
    function redeem(uint256 shares, address receiver, address owner)
        public
        whenNotPaused
        nonReentrant
        override
        returns (uint256)
    {
        if (shares == 0) revert InvalidAmount();
        return super.redeem(shares, receiver, owner);
    }

    // totalAssets : balance du MockUSDC détenu par le Vault
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }

    // Conversion assets <-> shares (ratio 1:1 initial)
    function convertToAssets(uint256 shares) public view override returns (uint256) {
        return super.convertToAssets(shares);
    }

    function convertToShares(uint256 assets) public view override returns (uint256) {
        return super.convertToShares(assets);
    }

    // receive et fallback : revert explicite
    receive() external payable {
        revert();
    }

    fallback() external payable {
        revert();
    }

    // Pause/unpause (owner only)
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}