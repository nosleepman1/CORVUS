/**
 * @file stateStore.ts
 * @description Magasin d'état réactif et gestionnaire d'événements pour la session active de Corvus.
 */

import { AgentStatus, SessionMetrics } from '../types/agent.js';
import { StackType } from '../types/blueprints.js';
import { PermissionMode } from '../types/permissions.js';
import { DEFAULT_MODELS } from '../config/constants.js';

/**
 * État global de l'application Corvus.
 */
export interface CorvusState {
  /** Statut courant de l'agent */
  status: AgentStatus;
  /** Modèle LLM sélectionné */
  currentModel: string;
  /** Stack logicielle active */
  activeStack: StackType;
  /** Mode de permissions en vigueur */
  permissionMode: PermissionMode;
  /** Mode planification activé */
  isPlanMode: boolean;
  /** Message d'état informatif pour la barre d'état */
  statusMessage?: string;
  /** Métriques de la session */
  metrics: SessionMetrics;
}

type StateListener = (state: CorvusState) => void;

/**
 * Magasin d'état réactif (Pattern Observable / Store) pour l'agent Corvus.
 *
 * Notifie automatiquement les composants React Ink de l'interface terminal
 * et les clients WebSocket connectés lors de chaque mise à jour.
 *
 * @example
 * ```typescript
 * const store = new StateStore();
 * store.subscribe(newState => console.log('Statut:', newState.status));
 * store.setStatus('thinking', 'Analyse du schéma de base de données...');
 * ```
 */
export class StateStore {
  private state: CorvusState;
  private listeners: Set<StateListener> = new Set();

  /**
   * Initialise le magasin d'état avec les valeurs par défaut.
   *
   * @param {Partial<CorvusState>} [initial] - Valeurs initiales optionnelles.
   */
  constructor(initial?: Partial<CorvusState>) {
    this.state = {
      status: 'idle',
      currentModel: initial?.currentModel ?? DEFAULT_MODELS.CHAT,
      activeStack: initial?.activeStack ?? 'universal',
      permissionMode: initial?.permissionMode ?? 'default',
      isPlanMode: false,
      metrics: {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        cacheHitTokens: 0,
        estimatedCostUsd: 0,
        turnCount: 0,
        toolsExecutedCount: 0,
        startedAt: new Date(),
      },
      ...initial,
    };
  }

  /**
   * Retourne une copie de l'état actuel.
   *
   * @returns {CorvusState} L'état courant.
   */
  public getState(): CorvusState {
    return { ...this.state };
  }

  /**
   * S'abonne aux changements d'état.
   *
   * @param {StateListener} listener - Fonction de rappel appelée à chaque mutation.
   * @returns {() => void} Fonction de désabonnement.
   */
  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Met à jour partiellement l'état global et notifie tous les écouteurs.
   *
   * @param {Partial<CorvusState>} partial - Les champs à mettre à jour.
   */
  public setState(partial: Partial<CorvusState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  /**
   * Modifie le statut d'activité de l'agent.
   *
   * @param {AgentStatus} status - Le nouveau statut.
   * @param {string} [message] - Message d'information contextuel.
   */
  public setStatus(status: AgentStatus, message?: string): void {
    this.setState({ status, statusMessage: message });
  }

  /**
   * Met à jour les métriques de la session courante.
   *
   * @param {SessionMetrics} metrics - Les nouvelles métriques.
   */
  public updateMetrics(metrics: SessionMetrics): void {
    this.setState({ metrics });
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.getState());
      } catch (err) {
        console.error('[StateStore Error] Erreur dans un écouteur d\'état:', err);
      }
    }
  }
}
