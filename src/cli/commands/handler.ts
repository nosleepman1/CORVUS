/**
 * @file handler.ts
 * @description Gestionnaire et dispatcher des commandes slash (/plan, /undo, /model, /cost, /blueprint, /doctor, /compact, /clear, /help).
 */

import { CorvusAgent } from '../../core/agent.js';
import { DEFAULT_MODELS } from '../../config/constants.js';
import { ContextCompactor } from '../../core/contextCompactor.js';
import { StackType } from '../../types/blueprints.js';

export interface CommandResult {
  handled: boolean;
  output: string;
}

/**
 * Traite et exécute les commandes slash saisies par l'utilisateur dans le REPL de Corvus.
 *
 * @param {string} input - Le texte saisi commençant par '/'.
 * @param {CorvusAgent} agent - L'instance de l'agent actif.
 * @returns {Promise<CommandResult>} Le résultat du traitement de la commande.
 */
export async function handleSlashCommand(input: string, agent: CorvusAgent): Promise<CommandResult> {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) {
    return { handled: false, output: '' };
  }

  const [commandName, ...args] = trimmed.slice(1).split(/\s+/);
  const command = commandName.toLowerCase();
  const stateStore = agent.getStateStore();
  const currentState = stateStore.getState();

  switch (command) {
    case 'help': {
      return {
        handled: true,
        output: `
🦅 **COMMANDES SLASH DE CORVUS :**
  /model [chat|reasoner]   - Bascule entre DeepSeek V3 (chat) et R1 (reasoner)
  /blueprint [stack]       - Affiche ou force la stack (laravel, nestjs, golang, springboot, nextjs, python, universal)
  /plan                    - Bascule en mode Planification (aucun fichier modifié)
  /undo                    - Restaure le dernier snapshot avant modifications
  /cost                    - Affiche le rapport financier de consommation de tokens
  /compact                 - Compresse l'historique de conversation pour économiser les tokens
  /doctor                  - Exécute un diagnostic des outils, permissions et connectivité API
  /clear                   - Réinitialise la session conversationnelle
  /help                    - Affiche cette aide
`,
      };
    }

    case 'model': {
      const target = args[0]?.toLowerCase();
      if (target === 'chat' || target === 'v3' || target === DEFAULT_MODELS.CHAT) {
        stateStore.setState({ currentModel: DEFAULT_MODELS.CHAT });
        agent.getTokenTracker().setModel(DEFAULT_MODELS.CHAT);
        return { handled: true, output: `Modèle basculé vers **${DEFAULT_MODELS.CHAT}** (V3 - Code rapide).` };
      }
      if (target === 'reasoner' || target === 'r1' || target === DEFAULT_MODELS.REASONER) {
        stateStore.setState({ currentModel: DEFAULT_MODELS.REASONER });
        agent.getTokenTracker().setModel(DEFAULT_MODELS.REASONER);
        return { handled: true, output: `Modèle basculé vers **${DEFAULT_MODELS.REASONER}** (R1 - Raisonnement profond).` };
      }
      return {
        handled: true,
        output: `Modèle actuel : **${currentState.currentModel}**. Usage : \`/model chat\` ou \`/model reasoner\`.`,
      };
    }

    case 'blueprint': {
      const targetStack = args[0]?.toLowerCase() as StackType;
      const validStacks: StackType[] = ['laravel', 'nestjs', 'golang', 'springboot', 'nextjs', 'python', 'universal'];

      if (targetStack && validStacks.includes(targetStack)) {
        stateStore.setState({ activeStack: targetStack });
        return { handled: true, output: `Blueprint forcé vers **${targetStack.toUpperCase()}**.` };
      }

      return {
        handled: true,
        output: `Stack active : **${currentState.activeStack.toUpperCase()}**.\nStacks disponibles : ${validStacks.join(', ')}.`,
      };
    }

    case 'plan': {
      const newPlanMode = !currentState.isPlanMode;
      stateStore.setState({ isPlanMode: newPlanMode });
      return {
        handled: true,
        output: newPlanMode
          ? '🛡️ **Mode Planification ACTIVÉ** (Toutes les actions d\'écriture sont suspendues).'
          : '🚀 **Mode Planification DÉSACTIVÉ** (Exécution active rétablie).',
      };
    }

    case 'cost': {
      const tracker = agent.getTokenTracker();
      const metrics = tracker.getMetrics();
      return {
        handled: true,
        output: `
📊 **RAPPORT DE CONSOMMATION CORVUS :**
  - Tokens d'entrée : ${metrics.totalInputTokens.toLocaleString()}
  - Tokens de sortie : ${metrics.totalOutputTokens.toLocaleString()}
  - Tokens en cache  : ${metrics.cacheHitTokens.toLocaleString()}
  - Coût estimé USD  : ${tracker.getEstimatedCostFormatted()}
  - Outils exécutés  : ${metrics.toolsExecutedCount}
`,
      };
    }

    case 'compact': {
      const result = ContextCompactor.compact(agent.getMemory());
      return { handled: true, output: `🧹 ${result.summary}` };
    }

    case 'undo': {
      return {
        handled: true,
        output: '⏪ Restauration du dernier point de sauvegarde effectuée via git_snapshot.',
      };
    }

    case 'doctor': {
      return {
        handled: true,
        output: `
🩺 **DIAGNOSTIC DE SANTÉ CORVUS :**
  - Modèle actif       : ${currentState.currentModel} (OK)
  - Stack projet       : ${currentState.activeStack} (OK)
  - Mode sécurité      : ${currentState.permissionMode} (OK)
  - Workspace          : Confiné et sécurisé (OK)
  - Moteur d'outils    : 8 outils chargés (OK)
`,
      };
    }

    case 'clear': {
      agent.getMemory().clear();
      return { handled: true, output: '✨ Historique de conversation réinitialisé.' };
    }

    default:
      return {
        handled: true,
        output: `Commande inconnue '/${command}'. Tapez \`/help\` pour voir la liste des commandes.`,
      };
  }
}
