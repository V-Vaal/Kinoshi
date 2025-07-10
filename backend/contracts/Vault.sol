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
    mapping(uint256 => AssetAllocation[]) public strategyAllocations;

    // Mapping pour vérifier la whitelist
    mapping(uint256 => bool) public whitelistedStrategies;

    // Tableau pour stocker tous les IDs de stratégie
    uint256[] private strategyIds;

    event DepositWithStrategy(address indexed user, uint256 strategyId, uint256 amount);
    event WithdrawExecuted(address indexed user, address indexed receiver, uint256 assets);

    // Constructeur : initialisation ERC4626 avec MockUSDC comme asset()
    constructor(IERC20 asset_)
        ERC4626(asset_)
        ERC20("Kinoshi Vault Share", "KNSHVS")
        Ownable(msg.sender)
        Pausable()
        ReentrancyGuard()
    {}

    /**
     * @dev Retourne la liste complète des IDs de stratégie actuellement enregistrés
     * @return Tableau contenant tous les strategyId actuellement whitelistés
     */
    function getStrategyIds() external view returns (uint256[] memory) {
        return strategyIds;
    }

    // Ajout d'une stratégie (owner only)
    function setStrategyAllocations(uint256 strategyId, AssetAllocation[] memory allocations) external onlyOwner {
        delete strategyAllocations[strategyId];

        uint256 totalWeight;
        for (uint256 i = 0; i < allocations.length; i++) {
            if (allocations[i].token == address(0)) revert ZeroAddress();
            strategyAllocations[strategyId].push(allocations[i]);
            if (allocations[i].active) {
                totalWeight += allocations[i].weight;
            }
        }

        if (totalWeight != 1e18) revert InvalidWeightSum();
        
        // Ajouter l'ID à la liste s'il n'existe pas déjà
        if (!whitelistedStrategies[strategyId]) {
            strategyIds.push(strategyId);
        }
        whitelistedStrategies[strategyId] = true;
    }

    // Suppression d'une stratégie (owner only)
    function removeStrategy(uint256 strategyId) external onlyOwner {
        delete strategyAllocations[strategyId];
        whitelistedStrategies[strategyId] = false;
        
        // Retirer l'ID de la liste
        for (uint256 i = 0; i < strategyIds.length; i++) {
            if (strategyIds[i] == strategyId) {
                strategyIds[i] = strategyIds[strategyIds.length - 1];
                strategyIds.pop();
                break;
            }
        }
    }

    // Dépôt avec choix de stratégie
    function deposit(uint256 assets, address receiver, uint256 strategyId)
        public
        whenNotPausedCustom
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
        whenNotPausedCustom
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
        whenNotPausedCustom
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

    // Décalage de décimales pour ERC4626 (MockUSDC 6 décimales, shares 18 décimales)
    function _decimalsOffset() internal view override returns (uint8) {
        return 12;
    }

    // receive et fallback : revert explicite avec custom error
    receive() external payable {
        revert EtherNotAccepted();
    }

    fallback() external payable {
        revert EtherNotAccepted();
    }

    // Surcharge du modificateur whenNotPaused pour utiliser la custom error
    modifier whenNotPausedCustom() {
        if (paused()) revert Pausable__Paused();
        _;
    }

    // Pause/unpause (owner only)
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}