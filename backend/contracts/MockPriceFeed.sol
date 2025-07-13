// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPriceOracle.sol";
import "./errors.sol";

/**
 * @title MockPriceFeed
 * @notice Oracle de prix simulé pour les tokens RWA
 * @dev Permet à l'admin de définir manuellement les prix des tokens
 *      pour les besoins de démonstration et de tests
 */
contract MockPriceFeed is IPriceOracle, Ownable {
    /**
     * @notice Structure pour stocker les données de prix d'un token
     * @param price Le prix du token dans l'unité de référence
     * @param decimals Le nombre de décimales du prix
     */
    struct PriceData {
        uint256 price;
        uint8 decimals;
    }

    /**
     * @notice Mapping des prix par adresse de token
     * @dev token => PriceData
     */
    mapping(address => PriceData) private _prices;

    /**
     * @notice Event émis quand un prix est défini ou mis à jour
     * @param token L'adresse du token
     * @param price Le nouveau prix
     * @param decimals Le nombre de décimales du prix
     */
    event PriceSet(address indexed token, uint256 price, uint8 decimals);

    /**
     * @notice Constructeur du MockPriceFeed
     * @param initialOwner L'adresse du propriétaire initial
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Définit le prix d'un token
     * @param token L'adresse du token
     * @param price Le prix du token dans l'unité de référence
     * @param decimals Le nombre de décimales du prix
     * @dev Seul l'owner peut appeler cette fonction
     */
    function setPrice(address token, uint256 price, uint8 decimals) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        
        _prices[token] = PriceData(price, decimals);
        
        emit PriceSet(token, price, decimals);
    }

    /**
     * @notice Récupère le prix d'un token
     * @param token L'adresse du token
     * @return price Le prix du token dans l'unité de référence
     * @return decimals Le nombre de décimales du prix
     * @dev Revert si le prix n'a pas été défini
     */
    function getPrice(address token) external view override returns (uint256 price, uint8 decimals) {
        PriceData memory priceData = _prices[token];
        
        if (priceData.price == 0) revert PriceNotSet();
        
        return (priceData.price, priceData.decimals);
    }

    /**
     * @notice Vérifie si un prix a été défini pour un token
     * @param token L'adresse du token
     * @return True si le prix est défini, false sinon
     */
    function hasPrice(address token) external view returns (bool) {
        return _prices[token].price != 0;
    }
} 