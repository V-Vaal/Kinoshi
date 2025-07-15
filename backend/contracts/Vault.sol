// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./errors.sol";
import "./TokenRegistry.sol";
import "./interfaces/IPriceOracle.sol";

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

    // Registry des tokens autorisés
    TokenRegistry public immutable registry;

    // Oracle de prix pour la valorisation des actifs
    IPriceOracle public immutable oracle;

    // Adresse du receiver des frais de gestion
    address public feeReceiver;

    // Gestion des rôles
    mapping(address => bool) public isAdmin;
    mapping(address => bool) public isWhitelisted;

    event Deposited(address indexed user, uint256 amount);
    event WithdrawExecuted(address indexed user, address indexed receiver, uint256 assets);
    event AllocationsUpdated(address indexed admin);
    event ExitFeeApplied(address indexed user, uint256 assets, uint256 fee);
    event ManagementFeeAccrued(address indexed receiver, uint256 shares);

    /**
     * @notice Constructeur du Vault
     * @param asset_ Token sous-jacent (MockUSDC dans la V1)
     * @param label Nom de la stratégie associée à ce Vault (ex: "Équilibrée")
     * @param treasury_ Adresse du treasury pour le bootstrap et les frais
     * @param registry_ Registry des tokens autorisés
     * @param oracle_ Oracle de prix pour la valorisation des actifs
     */
    constructor(IERC20 asset_, string memory label, address treasury_, TokenRegistry registry_, IPriceOracle oracle_)
        ERC4626(asset_)
        ERC20("Kinoshi Vault Share", "KNSHVS")
        Ownable(msg.sender)
        Pausable()
        ReentrancyGuard()
    {
        strategyLabel = label;
        treasury = treasury_;
        registry = registry_;
        oracle = oracle_;
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
                if (!registry.isTokenRegistered(newAllocations[i].token)) revert TokenNotRegistered();
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
        if (totalSupply() > 0) revert VaultAlreadyBootstrapped();
        deposit(1e6, treasury); // 1 USDC (6 décimales)
    }

    /**
     * @notice Met à jour l'adresse du receiver des frais de gestion (owner only)
     * @param newReceiver Nouvelle adresse du receiver
     */
    function setFeeReceiver(address newReceiver) external onlyOwner {
        if (newReceiver == address(0)) revert ZeroAddress();
        feeReceiver = newReceiver;
    }

    /**
     * @notice Accrue des frais de gestion en mintant des parts (owner only)
     * @param shares Nombre de parts à mint pour les frais de gestion
     */
    function accrueManagementFee(uint256 shares) external onlyOwner {
        if (shares == 0) revert InvalidAmount();
        _mint(feeReceiver, shares);
        emit ManagementFeeAccrued(feeReceiver, shares);
    }

    /**
     * @notice Définit ou retire un admin (onlyOwner)
     * @param _addr Adresse à modifier
     * @param _status true pour ajouter, false pour retirer
     */
    function setAdmin(address _addr, bool _status) external onlyOwner {
        isAdmin[_addr] = _status;
    }

    /**
     * @notice Définit ou retire un utilisateur whitelisté (onlyOwner)
     * @param _addr Adresse à modifier
     * @param _status true pour ajouter, false pour retirer
     */
    function setWhitelisted(address _addr, bool _status) external onlyOwner {
        isWhitelisted[_addr] = _status;
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
     * @notice Calcule la valeur d'un actif en USDC via l'oracle
     * @param token Adresse du token
     * @param balance Balance du token dans le Vault
     * @return Valeur en USDC (6 décimales)
     */
    function _getAssetValue(address token, uint256 balance) internal view returns (uint256) {
        if (balance == 0) return 0;
        
        (uint256 price, uint8 priceDecimals) = oracle.getPrice(token);
        
        // Récupérer les décimales du token via le registry
        uint256 tokenDecimals = registry.getTokenDecimals(token);
        
        // Convertir le prix en USDC (6 décimales)
        // Formule: balance * price / (10^priceDecimals) * (10^6) / (10^tokenDecimals)
        if (priceDecimals >= 6 && tokenDecimals <= 6) {
            // Simplification: price / (10^(priceDecimals - 6)) * balance / (10^tokenDecimals)
            return (price / (10 ** (priceDecimals - 6))) * balance / (10 ** tokenDecimals);
        } else {
            // Calcul complet avec précision
            uint256 value = (balance * price) / (10 ** priceDecimals);
            return value * (10 ** 6) / (10 ** tokenDecimals);
        }
    }

    /**
     * @notice Retourne la valeur totale des actifs du Vault en USDC
     * @dev Calcule la somme pondérée des actifs alloués via l'oracle
     */
    function totalAssets() public view override returns (uint256) {
        uint256 totalValue = 0;
        
        // Parcourir toutes les allocations actives
        for (uint256 i = 0; i < allocations.length; i++) {
            AssetAllocation memory allocation = allocations[i];
            
            if (allocation.active) {
                uint256 balance = IERC20(allocation.token).balanceOf(address(this));
                uint256 assetValue = _getAssetValue(allocation.token, balance);
                
                // Appliquer la pondération (weight en 1e18)
                uint256 weightedValue = (assetValue * allocation.weight) / 1e18;
                totalValue += weightedValue;
            }
        }
        
        return totalValue;
    }

    function _decimalsOffset() internal pure override returns (uint8) {
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

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Not admin");
        _;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
