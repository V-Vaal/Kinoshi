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

interface IERC20MintableBurnable {
    function burn(address from, uint256 amount) external;
    function mint(address to, uint256 amount) external;
}

contract Vault is ERC4626, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct AssetAllocation {
        address token;
        uint256 weight;
        bool active;
    }

    AssetAllocation[] public allocations;
    string public strategyLabel;

    uint256 public constant MAX_FEE_BPS = 1000;
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

    constructor(IERC20 asset_, string memory label, address treasury_, TokenRegistry registry_, IPriceOracle oracle_)
        ERC4626(asset_)
        ERC20("Kinoshi Vault Share", "KNSHVS")
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

    function normalizeAmount(uint256 amount, uint8 decimals) internal pure returns (uint256) {
        return decimals == 18 ? amount : decimals < 18 ? amount * (10 ** (18 - decimals)) : amount / (10 ** (decimals - 18));
    }

    function denormalizeAmount(uint256 amount, uint8 decimals) internal pure returns (uint256) {
        return decimals == 18 ? amount : decimals < 18 ? amount / (10 ** (18 - decimals)) : amount * (10 ** (decimals - 18));
    }

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

    function getAllocations() external view returns (AssetAllocation[] memory) {
        return allocations;
    }

    function setFees(uint256 _exitFeeBps, uint256 _managementFeeBps) external onlyRole(ADMIN_ROLE) {
        require(_exitFeeBps <= MAX_FEE_BPS, "Exit fee too high");
        require(_managementFeeBps <= MAX_FEE_BPS, "Management fee too high");
        exitFeeBps = _exitFeeBps;
        managementFeeBps = _managementFeeBps;
        emit FeesUpdated(_exitFeeBps, _managementFeeBps);
    }

    function bootstrapVault() external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (totalSupply() > 0) revert VaultAlreadyBootstrapped();
        uint256 amount = 200e6;
        IERC20(asset()).safeTransferFrom(treasury, address(this), amount);
        require(IERC20(asset()).balanceOf(address(this)) >= amount, "Transfer failed");
        uint256 shares = normalizeAmount(amount, 6);
        _mint(treasury, shares);
        emit VaultBootstrapped(amount, shares);
        emit Deposited(treasury, amount);
    }

    function setFeeReceiver(address newReceiver) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newReceiver == address(0)) revert ZeroAddress();
        feeReceiver = newReceiver;
    }

    function calculateManagementFee() external view returns (uint256) {
        if (managementFeeBps == 0 || totalSupply() == 0) return 0;
        return (totalSupply() * managementFeeBps) / 10_000;
    }

    function accrueManagementFee(uint256 shares) external onlyRole(ADMIN_ROLE) {
        _accrueManagementFee(shares);
    }

    function scheduleManagementFee() external onlyRole(ADMIN_ROLE) {
        if (feeReceiver == address(0)) revert ZeroAddress();
        if (managementFeeBps == 0) revert ManagementFeeNotConfigured();
        uint256 feeShares = this.calculateManagementFee();
        if (feeShares == 0) revert InvalidAmount();
        _accrueManagementFee(feeShares);
    }

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

    function setAdmin(address _addr, bool _status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_status) {
            _grantRole(ADMIN_ROLE, _addr);
        } else {
            _revokeRole(ADMIN_ROLE, _addr);
        }
    }

    function deposit(uint256 assets, address receiver) public whenNotPausedCustom override returns (uint256) {
        if (assets == 0) revert InvalidAmount();
        uint256 shares = super.deposit(assets, receiver);
        emit Deposited(receiver, assets);

        for (uint256 i = 0; i < allocations.length; i++) {
            AssetAllocation memory allocation = allocations[i];
            if (!allocation.active || allocation.token == asset()) continue;
            uint256 normalizedAssets = normalizeAmount(assets, 6);
            uint256 normalizedAllocation = (normalizedAssets * allocation.weight) / 1e18;
            uint8 tokenDecimals = registry.getTokenDecimals(allocation.token);
            uint256 allocationAmount = denormalizeAmount(normalizedAllocation, tokenDecimals);
            (bool success, ) = allocation.token.call(abi.encodeWithSignature("mint(address,uint256)", address(this), allocationAmount));
            require(success, "Mint RWA failed");
            emit Allocated(allocation.token, allocationAmount);
        }

        IERC20MintableBurnable(address(asset())).burn(address(this), assets);
        return shares;
    }

    function withdraw(uint256, address, address) public pure override returns (uint256) {
        revert WithdrawNotSupported();
    }

    function redeem(uint256 shares, address receiver, address owner) public whenNotPausedCustom nonReentrant override returns (uint256) {
        if (shares == 0) revert InvalidAmount();
        uint256 assets = convertToAssets(shares);

        uint256 fee = (assets * exitFeeBps) / 10_000;
        uint256 assetsAfterFee = assets - fee;

        // Brûler les shares de l'owner
        _burn(owner, shares);

        // Brûler les RWA tokens correspondants
        for (uint256 i = 0; i < allocations.length; i++) {
            AssetAllocation memory allocation = allocations[i];
            if (!allocation.active || allocation.token == asset()) continue;
            
            uint256 normalizedAssets = normalizeAmount(assets, 6);
            uint256 normalizedAllocation = (normalizedAssets * allocation.weight) / 1e18;
            uint8 tokenDecimals = registry.getTokenDecimals(allocation.token);
            uint256 allocationAmount = denormalizeAmount(normalizedAllocation, tokenDecimals);
            
            IERC20MintableBurnable(allocation.token).burn(address(this), allocationAmount);
        }

        // Mint les USDC pour l'utilisateur
        IERC20MintableBurnable(address(asset())).mint(receiver, assetsAfterFee);

        if (fee > 0) {
            IERC20MintableBurnable(address(asset())).mint(treasury, fee);
            emit ExitFeeApplied(owner, assets, fee);
        }

        emit WithdrawExecuted(owner, receiver, assetsAfterFee);
        return assetsAfterFee;
    }

    function _getAssetValue(address token, uint256 balance) internal view returns (uint256) {
        if (balance == 0) return 0;
        (uint256 price, ) = oracle.getPrice(token);
        uint8 tokenDecimals = registry.getTokenDecimals(token);
        uint256 normalizedBalance = normalizeAmount(balance, tokenDecimals);
        uint256 valueIn18Decimals = (normalizedBalance * price) / 1e18;
        return denormalizeAmount(valueIn18Decimals, 6);
    }

    function totalAssets() public view override returns (uint256) {
        uint256 totalValue = 0;
        for (uint256 i = 0; i < allocations.length; i++) {
            AssetAllocation memory allocation = allocations[i];
            if (allocation.active) {
                uint256 balance = IERC20(allocation.token).balanceOf(address(this));
                uint256 assetValue = _getAssetValue(allocation.token, balance);
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

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
