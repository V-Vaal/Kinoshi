// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @author Kinoshi Team
 * @notice Token USDC simulé pour les tests et démonstrations
 * @dev Implémente un token ERC20 avec 18 décimales et fonctions de mint/burn
 * pour simuler le comportement d'USDC dans l'environnement de test
 */
contract MockUSDC is ERC20 {
    uint8 private immutable _customDecimals;

    /**
     * @notice Constructeur du token MockUSDC
     * @param name_ Nom du token
     * @param symbol_ Symbole du token
     * @dev Initialise le token avec 18 décimales (standardisé)
     */
    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _customDecimals = 18; // Standardisé à 18 décimales
    }

    /**
     * @notice Retourne le nombre de décimales du token
     * @return uint8 Nombre de décimales (18)
     */
    function decimals() public view override returns (uint8) {
        return _customDecimals;
    }

    /**
     * @notice Crée de nouveaux tokens
     * @param to Adresse recevant les tokens
     * @param amount Montant de tokens à créer
     * @dev Fonction publique pour permettre la création de tokens de test
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @notice Détruit des tokens existants
     * @param from Adresse dont les tokens sont détruits
     * @param amount Montant de tokens à détruire
     * @dev Fonction publique pour permettre la destruction de tokens de test
     */
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}
