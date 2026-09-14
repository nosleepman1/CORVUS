/**
 * @file bridge.ts
 * @description Protocole JSON-RPC 2.0 et formats de messages WebSocket pour connecter l'application Desktop (Tauri/Electron).
 */

import { AgentEvent, SessionMetrics } from './agent.js';
import { PermissionRequest } from './permissions.js';

/**
 * Structure d'une requête JSON-RPC 2.0 reçue depuis le client Desktop.
 */
export interface JsonRpcRequest<TParams = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: TParams;
}

/**
 * Structure d'une réponse JSON-RPC 2.0 renvoyée au client Desktop.
 */
export interface JsonRpcResponse<TResult = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  result?: TResult;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * Structure d'une notification JSON-RPC 2.0 diffusée en streaming aux clients connectés.
 */
export interface JsonRpcNotification<TData = unknown> {
  jsonrpc: '2.0';
  method: string;
  params: TData;
}

/**
 * Payload pour la méthode 'agent.prompt' envoyée par la Desktop App.
 */
export interface BridgePromptParams {
  prompt: string;
  model?: string;
  blueprint?: string;
}

/**
 * Payload pour la méthode 'permission.respond' envoyée par la Desktop App.
 */
export interface BridgePermissionResponseParams {
  requestId: string;
  approved: boolean;
  rememberChoice?: boolean;
}

/**
 * Notification diffusée lors d'un événement agentique.
 */
export type BridgeEventNotification = JsonRpcNotification<{
  event: AgentEvent;
  metrics: SessionMetrics;
}>;

/**
 * Notification diffusée lorsqu'une permission est requise.
 */
export type BridgePermissionNotification = JsonRpcNotification<{
  request: PermissionRequest;
}>;
