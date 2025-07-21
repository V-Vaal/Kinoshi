// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./errors.sol";

/**
 * @title TokenRegistry
 * @author Kinoshi Team
 * @notice Registre centralisé pour gérer les tokens autorisés dans le vault
 * @dev Ce contrat maintient une liste des tokens RWA autorisés avec leurs métadonnées
 * et permet au propriétaire d'ajouter ou retirer des tokens du registre.
 */
contract TokenRegistry is Ownable {
    /**
     * @notice Structure contenant les informations d'un token
     * @param tokenAddress Adresse du contrat token
     * @param symbol Symbole du token (ex: "BTC", "GOLD")
     * @param decimals Nombre de décimales du token
     * @param isRegistered Statut d'enregistrement du token
     */
    struct TokenInfo {
        address tokenAddress;
        string symbol;
        uint8 decimals;
        bool isRegistered;
    }

    // Mapping des tokens enregistrés
    mapping(address => TokenInfo) public registeredTokens;
    
    // Liste des adresses pour itération
    address[] public tokenAddresses;

    event TokenRegistered(address indexed token, string symbol, uint8 decimals);
    event TokenUnregistered(address indexed token);

    /**
     * @notice Constructeur du registre
     * @dev Initialise le registre avec le msg.sender comme propriétaire
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Enregistre un nouveau token dans le registre
     * @param tokenAddress Adresse du contrat token
     * @param symbol Symbole du token (ex: "BTC", "GOLD")
     * @param decimals Nombre de décimales du token
     * @dev Seul le propriétaire peut enregistrer des tokens
     * @dev Vérifie que l'adresse n'est pas nulle et que le token n'est pas déjà enregistré
     */
    function registerToken(address tokenAddress, string memory symbol, uint8 decimals) 
        external 
        onlyOwner 
    {
        if (tokenAddress == address(0)) revert ZeroAddress();
        if (bytes(symbol).length == 0) revert InvalidSymbol();
        if (registeredTokens[tokenAddress].isRegistered) revert TokenAlreadyRegistered();

        registeredTokens[tokenAddress] = TokenInfo({
            tokenAddress: tokenAddress,
            symbol: symbol,
            decimals: decimals,
            isRegistered: true
        });

        tokenAddresses.push(tokenAddress);
        
        emit TokenRegistered(tokenAddress, symbol, decimals);
    }

    /**
     * @notice Désenregistre un token du registre
     * @param tokenAddress Adresse du token à désenregistrer
     * @dev Seul le propriétaire peut désenregistrer des tokens
     * @dev Le token doit être préalablement enregistré
     */
    function unregisterToken(address tokenAddress) external onlyOwner {
        if (!registeredTokens[tokenAddress].isRegistered) revert TokenNotRegistered();

        registeredTokens[tokenAddress].isRegistered = false;
        
        // Retirer de la liste des adresses
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            if (tokenAddresses[i] == tokenAddress) {
                tokenAddresses[i] = tokenAddresses[tokenAddresses.length - 1];
                tokenAddresses.pop();
                break;
            }
        }
        
        emit TokenUnregistered(tokenAddress);
    }

    /**
     * @notice Retourne tous les tokens enregistrés et actifs
     * @return tokens Tableau des informations des tokens actifs
     * @dev Retourne uniquement les tokens avec isRegistered = true
     */
    function getRegisteredTokens() external view returns (TokenInfo[] memory tokens) {
        uint256 activeCount = 0;
        
        // Compter les tokens actifs
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            if (registeredTokens[tokenAddresses[i]].isRegistered) {
                activeCount++;
            }
        }
        
        tokens = new TokenInfo[](activeCount);
        uint256 index = 0;
        
        // Remplir le tableau avec les tokens actifs
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            address tokenAddr = tokenAddresses[i];
            if (registeredTokens[tokenAddr].isRegistered) {
                tokens[index] = registeredTokens[tokenAddr];
                index++;
            }
        }
    }

    /**
     * @notice Vérifie si un token est enregistré et actif
     * @param tokenAddress Adresse du token à vérifier
     * @return bool True si le token est enregistré et actif
     */
    function isTokenRegistered(address tokenAddress) external view returns (bool) {
        return registeredTokens[tokenAddress].isRegistered;
    }

    /**
     * @notice Retourne le nombre total de tokens enregistrés et actifs
     * @return uint256 Nombre de tokens actifs
     * @dev Compte uniquement les tokens avec isRegistered = true
     */
    function getTokenCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            if (registeredTokens[tokenAddresses[i]].isRegistered) {
                count++;
            }
        }
        return count;
    }

    /**
     * @notice Récupère les décimales d'un token enregistré
     * @param token Adresse du token
     * @return uint8 Nombre de décimales du token
     * @dev Le token doit être enregistré dans le registre
     */
    function getTokenDecimals(address token) external view returns (uint8) {
        if (!registeredTokens[token].isRegistered) revert TokenNotRegistered();
        return registeredTokens[token].decimals;
    }

    /**
     * @notice Active ou désactive manuellement un token déjà enregistré
     * @param token Adresse du token
     * @param active Nouveau statut d'activation
     * @dev Seul le propriétaire peut modifier le statut d'activation
     * @dev Le token doit être préalablement enregistré
     */
    function setTokenActive(address token, bool active) external onlyOwner {
        if (!registeredTokens[token].isRegistered) revert TokenNotRegistered();
        registeredTokens[token].isRegistered = active;
    }
} 