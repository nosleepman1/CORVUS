/**
 * @file bridgeServer.ts
 * @description Serveur WebSocket Daemon JSON-RPC 2.0 pour l'intégration de Corvus avec l'application Desktop (Tauri/Electron).
 */

import { WebSocketServer, WebSocket } from 'ws';
import { CorvusAgent } from '../core/agent.js';
import { BridgeEventDispatcher } from './eventDispatcher.js';
import { handleRpcRequest } from './handlers.js';
import { JsonRpcRequest } from '../types/bridge.js';
import { PermissionRequest } from '../types/permissions.js';

export interface BridgeServerOptions {
  port: number;
  agent: CorvusAgent;
}

/**
 * Serveur Daemon WebSocket IPC de Corvus.
 *
 * Permet à une interface graphique Desktop externe (Tauri, Electron, React Desktop)
 * de piloter l'agent, de recevoir les diffs et flux de pensée en direct,
 * et de répondre interactivement aux demandes d'autorisations.
 *
 * @example
 * ```typescript
 * const server = new CorvusBridgeServer({ port: 3080, agent });
 * server.start();
 * ```
 */
export class CorvusBridgeServer {
  private port: number;
  private agent: CorvusAgent;
  private wss?: WebSocketServer;
  private dispatcher: BridgeEventDispatcher;
  private permissionResolvers: Map<string, (allowed: boolean) => void> = new Map();

  constructor(options: BridgeServerOptions) {
    this.port = options.port;
    this.agent = options.agent;
    this.dispatcher = new BridgeEventDispatcher();
  }

  /**
   * Démarre le serveur WebSocket.
   */
  public start(): Promise<void> {
    return new Promise(resolve => {
      this.wss = new WebSocketServer({ port: this.port });

      // Branche le gestionnaire de permissions vers le diffuseur WebSocket
      (this.agent as any).permissions.registerApprovalHandler((request: PermissionRequest) => {
        return new Promise<boolean>(res => {
          this.permissionResolvers.set(request.id, res);
          this.dispatcher.broadcastPermissionRequest(request);
        });
      });

      this.wss.on('connection', (ws: WebSocket) => {
        this.dispatcher.addClient(ws);

        ws.on('message', async (data: string) => {
          try {
            const request: JsonRpcRequest = JSON.parse(data.toString());
            const response = await handleRpcRequest(request, {
              agent: this.agent,
              permissionResolvers: this.permissionResolvers,
            });
            ws.send(JSON.stringify(response));
          } catch (err: any) {
            ws.send(
              JSON.stringify({
                jsonrpc: '2.0',
                id: null,
                error: { code: -32700, message: 'Parse error: JSON invalide.' },
              }),
            );
          }
        });

        ws.on('close', () => {
          this.dispatcher.removeClient(ws);
        });
      });

      console.log(`[Corvus Bridge] Serveur WebSocket Daemon actif sur ws://localhost:${this.port}`);
      resolve();
    });
  }

  /**
   * Arrête le serveur WebSocket.
   */
  public stop(): Promise<void> {
    return new Promise(resolve => {
      if (this.wss) {
        this.wss.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
