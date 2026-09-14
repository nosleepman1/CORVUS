#!/usr/bin/env node
/**
 * @file index.ts
 * @description Point d'entrée principal du CLI Corvus.
 */

import React from 'react';
import { render } from 'ink';
import { loadEnv } from './config/env.js';
import { DeepSeekClient } from './llm/deepseekClient.js';
import { ToolRegistry } from './tools/registry.js';
import { PermissionManager } from './security/permissionManager.js';
import { BlueprintRegistry } from './blueprints/registry.js';
import { CorvusAgent } from './core/agent.js';
import { App } from './cli/App.js';

/**
 * Fonction de démarrage principal du CLI interactif Corvus.
 */
async function main() {
  const envConfig = loadEnv();
  const workspaceRoot = process.cwd();

  // Initialisation des couches de l'agent
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

  // Rendu de l'application interactive React Ink dans le terminal
  const { waitUntilExit } = render(React.createElement(App, { agent }));
  await waitUntilExit();
}

main().catch(err => {
  console.error('[Corvus Fatal Error]', err);
  process.exit(1);
});
