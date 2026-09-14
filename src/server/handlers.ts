/**
 * @file handlers.ts
 * @description Gestionnaires de requêtes distantes JSON-RPC 2.0 pour l'application Desktop.
 */

import { CorvusAgent } from '../core/agent.js';
import {
  BridgePermissionResponseParams,
  BridgePromptParams,
  JsonRpcRequest,
  JsonRpcResponse,
} from '../types/bridge.js';
import { ContextCompactor } from '../core/contextCompactor.js';

export interface HandlerContext {
  agent: CorvusAgent;
  permissionResolvers: Map<string, (allowed: boolean) => void>;
}

/**
 * Routeur et exécuteur des requêtes JSON-RPC 2.0 reçues par le serveur Bridge.
 *
 * @param {JsonRpcRequest} request - La requête RPC entrante.
 * @param {HandlerContext} context - Le contexte de l'agent et des résolveurs de permissions.
 * @returns {Promise<JsonRpcResponse>} La réponse RPC correspondante.
 */
export async function handleRpcRequest(
  request: JsonRpcRequest,
  context: HandlerContext,
): Promise<JsonRpcResponse> {
  const { method, params, id } = request;
  const { agent, permissionResolvers } = context;

  try {
    switch (method) {
      case 'agent.getState': {
        const state = agent.getStateStore().getState();
        return { jsonrpc: '2.0', id, result: state };
      }

      case 'agent.getHistory': {
        const messages = agent.getMemory().getMessages();
        return { jsonrpc: '2.0', id, result: messages };
      }

      case 'agent.prompt': {
        const p = params as BridgePromptParams;
        if (!p?.prompt) {
          return { jsonrpc: '2.0', id, error: { code: -32602, message: 'Paramètre prompt requis.' } };
        }

        // Lance l'exécution en tâche de fond (les événements sont diffusés en continu)
        (async () => {
          for await (const _event of agent.run(p.prompt)) {
            // Événements capturés par l'eventDispatcher
          }
        })();

        return { jsonrpc: '2.0', id, result: { status: 'started' } };
      }

      case 'permission.respond': {
        const p = params as BridgePermissionResponseParams;
        const resolver = permissionResolvers.get(p.requestId);
        if (resolver) {
          resolver(p.approved);
          permissionResolvers.delete(p.requestId);
          return { jsonrpc: '2.0', id, result: { resolved: true } };
        }
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32000, message: `Demande de permission ${p.requestId} introuvable.` },
        };
      }

      case 'agent.compact': {
        const result = ContextCompactor.compact(agent.getMemory());
        return { jsonrpc: '2.0', id, result };
      }

      case 'agent.clear': {
        agent.getMemory().clear();
        return { jsonrpc: '2.0', id, result: { cleared: true } };
      }

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Méthode inconnue '${method}'.` },
        };
    }
  } catch (err: any) {
    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32000, message: err.message },
    };
  }
}
