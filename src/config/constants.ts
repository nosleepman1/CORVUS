/**
 * @file constants.ts
 * @description Constantes globales, configurations par défaut et visuels de l'agent Corvus.
 */

/**
 * Informations d'identité de l'agent Corvus.
 */
export const AGENT_NAME = 'Corvus';
export const AGENT_VERSION = '1.0.0';
export const AGENT_TAGLINE = 'Agent d\'Ingénierie Logicielle Autonome & Polyglotte';

/**
 * Modèles DeepSeek pris en charge.
 */
export const DEFAULT_MODELS = {
  /** Modèle standard pour la génération de code rapide et le chat */
  CHAT: 'deepseek-chat',
  /** Modèle de raisonnement logique profond et de planification architecturale */
  REASONER: 'deepseek-reasoner',
} as const;

/**
 * Tarification estimée DeepSeek par million de tokens (en USD).
 * Permet au `TokenTracker` de calculer le coût en temps réel.
 */
export const DEEPSEEK_PRICING = {
  /** Tarification pour deepseek-chat (V3) */
  [DEFAULT_MODELS.CHAT]: {
    inputPerMillionTokens: 0.14,
    outputPerMillionTokens: 0.28,
    cacheHitInputPerMillionTokens: 0.014,
  },
  /** Tarification pour deepseek-reasoner (R1) */
  [DEFAULT_MODELS.REASONER]: {
    inputPerMillionTokens: 0.55,
    outputPerMillionTokens: 2.19,
    cacheHitInputPerMillionTokens: 0.14,
  },
} as const;

/**
 * Limites et seuils du gestionnaire de contexte et de tokens.
 */
export const CONTEXT_LIMITS = {
  /** Nombre maximal de tokens autorisés avant déclenchement de la compaction */
  MAX_CONTEXT_TOKENS: 64000,
  /** Seuil d'alerte pour avertir l'utilisateur de la taille de contexte */
  WARNING_THRESHOLD_TOKENS: 48000,
  /** Nombre maximal de tours de boucle ReAct par requête utilisateur */
  MAX_REACT_TURNS: 30,
  /** Timeout par défaut pour l'exécution d'une commande shell (en millisecondes) */
  DEFAULT_BASH_TIMEOUT_MS: 120000,
} as const;

/**
 * Répertoire de stockage des snapshots Git internes pour la commande /undo.
 */
export const SNAPSHOT_DIR_NAME = '.corvus_snapshots';

/**
 * Art ASCII officiel de la mascotte Corvus (Le Corbeau Ingénieur).
 */
export const CORVUS_ASCII_BANNER = `
  ╭─────────────────────────────────────────────────────────────╮
  │   🦅  C O R V U S  —  A G E N T I C   C O D E   E N G I N E  │
  │   Mascotte : Le Corbeau Façonneur d'Outils                  │
  │   Motorisé par DeepSeek V3 / R1 & Multi-Stack Blueprints    │
  ╰─────────────────────────────────────────────────────────────╯
`;
