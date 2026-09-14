/**
 * @file eventDispatcher.ts
 * @description Diffuseur d'événements temps réel WebSocket pour l'application Desktop (Tauri/Electron).
 */

import { WebSocket } from 'ws';
import { AgentEvent, SessionMetrics } from '../types/agent.js';
import { PermissionRequest } from '../types/permissions.js';
import { BridgeEventNotification, BridgePermissionNotification } from '../types/bridge.js';

/**
 * Gestionnaire de diffusion des événements de l'agent Corvus vers les clients WebSocket connectés.
 */
export class BridgeEventDispatcher {
  private clients: Set<WebSocket> = new Set();

  /**
   * Enregistre un nouveau client WebSocket.
   *
   * @param {WebSocket} ws - Le socket connecté.
   */
  public addClient(ws: WebSocket): void {
    this.clients.add(ws);
  }

  /**
   * Retire un client WebSocket déconnecté.
   *
   * @param {WebSocket} ws - Le socket déconnecté.
   */
  public removeClient(ws: WebSocket): void {
    this.clients.delete(ws);
  }

  /**
   * Diffuse un événement agentique standard à tous les clients connectés.
   *
   * @param {AgentEvent} event - L'événement émis par l'agent.
   * @param {SessionMetrics} metrics - Les métriques de session à jour.
   */
  public broadcastEvent(event: AgentEvent, metrics: SessionMetrics): void {
    const notification: BridgeEventNotification = {
      jsonrpc: '2.0',
      method: 'agent.event',
      params: { event, metrics },
    };
    this.sendJson(notification);
  }

  /**
   * Diffuse une demande de permission interactive à destination de l'application Desktop.
   *
   * @param {PermissionRequest} request - La demande de permission.
   */
  public broadcastPermissionRequest(request: PermissionRequest): void {
    const notification: BridgePermissionNotification = {
      jsonrpc: '2.0',
      method: 'permission.requested',
      params: { request },
    };
    this.sendJson(notification);
  }

  private sendJson(payload: unknown): void {
    const message = JSON.stringify(payload);
    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }
}
