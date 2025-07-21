// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @notice Définitions des erreurs personnalisées pour les contrats Kinoshi
 * @dev Ce fichier centralise toutes les erreurs utilisées dans les contrats
 * pour une meilleure lisibilité et maintenance
 */

// Erreurs de validation des montants
error InvalidAmount(); // Montant invalide (zéro ou négatif)

// Erreurs de stratégie et d'allocation
error InvalidStrategy(); // Stratégie d'investissement invalide
error InvalidWeightSum(); // Somme des poids d'allocation différente de 100%

// Erreurs de permissions
error NotOwner(); // Appelant n'est pas le propriétaire
error VaultPaused(); // Vault est en pause

// Erreurs d'adresses
error ZeroAddress(); // Adresse nulle invalide

// Erreurs de paiement
error EtherNotAccepted(); // Le contrat n'accepte pas les ethers

// Erreurs de pause
error Pausable__Paused(); // Contrat en pause (OpenZeppelin)

// Erreurs de tokens
error InvalidSymbol(); // Symbole de token invalide
error TokenAlreadyRegistered(); // Token déjà enregistré dans le registry
error TokenNotRegistered(); // Token non enregistré dans le registry

// Erreurs de vault
error VaultAlreadyBootstrapped(); // Vault déjà initialisé
error WithdrawNotSupported(); // Fonction de retrait non supportée

// Erreurs d'oracle
error PriceNotSet(); // Prix non défini pour un token

// Erreurs de frais de gestion
error ManagementFeeCooldownNotMet(); // Cooldown des frais de gestion non respecté
error ManagementFeeNotConfigured(); // Frais de gestion non configurés 