#!/usr/bin/env node
/**
 * @file daemon.ts
 * @description Point d'entrée pour lancer le serveur Daemon Bridge WebSocket de Corvus pour l'application Desktop.
 */

import { loadEnv } from './config/env.js';
import { DeepSeekClient } from './llm/deepseekClient.js';
import { ToolRegistry } from './tools/registry.js';
import { PermissionManager } from './security/permissionManager.js';
import { BlueprintRegistry } from './blueprints/registry.js';
import { CorvusAgent } from './core/agent.js';
import { CorvusBridgeServer } from './server/bridgeServer.js';

async function startDaemon() {
  const envConfig = loadEnv();
  const workspaceRoot = process.cwd();

  const client = new DeepSeekClient(envConfig);
  const tools = ToolRegistry.createDefaultRegistry();
  const permissions = new PermissionManager(envConfig.CORVUS_PERMISSION_MODE);
  const blueprints = BlueprintRegistry.createDefaultRegistry();

  const agent = new CorvusAgent({
    workspaceRoot,
    client,
    tools,
    permissions,
    blueprints,
  });

  const server = new CorvusBridgeServer({
    port: envConfig.CORVUS_DAEMON_PORT,
    agent,
  });

  await server.start();
}

startDaemon().catch(err => {
  console.error('[Corvus Daemon Error]', err);
  process.exit(1);
});
