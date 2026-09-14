/**
 * @file agent.ts
 * @description Types relatifs au cycle de vie de la boucle ReAct, aux événements de streaming et aux statistiques de session.
 */

import { AgentMessage, ToolCall, ToolResult } from './messages.js';

/**
 * États possibles de l'agent Corvus lors d'une session.
 */
export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'planning'
  | 'executing_tool'
  | 'awaiting_permission'
  | 'streaming_response'
  | 'error'
  | 'done';

/**
 * Événements émis en continu par l'agent lors de la résolution d'une tâche.
 */
export type AgentEvent =
  | { type: 'status_change'; status: AgentStatus; message?: string }
  | { type: 'thinking_delta'; text: string }
  | { type: 'content_delta'; text: string }
  | { type: 'tool_call_start'; toolCall: ToolCall }
  | { type: 'tool_call_progress'; toolCallId: string; progress: string }
  | { type: 'tool_call_end'; result: ToolResult }
  | { type: 'permission_requested'; toolName: string; description: string; toolCallId: string }
  | { type: 'permission_resolved'; toolCallId: string; allowed: boolean }
  | { type: 'turn_complete'; message: AgentMessage }
  | { type: 'error'; error: Error };

/**
 * Statistiques cumulées de la session en cours.
 */
export interface SessionMetrics {
  /** Nombre total de tokens envoyés en entrée */
  totalInputTokens: number;
  /** Nombre total de tokens reçus en sortie */
  totalOutputTokens: number;
  /** Nombre de tokens servis depuis le cache */
  cacheHitTokens: number;
  /** Coût cumulé estimé en USD */
  estimatedCostUsd: number;
  /** Nombre total de tours de conversation */
  turnCount: number;
  /** Nombre d'outils invoqués avec succès */
  toolsExecutedCount: number;
  /** Heure de début de la session */
  startedAt: Date;
}
