// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockEquity
 * @author Kinoshi Team
 * @notice Token Actions simulé pour les tests et démonstrations
 * @dev Implémente un token ERC20 représentant des actions d'entreprises avec 18 décimales
 * et fonctions de mint/burn pour simuler les actifs réels
 */
contract MockEquity is ERC20 {
    uint8 private immutable _customDecimals;

    /**
     * @notice Constructeur du token MockEquity
     * @dev Initialise le token avec le nom "Mock Equity" et le symbole "mEQUITY"
     * @dev Utilise 18 décimales pour standardiser avec les autres tokens
     */
    constructor() ERC20("Mock Equity", "mEQUITY") {
        _customDecimals = 18; // 18 décimales pour les actions
    }

    /**
     * @notice Retourne le nombre de décimales du token
     * @return uint8 Nombre de décimales (18)
     */
    function decimals() public view override returns (uint8) {
        return _customDecimals;
    }

    /**
     * @notice Crée de nouveaux tokens Actions simulés
     * @param to Adresse recevant les tokens
     * @param amount Montant de tokens à créer
     * @dev Fonction publique pour permettre la création de tokens de test
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Détruit des tokens Actions simulés existants
     * @param from Adresse dont les tokens sont détruits
     * @param amount Montant de tokens à détruire
     * @dev Fonction publique pour permettre la destruction de tokens de test
     */
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
} 