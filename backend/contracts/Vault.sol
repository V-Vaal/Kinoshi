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

    AssetAllocation[] public allocations;
    string public strategyLabel;

    uint256 public constant MAX_FEE_BPS = 1000;
    uint256 public exitFeeBps;
    uint256 public managementFeeBps;
    uint256 public constant MINIMUM_AMOUNT = 50 * 10**6;

    address public immutable treasury;
    TokenRegistry public immutable registry;
    IPriceOracle public immutable oracle;
    address public feeReceiver;
    uint256 public treasuryBalance;

    mapping(address => bool) public isAdmin;
    mapping(address => bool) public isWhitelisted;

    event Deposited(address indexed user, uint256 amount);
    event WithdrawExecuted(address indexed user, address indexed receiver, uint256 assets);
    event AllocationsUpdated(address indexed admin);
    event ExitFeeApplied(address indexed user, uint256 assets, uint256 fee);
    event ManagementFeeAccrued(address indexed receiver, uint256 shares);
    event Allocated(address indexed token, uint256 amount);
    event TreasuryWithdrawn(address indexed to, uint256 amount);
    event FeesUpdated(uint256 exitFeeBps, uint256 managementFeeBps);

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
        isAdmin[msg.sender] = true;
    }

    function normalizeAmount(uint256 amount, uint8 decimals) internal pure returns (uint256) {
        return decimals == 18 ? amount : decimals < 18 ? amount * (10 ** (18 - decimals)) : amount / (10 ** (decimals - 18));
    }

    function denormalizeAmount(uint256 amount, uint8 decimals) internal pure returns (uint256) {
        return decimals == 18 ? amount : decimals < 18 ? amount / (10 ** (18 - decimals)) : amount * (10 ** (decimals - 18));
    }

    function setAllocations(AssetAllocation[] memory newAllocations) external onlyAdmin {
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

    function setFees(uint256 _exitFeeBps, uint256 _managementFeeBps) external onlyAdmin {
        require(_exitFeeBps <= MAX_FEE_BPS, "Exit fee too high");
        require(_managementFeeBps <= MAX_FEE_BPS, "Management fee too high");
        exitFeeBps = _exitFeeBps;
        managementFeeBps = _managementFeeBps;
        emit FeesUpdated(_exitFeeBps, _managementFeeBps);
    }

    function bootstrapVault() external onlyOwner {
        if (totalSupply() > 0) revert VaultAlreadyBootstrapped();
        uint256 amount = 200e6;
        IERC20(asset()).transferFrom(treasury, address(this), amount);
        uint256 shares = normalizeAmount(amount, 6);
        _mint(treasury, shares);
        emit Deposited(treasury, amount);
    }

    function setFeeReceiver(address newReceiver) external onlyOwner {
        if (newReceiver == address(0)) revert ZeroAddress();
        feeReceiver = newReceiver;
    }

    function accrueManagementFee(uint256 shares) external onlyOwner {
        if (shares == 0) revert InvalidAmount();
        _mint(feeReceiver, shares);
        emit ManagementFeeAccrued(feeReceiver, shares);
    }

    function setAdmin(address _addr, bool _status) external onlyOwner {
        isAdmin[_addr] = _status;
    }

    function setWhitelisted(address _addr, bool _status) external onlyOwner {
        isWhitelisted[_addr] = _status;
    }

    function deposit(uint256 assets, address receiver)
        public
        whenNotPausedCustom
        override
        returns (uint256)
    {
        if (assets == 0) revert InvalidAmount();
        if (assets < MINIMUM_AMOUNT && totalSupply() > 0) revert MinimumDepositNotMet(MINIMUM_AMOUNT);
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
        return shares;
    }

    function withdraw(uint256 assets, address receiver, address owner)
        public
        whenNotPausedCustom
        nonReentrant
        override
        returns (uint256)
    {
        if (assets == 0) revert InvalidAmount();
        if (assets < MINIMUM_AMOUNT && assets != totalAssets()) revert MinimumWithdrawNotMet(MINIMUM_AMOUNT);
        uint256 shares = super.withdraw(assets, receiver, owner);
        emit WithdrawExecuted(owner, receiver, assets);
        return shares;
    }

    function redeem(uint256 shares, address receiver, address owner)
        public
        whenNotPausedCustom
        nonReentrant
        override
        returns (uint256)
    {
        if (shares == 0) revert InvalidAmount();
        uint256 assets = super.convertToAssets(shares);
        if (assets < MINIMUM_AMOUNT && shares != totalSupply()) revert MinimumRedeemNotMet(MINIMUM_AMOUNT);
        uint256 fee = (assets * exitFeeBps) / 10_000;
        uint256 assetsAfterFee = assets - fee;
        super.redeem(shares, address(this), owner);
        IERC20(asset()).transfer(receiver, assetsAfterFee);
        if (fee > 0) {
            IERC20(asset()).transfer(treasury, fee);
            treasuryBalance += fee;
            emit ExitFeeApplied(owner, assets, fee);
        }
        return assetsAfterFee;
    }

    function withdrawTreasury(address to, uint256 amount) external onlyAdmin {
        require(to != address(0), "Invalid address");
        require(amount <= treasuryBalance, "Insufficient funds");
        treasuryBalance -= amount;
        IERC20(asset()).transfer(to, amount);
        emit TreasuryWithdrawn(to, amount);
    }

    function _getAssetValue(address token, uint256 balance) internal view returns (uint256) {
        if (balance == 0) return 0;
        (uint256 price, uint8 priceDecimals) = oracle.getPrice(token);
        uint8 tokenDecimals = registry.getTokenDecimals(token);
        uint256 normalizedPrice = normalizeAmount(price, priceDecimals);
        uint256 valueIn18Decimals = (balance * normalizedPrice) / 1e18;
        return denormalizeAmount(valueIn18Decimals, 6);
    }

    function totalAssets() public view override returns (uint256) {
        if (totalSupply() > 0 && IERC20(asset()).balanceOf(address(this)) > 0) {
            bool hasRWA = false;
            for (uint256 i = 0; i < allocations.length; i++) {
                if (allocations[i].active && allocations[i].token != asset()) {
                    if (IERC20(allocations[i].token).balanceOf(address(this)) > 0) {
                        hasRWA = true;
                        break;
                    }
                }
            }
            if (!hasRWA) {
                return IERC20(asset()).balanceOf(address(this));
            }
        }
        uint256 totalValue = 0;
        for (uint256 i = 0; i < allocations.length; i++) {
            AssetAllocation memory allocation = allocations[i];
            if (allocation.active) {
                uint256 balance = IERC20(allocation.token).balanceOf(address(this));
                uint8 tokenDecimals = registry.getTokenDecimals(allocation.token);
                uint256 normalizedBalance = normalizeAmount(balance, tokenDecimals);
                uint256 assetValue = _getAssetValue(allocation.token, normalizedBalance);
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