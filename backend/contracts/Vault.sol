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

    // Allocation de la stratégie unique du Vault
    AssetAllocation[] public allocations;

    // Label de la stratégie pour identification (ex : "Équilibrée", "Agressive")
    string public strategyLabel;

    // Frais de sortie en basis points (1 BPS = 0.01%)
    uint256 public constant MAX_FEE_BPS = 1000; // 10%
    uint256 public exitFeeBps;

    // Adresse du treasury pour le bootstrap et les frais
    address public immutable treasury;

    event Deposited(address indexed user, uint256 amount);
    event WithdrawExecuted(address indexed user, address indexed receiver, uint256 assets);
    event AllocationsUpdated(address indexed admin);
    event ExitFeeApplied(address indexed user, uint256 assets, uint256 fee);

    /**
     * @notice Constructeur du Vault
     * @param asset_ Token sous-jacent (MockUSDC dans la V1)
     * @param label Nom de la stratégie associée à ce Vault (ex: "Équilibrée")
     * @param treasury_ Adresse du treasury pour le bootstrap et les frais
     */
    constructor(IERC20 asset_, string memory label, address treasury_)
        ERC4626(asset_)
        ERC20("Kinoshi Vault Share", "KNSHVS")
        Ownable(msg.sender)
        Pausable()
        ReentrancyGuard()
    {
        strategyLabel = label;
        treasury = treasury_;
    }

    /**
     * @notice Met à jour l'allocation de la stratégie du Vault (owner only)
     * @param newAllocations Liste des nouveaux actifs pondérés
     */
    function setAllocations(AssetAllocation[] memory newAllocations) external onlyOwner {
        require(newAllocations.length > 0, "Allocations cannot be empty");

        delete allocations;

        uint256 totalWeight;
        for (uint256 i = 0; i < newAllocations.length; i++) {
            if (newAllocations[i].token == address(0)) revert ZeroAddress();
            allocations.push(newAllocations[i]);
            if (newAllocations[i].active) {
                totalWeight += newAllocations[i].weight;
            }
        }

        if (totalWeight != 1e18) revert InvalidWeightSum();

        emit AllocationsUpdated(msg.sender);
    }

    /**
     * @notice Retourne l'allocation actuelle
     */
    function getAllocations() external view returns (AssetAllocation[] memory) {
        return allocations;
    }

    /**
     * @notice Met à jour les frais de sortie (owner only)
     * @param newFeeBps Nouveaux frais en basis points (max 1000 = 10%)
     */
    function setExitFeeBps(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= MAX_FEE_BPS, "Fee exceeds maximum");
        exitFeeBps = newFeeBps;
    }

    /**
     * @notice Bootstrap le Vault avec 1 USDC vers le treasury (owner only, une seule fois)
     * @dev Évite les dépôts à taux arbitraire quand totalSupply == 0
     */
    function bootstrapVault() external onlyOwner {
        require(totalSupply() == 0, "Vault already bootstrapped");
        deposit(1e6, treasury); // 1 USDC (6 décimales)
    }

    /**
     * @notice Dépôt d'USDC avec mint de parts ERC4626
     */
    function deposit(uint256 assets, address receiver)
        public
        whenNotPausedCustom
        override
        returns (uint256)
    {
        if (assets == 0) revert InvalidAmount();

        uint256 shares = super.deposit(assets, receiver);
        emit Deposited(receiver, assets);
        return shares;
    }

    /**
     * @notice Retrait par burn de parts (withdraw)
     */
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

    /**
     * @notice Retrait par échange de parts (redeem) avec frais de sortie
     */
    function redeem(uint256 shares, address receiver, address owner)
        public
        whenNotPausedCustom
        nonReentrant
        override
        returns (uint256)
    {
        if (shares == 0) revert InvalidAmount();
        
        // Calculer les assets avant les frais
        uint256 assets = super.convertToAssets(shares);
        
        // Calculer les frais
        uint256 fee = (assets * exitFeeBps) / 10_000;
        uint256 assetsAfterFee = assets - fee;
        
        // Burn les parts via super.redeem()
        super.redeem(shares, address(this), owner);
        
        // Transférer les assets après frais au receiver
        IERC20(asset()).transfer(receiver, assetsAfterFee);
        
        // Transférer les frais au treasury
        if (fee > 0) {
            IERC20(asset()).transfer(treasury, fee);
            emit ExitFeeApplied(owner, assets, fee);
        }
        
        return assetsAfterFee;
    }

    /**
     * @notice Retourne le solde d'USDC détenu dans le Vault
     */
    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }

    function _decimalsOffset() internal view override returns (uint8) {
        return 12;
    }

    receive() external payable {
        revert EtherNotAccepted();
    }

    fallback() external payable {
        revert EtherNotAccepted();
    }

    modifier whenNotPausedCustom() {
        if (paused()) revert Pausable__Paused();
        _;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
