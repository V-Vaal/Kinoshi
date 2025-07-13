// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title IPriceOracle
 * @notice Interface pour l'oracle de prix des tokens RWA
 * @dev Permet de récupérer le prix d'un token dans l'unité de référence (ex: USDC)
 *      avec le nombre de décimales approprié pour les calculs de valorisation
 */
interface IPriceOracle {
    /**
     * @notice Récupère le prix d'un token dans l'unité de référence
     * @param token L'adresse du token dont on veut le prix
     * @return price Le prix du token dans l'unité de référence
     * @return decimals Le nombre de décimales du prix retourné
     * @dev Exemple: pour 1 BTC = 100,000 USDC, retourne (100000000, 8)
     *      où 100000000 représente 100,000 avec 8 décimales
     */
    function getPrice(address token) external view returns (uint256 price, uint8 decimals);
} 