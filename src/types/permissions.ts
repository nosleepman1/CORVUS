/**
 * @file permissions.ts
 * @description Définition des modes de sécurité, règles de contrôle d'accès (ACL) et décisions d'approbation.
 */

/**
 * Modes de sécurité disponibles pour Corvus.
 */
export type PermissionMode =
  /** Demande l'approbation interactive de l'utilisateur pour les opérations destructives (écritures, commandes shell) */
  | 'default'
  /** Mode plan : approuve en bloc le plan d'exécution validé */
  | 'plan'
  /** Mode autonome / CI : approuve automatiquement les opérations confinées au workspace */
  | 'bypass';

/**
 * Type d'action concernée par une vérification de permission.
 */
export type ActionType = 'read' | 'write' | 'execute' | 'network' | 'git';

/**
 * Décision prise par le gestionnaire de permissions.
 */
export type PermissionDecision =
  /** L'action est approuvée */
  | 'allow'
  /** L'action est refusée */
  | 'deny'
  /** Une interaction avec l'utilisateur est requise */
  | 'ask';

/**
 * Règle ACL (Access Control List) permettant de filtrer les appels d'outils par motifs glob.
 */
export interface AclRule {
  /** Identifiant unique de la règle */
  id: string;
  /** Motif de correspondance (ex: 'bash:git *', 'write:src/**', 'read:*') */
  pattern: string;
  /** Décision associée à ce motif */
  decision: 'allow' | 'deny';
  /** Description de la règle */
  description?: string;
}

/**
 * Demande d'approbation soumise à l'utilisateur ou à l'application Desktop via Bridge.
 */
export interface PermissionRequest {
  /** Identifiant unique de la demande */
  id: string;
  /** Nom de l'outil concerné */
  toolName: string;
  /** Type d'action entreprise */
  actionType: ActionType;
  /** Description explicite de l'opération */
  description: string;
  /** Paramètres de l'outil */
  params: Record<string, unknown>;
  /** Aperçu du diff ou de la commande si applicable */
  diffPreview?: string;
  /** Horodatage de la requête */
  timestamp: Date;
}
