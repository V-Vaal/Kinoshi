// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./errors.sol";

contract TokenRegistry is Ownable {
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

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Enregistre un nouveau token dans le registre
     * @param tokenAddress Adresse du token
     * @param symbol Symbole du token
     * @param decimals Nombre de décimales
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
     * @dev Désenregistre un token du registre
     * @param tokenAddress Adresse du token à désenregistrer
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
     * @dev Retourne tous les tokens enregistrés
     * @return tokens Tableau des informations des tokens
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
     * @dev Vérifie si un token est enregistré
     * @param tokenAddress Adresse du token
     * @return bool True si le token est enregistré
     */
    function isTokenRegistered(address tokenAddress) external view returns (bool) {
        return registeredTokens[tokenAddress].isRegistered;
    }

    /**
     * @dev Retourne le nombre total de tokens enregistrés
     * @return uint256 Nombre de tokens actifs
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
     * @dev Récupère les décimales d’un token enregistré
     * @param token Adresse du token
     */
    function getTokenDecimals(address token) external view returns (uint8) {
        if (!registeredTokens[token].isRegistered) revert TokenNotRegistered();
        return registeredTokens[token].decimals;
    }

    /**
     * @dev Active ou désactive manuellement un token déjà enregistré
     * @param token Adresse du token
     * @param active Statut d'activation
     */
    function setTokenActive(address token, bool active) external onlyOwner {
        if (!registeredTokens[token].isRegistered) revert TokenNotRegistered();
        registeredTokens[token].isRegistered = active;
    }
} 