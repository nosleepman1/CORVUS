/**
 * @file permissionManager.ts
 * @description Gestionnaire centralisé des autorisations et des demandes d'approbation pour Corvus.
 */

import picomatch from 'picomatch';
import {
  AclRule,
  ActionType,
  PermissionDecision,
  PermissionMode,
  PermissionRequest,
} from '../types/permissions.js';
import { DEFAULT_ACL_RULES } from './rules.js';

/**
 * Gestionnaire d'autorisations et d'accès pour l'agent Corvus.
 *
 * Évalue les actions avant exécution en fonction du mode de sécurité actif
 * et des règles ACL configurées. Gère les demandes d'approbation interactives
 * via terminal (CLI) ou via le serveur WebSocket pour l'application Desktop.
 *
 * @example
 * ```typescript
 * const pm = new PermissionManager('default');
 * const isAllowed = await pm.checkPermission({
 *   toolName: 'file_write',
 *   actionType: 'write',
 *   description: 'Création du fichier src/users/user.service.ts',
 *   params: { path: 'src/users/user.service.ts' },
 * });
 * ```
 */
export class PermissionManager {
  private mode: PermissionMode;
  private rules: AclRule[];
  private approvalHandler?: (request: PermissionRequest) => Promise<boolean>;

  /**
   * Initialise le gestionnaire de permissions.
   *
   * @param {PermissionMode} [initialMode='default'] - Le mode de sécurité initial.
   * @param {AclRule[]} [customRules] - Règles ACL optionnelles supplémentaires.
   */
  constructor(initialMode: PermissionMode = 'default', customRules?: AclRule[]) {
    this.mode = initialMode;
    this.rules = [...DEFAULT_ACL_RULES, ...(customRules ?? [])];
  }

  /**
   * Modifie le mode de sécurité actif.
   *
   * @param {PermissionMode} newMode - Le nouveau mode ('default' | 'plan' | 'bypass').
   */
  public setMode(newMode: PermissionMode): void {
    this.mode = newMode;
  }

  /**
   * Obtient le mode de sécurité actuellement appliqué.
   *
   * @returns {PermissionMode} Le mode actif.
   */
  public getMode(): PermissionMode {
    return this.mode;
  }

  /**
   * Enregistre un gestionnaire d'approbation asynchrone (ex: modale React Ink ou client Desktop).
   *
   * @param {(request: PermissionRequest) => Promise<boolean>} handler - La fonction d'approbation.
   */
  public registerApprovalHandler(handler: (request: PermissionRequest) => Promise<boolean>): void {
    this.approvalHandler = handler;
  }

  /**
   * Évalue une action et détermine si elle est autorisée, refusée ou nécessite une confirmation.
   *
   * @param {object} action - Les détails de l'action envisagée.
   * @param {string} action.toolName - Le nom de l'outil concerné.
   * @param {ActionType} action.actionType - La catégorie d'action.
   * @param {string} action.description - Description explicite pour l'utilisateur.
   * @param {Record<string, unknown>} action.params - Paramètres d'entrée de l'outil.
   * @param {string} [action.diffPreview] - Aperçu du diff ou de la commande à exécuter.
   * @returns {Promise<boolean>} Vrai si l'action est autorisée.
   */
  public async checkPermission(action: {
    toolName: string;
    actionType: ActionType;
    description: string;
    params: Record<string, unknown>;
    diffPreview?: string;
  }): Promise<boolean> {
    // 1. En mode bypass (mode autonome / CI), tout ce qui est dans le workspace est approuvé
    if (this.mode === 'bypass') {
      return true;
    }

    // 2. Les opérations de lecture pure sont autorisées par défaut
    if (action.actionType === 'read') {
      return true;
    }

    // 3. Vérification des règles ACL enregistrées par motif
    const actionKey = this.formatActionKey(action.toolName, action.params);
    for (const rule of this.rules) {
      const isMatch = picomatch(rule.pattern);
      if (isMatch(actionKey)) {
        if (rule.decision === 'allow') return true;
        if (rule.decision === 'deny') return false;
      }
    }

    // 4. En mode plan, si un plan complet a été préalablement validé, autoriser
    if (this.mode === 'plan') {
      return true;
    }

    // 5. En mode default, déclencher la demande d'approbation interactive
    if (this.approvalHandler) {
      const request: PermissionRequest = {
        id: `perm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        toolName: action.toolName,
        actionType: action.actionType,
        description: action.description,
        params: action.params,
        diffPreview: action.diffPreview,
        timestamp: new Date(),
      };

      return await this.approvalHandler(request);
    }

    // Par défaut sans handler, refuser par sécurité
    return false;
  }

  /**
   * Ajoute une nouvelle règle ACL dynamique en cours de session.
   *
   * @param {AclRule} rule - La règle à ajouter.
   */
  public addRule(rule: AclRule): void {
    this.rules.unshift(rule);
  }

  /**
   * Construit la clé d'action canonique pour le filtrage par motif (ex: 'bash:git checkout main').
   */
  private formatActionKey(toolName: string, params: Record<string, unknown>): string {
    if (toolName === 'bash_run' && typeof params.command === 'string') {
      return `bash:${params.command.trim()}`;
    }
    if (toolName === 'file_write' && typeof params.path === 'string') {
      return `write:${params.path}`;
    }
    if (toolName === 'file_edit' && typeof params.path === 'string') {
      return `edit:${params.path}`;
    }
    return `${toolName}:*`;
  }
}
