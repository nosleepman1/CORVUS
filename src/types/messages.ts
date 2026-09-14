/**
 * @file messages.ts
 * @description Définition des types de messages échangés entre l'utilisateur, l'agent Corvus et les modèles LLM.
 */

/**
 * Rôles possibles pour les messages dans l'historique conversationnel.
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * Représente un appel d'outil demandé par le modèle LLM.
 */
export interface ToolCall {
  /** Identifiant unique de l'appel d'outil fourni par le modèle */
  id: string;
  /** Type de l'appel (généralement 'function') */
  type: 'function';
  /** Détails de la fonction appelée */
  function: {
    /** Nom de l'outil ciblé */
    name: string;
    /** Arguments au format JSON sous forme de chaîne */
    arguments: string;
  };
}

/**
 * Représente le résultat retourné par l'exécution d'un outil.
 */
export interface ToolResult {
  /** Identifiant de l'appel d'outil auquel ce résultat correspond */
  toolCallId: string;
  /** Nom de l'outil exécuté */
  toolName: string;
  /** Résultat brut sous forme de chaîne de caractères ou JSON */
  content: string;
  /** Indique si l'outil a échoué ou levé une exception */
  isError: boolean;
  /** Durée d'exécution de l'outil en millisecondes */
  executionTimeMs?: number;
}

/**
 * Bloc de raisonnement généré par les modèles comme DeepSeek-R1.
 */
export interface ThinkingBlock {
  /** Contenu textuel de la réflexion interne du modèle */
  content: string;
  /** Timestamp de génération */
  timestamp: number;
}

/**
 * Message standardisé dans l'historique de l'agent Corvus.
 */
export interface AgentMessage {
  /** Identifiant unique du message */
  id: string;
  /** Rôle de l'émetteur du message */
  role: MessageRole;
  /** Contenu textuel principal du message */
  content: string;
  /** Raisonnement interne généré par le modèle (DeepSeek-R1) si disponible */
  thinking?: string;
  /** Liste des appels d'outils formulés dans ce message (si role = assistant) */
  toolCalls?: ToolCall[];
  /** Liste des résultats d'outils associés (si role = tool) */
  toolResults?: ToolResult[];
  /** Date et heure de création */
  createdAt: Date;
}
