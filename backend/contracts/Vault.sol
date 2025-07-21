/// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./errors.sol";
import "./TokenRegistry.sol";
import "./interfaces/IPriceOracle.sol";

/**
 * @title Vault
 * @author Kinoshi Team
 * @notice Vault ERC4626 pour l'investissement dans des actifs réels (RWA)
 * @dev Ce contrat implémente un vault de type ERC4626 avec allocation automatique
 * selon stratégie équilibrée (50% BTC, 20% Equity, 20% Gold, 10% Bonds)
 * vers différents actifs réels. Il gère les frais de sortie et de gestion,
 * et utilise un oracle de prix mocked pour les conversions.
 */
interface IERC20MintableBurnable {
    function burn(address from, uint256 amount) external;
    function mint(address to, uint256 amount) external;
}

contract Vault is ERC4626, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /**
     * @notice Structure définissant l'allocation d'un actif
     * @param token Adresse du token RWA
     * @param weight Poids de l'allocation (en base 1e18)
     * @param active Statut actif/inactif de l'allocation
     */
    struct AssetAllocation {
        address token;
        uint256 weight;
        bool active;
    }

    AssetAllocation[] public allocations;
    string public strategyLabel;

    uint256 public constant MAX_FEE_BPS = 1000; // 10% maximum
    uint256 public exitFeeBps;
    uint256 public managementFeeBps;

    address public immutable treasury;
    TokenRegistry public immutable registry;
    IPriceOracle public immutable oracle;
    address public feeReceiver;

    uint256 public lastManagementFeeTimestamp;
    uint256 public constant MANAGEMENT_FEE_COOLDOWN = 1 days;

    event Deposited(address indexed user, uint256 amount);
    event WithdrawExecuted(address indexed user, address indexed receiver, uint256 assets);
    event AllocationsUpdated(address indexed admin);
    event ExitFeeApplied(address indexed user, uint256 assets, uint256 fee);
    event ManagementFeeAccrued(address indexed receiver, uint256 shares);
    event Allocated(address indexed token, uint256 amount);
    event FeesUpdated(uint256 exitFeeBps, uint256 managementFeeBps);
    event VaultBootstrapped(uint256 assets, uint256 shares);
    event ManagementFeeScheduled(uint256 timestamp, uint256 shares, uint256 totalSupply);

    /**
     * @notice Constructeur du vault
     * @param asset_ Token de base du vault (généralement USDC)
     * @param label Label de la stratégie d'investissement
     * @param treasury_ Adresse du trésor pour recevoir les frais
     * @param registry_ Registre des tokens autorisés
     * @param oracle_ Oracle de prix pour les conversions
     */
    constructor(IERC20 asset_, string memory label, address treasury_, TokenRegistry registry_, IPriceOracle oracle_)
        ERC4626(asset_)
        ERC20("Kinoshi Vault Medium", "KSHMD")
        AccessControl()
        Pausable()
        ReentrancyGuard()
    {
        if (treasury_ == address(0)) revert ZeroAddress();
        if (address(registry_) == address(0)) revert ZeroAddress();
        if (address(oracle_) == address(0)) revert ZeroAddress();

        strategyLabel = label;
        treasury = treasury_;
        registry = registry_;
        oracle = oracle_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Définit les allocations d'actifs du vault
     * @param newAllocations Tableau des nouvelles allocations
     * @dev Les poids doivent sommer à 1e18 (100%)
     * @dev Seuls les tokens enregistrés dans le registry sont autorisés
     */
    function setAllocations(AssetAllocation[] memory newAllocations) external onlyRole(ADMIN_ROLE) {
        require(newAllocations.length > 0, "Allocations cannot be empty");
        delete allocations;
        uint256 totalWeight;
        for (uint256 i = 0; i < newAllocations.length; i++) {
            if (newAllocations[i].token == address(0)) revert ZeroAddress();
            allocations.push(newAllocations[i]);
            if (newAllocations[i].active) {
                if (!registry.isTokenRegistered(newAllocations[i].token)) revert TokenNotRegistered();
                totalWeight += newAllocations[i].weight;
            }
        }
        if (totalWeight != 1e18) revert InvalidWeightSum();
        emit AllocationsUpdated(msg.sender);
    }

    /**
     * @notice Retourne les allocations d'actifs actuelles
     * @return Tableau des allocations d'actifs
     */
    function getAllocations() external view returns (AssetAllocation[] memory) {
        return allocations;
    }

    /**
     * @notice Définit les frais du vault
     * @param _exitFeeBps Frais de sortie en basis points (max 1000 = 10%)
     * @param _managementFeeBps Frais de gestion en basis points (max 1000 = 10%)
     */
    function setFees(uint256 _exitFeeBps, uint256 _managementFeeBps) external onlyRole(ADMIN_ROLE) {
        require(_exitFeeBps <= MAX_FEE_BPS, "Exit fee too high");
        require(_managementFeeBps <= MAX_FEE_BPS, "Management fee too high");
        exitFeeBps = _exitFeeBps;
        managementFeeBps = _managementFeeBps;
        emit FeesUpdated(_exitFeeBps, _managementFeeBps);
    }

    /**
     * @notice Initialise le vault avec un montant de base
     * @dev Peut être appelé une seule fois par l'admin principal
     * @dev Mint 1 token de base pour initialiser le vault
     */
    function bootstrapVault() external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (totalSupply() > 0) revert VaultAlreadyBootstrapped();
        uint256 amount = 1e18; // 1 token en 18 décimales (standard ERC4626)
        IERC20(asset()).safeTransferFrom(treasury, address(this), amount);
        require(IERC20(asset()).balanceOf(address(this)) >= amount, "Transfer failed");
        uint256 shares = amount; // Plus besoin de conversion, déjà en 18 décimales
        _mint(treasury, shares);
        emit VaultBootstrapped(amount, shares);
        emit Deposited(treasury, amount);
    }

    /**
     * @notice Définit le receveur des frais de gestion
     * @param newReceiver Nouvelle adresse receveur des frais
     */
    function setFeeReceiver(address newReceiver) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newReceiver == address(0)) revert ZeroAddress();
        feeReceiver = newReceiver;
    }

    /**
     * @notice Calcule les frais de gestion actuels
     * @return Montant des frais de gestion en shares
     */
    function calculateManagementFee() external view returns (uint256) {
        if (managementFeeBps == 0 || totalSupply() == 0) return 0;
        return (totalSupply() * managementFeeBps) / 10_000;
    }

    /**
     * @notice Accrédite manuellement les frais de gestion
     * @param shares Nombre de shares à accréditer
     */
    function accrueManagementFee(uint256 shares) external onlyRole(ADMIN_ROLE) {
        _accrueManagementFee(shares);
    }

    /**
     * @notice Planifie l'accréditation des frais de gestion
     * @dev Vérifie le cooldown et calcule automatiquement les frais
     */
    function scheduleManagementFee() external onlyRole(ADMIN_ROLE) {
        if (feeReceiver == address(0)) revert ZeroAddress();
        if (managementFeeBps == 0) revert ManagementFeeNotConfigured();
        uint256 feeShares = this.calculateManagementFee();
        if (feeShares == 0) revert InvalidAmount();
        _accrueManagementFee(feeShares);
    }

    /**
     * @notice Fonction interne pour accréditer les frais de gestion
     * @param shares Nombre de shares à accréditer
     * @dev Vérifie le cooldown et mint les shares au receveur
     */
    function _accrueManagementFee(uint256 shares) internal {
        if (shares == 0) revert InvalidAmount();
        if (feeReceiver == address(0)) revert ZeroAddress();
        if (lastManagementFeeTimestamp > 0 && block.timestamp < lastManagementFeeTimestamp + MANAGEMENT_FEE_COOLDOWN) {
            revert ManagementFeeCooldownNotMet();
        }
        lastManagementFeeTimestamp = block.timestamp;
        _mint(feeReceiver, shares);
        emit ManagementFeeAccrued(feeReceiver, shares);
        emit ManagementFeeScheduled(block.timestamp, shares, totalSupply());
    }

    /**
     * @notice Gère les permissions admin
     * @param _addr Adresse à modifier
     * @param _status Nouveau statut admin
     */
    function setAdmin(address _addr, bool _status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_status) {
            _grantRole(ADMIN_ROLE, _addr);
        } else {
            _revokeRole(ADMIN_ROLE, _addr);
        }
    }

    /**
     * @notice Dépôt dans le vault avec allocation automatique
     * @param assets Montant d'actifs à déposer
     * @param receiver Adresse recevant les shares
     * @return Nombre de shares mintées
     * @dev Alloue automatiquement les fonds selon la stratégie définie
     */
    function deposit(uint256 assets, address receiver) public whenNotPausedCustom override returns (uint256) {
        if (assets == 0) revert InvalidAmount();
        uint256 shares = super.deposit(assets, receiver);
        emit Deposited(receiver, assets);
        _mockAllocate(assets);
        return shares;
    }

    /**
     * @notice Alloue les fonds selon la stratégie définie
     * @param assets Montant d'actifs à allouer
     * @dev Convertit les actifs en tokens RWA selon les prix de l'oracle
     */
    function _mockAllocate(uint256 assets) internal {
        // assets est déjà en 18 décimales (tous les tokens standardisés)
        for (uint256 i = 0; i < allocations.length; i++) {
            AssetAllocation memory allocation = allocations[i];
            if (!allocation.active || allocation.token == asset()) continue;
            
            // Calculer l'allocation (tous les tokens en 18 décimales)
            uint256 allocationAmount = (assets * allocation.weight) / 1e18;
            
            // Plus besoin de conversion, tous les tokens ont 18 décimales
             (uint256 price, ) = oracle.getPrice(allocation.token);
             uint256 rwaAmount = (allocationAmount * 1e18) / price;
            
            // Mint les RWA
            (bool success, ) = allocation.token.call(
                abi.encodeWithSignature("mint(address,uint256)", address(this), rwaAmount)
            );
            require(success, "Mint RWA failed");
            emit Allocated(allocation.token, rwaAmount);
        }
    }

    /**
     * @notice Fonction de retrait non supportée
     * @dev Utilisez redeem() à la place
     */
    function withdraw(uint256, address, address) public pure override returns (uint256) {
        revert WithdrawNotSupported();
    }

    /**
     * @notice Rembourse les shares contre les actifs sous-jacents
     * @param shares Nombre de shares à rembourser
     * @param receiver Adresse recevant les actifs
     * @param owner Propriétaire des shares
     * @return Montant d'actifs remboursés
     * @dev Applique les frais de sortie et burn les tokens RWA correspondants
     */
    function redeem(uint256 shares, address receiver, address owner) public whenNotPausedCustom nonReentrant override returns (uint256) {
        if (shares == 0) revert InvalidAmount();
        uint256 assets = convertToAssets(shares);

        uint256 fee = (assets * exitFeeBps) / 10_000;
        uint256 assetsAfterFee = assets - fee;

        _burn(owner, shares);

        for (uint256 i = 0; i < allocations.length; i++) {
            AssetAllocation memory allocation = allocations[i];
            if (!allocation.active || allocation.token == asset()) continue;
            
            // Calculer l'allocation (tous les tokens en 18 décimales)
            uint256 allocationAmount = (assets * allocation.weight) / 1e18;
            
            // Calculer la quantité de tokens RWA selon le prix (comme dans _mockAllocate)
            (uint256 price, ) = oracle.getPrice(allocation.token);
            uint256 rwaAmount = (allocationAmount * 1e18) / price;
            
            IERC20MintableBurnable(allocation.token).burn(address(this), rwaAmount);
        }

        IERC20MintableBurnable(address(asset())).mint(receiver, assetsAfterFee);

        if (fee > 0) {
            IERC20MintableBurnable(address(asset())).mint(treasury, fee);
            emit ExitFeeApplied(owner, assets, fee);
        }

        emit WithdrawExecuted(owner, receiver, assetsAfterFee);
        return assetsAfterFee;
    }

    /**
     * @notice Calcule la valeur d'un actif en tokens de base
     * @param token Adresse du token
     * @param balance Balance du token
     * @return Valeur en tokens de base (18 décimales)
     */
    function _getAssetValue(address token, uint256 balance) internal view returns (uint256) {
        if (balance == 0) return 0;
        (uint256 price, ) = oracle.getPrice(token);
        // Plus besoin de conversion, tous les tokens ont 18 décimales
        uint256 valueIn18Decimals = (balance * price) / 1e18;
        return valueIn18Decimals; // Déjà en 18 décimales
    }

    /**
     * @notice Calcule la valeur totale des actifs du vault
     * @return Valeur totale en tokens de base
     * @dev Utilise l'oracle pour convertir tous les actifs en valeur de base
     */
    function totalAssets() public view override returns (uint256) {
        uint256 totalValue = 0;
        for (uint256 i = 0; i < allocations.length; i++) {
            AssetAllocation memory allocation = allocations[i];
            if (allocation.active) {
                uint256 balance = IERC20(allocation.token).balanceOf(address(this));
                uint256 assetValue = _getAssetValue(allocation.token, balance);
                totalValue += assetValue;

            }
        }
        return totalValue;
    }

    /**
     * @notice Reçoit les ethers (non supporté)
     */
    receive() external payable {
        revert EtherNotAccepted();
    }

    /**
     * @notice Fallback function (non supporté)
     */
    fallback() external payable {
        revert EtherNotAccepted();
    }

    /**
     * @notice Modifier pour vérifier que le vault n'est pas en pause
     */
    modifier whenNotPausedCustom() {
        if (paused()) revert Pausable__Paused();
        _;
    }

    /**
     * @notice Met le vault en pause
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Reprend le vault après pause
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
