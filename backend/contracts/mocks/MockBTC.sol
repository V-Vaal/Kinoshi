// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockBTC
 * @author Kinoshi Team
 * @notice Token Bitcoin simulé pour les tests et démonstrations
 * @dev Implémente un token ERC20 représentant Bitcoin avec 18 décimales
 * et fonctions de mint/burn pour simuler les actifs réels
 */
contract MockBTC is ERC20 {
    uint8 private immutable _customDecimals;

    /**
     * @notice Constructeur du token MockBTC
     * @dev Initialise le token avec le nom "Mock Bitcoin" et le symbole "mBTC"
     * @dev Utilise 18 décimales pour standardiser avec les autres tokens
     */
    constructor() ERC20("Mock Bitcoin", "mBTC") {
        _customDecimals = 18; // 18 décimales pour BTC (standardisé)
    }

    /**
     * @notice Retourne le nombre de décimales du token
     * @return uint8 Nombre de décimales (18)
     */
    function decimals() public view override returns (uint8) {
        return _customDecimals;
    }

    /**
     * @notice Crée de nouveaux tokens Bitcoin simulés
     * @param to Adresse recevant les tokens
     * @param amount Montant de tokens à créer
     * @dev Fonction publique pour permettre la création de tokens de test
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Détruit des tokens Bitcoin simulés existants
     * @param from Adresse dont les tokens sont détruits
     * @param amount Montant de tokens à détruire
     * @dev Fonction publique pour permettre la destruction de tokens de test
     */
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
} 