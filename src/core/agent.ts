/**
 * @file agent.ts
 * @description Orchestrateur principal de la boucle ReAct autonome de l'agent Corvus.
 */

import { DeepSeekClient, DeepSeekStreamChunk } from '../llm/deepseekClient.js';
import { ToolRegistry } from '../tools/registry.js';
import { PermissionManager } from '../security/permissionManager.js';
import { ConversationMemory } from './conversationMemory.js';
import { StateStore } from './stateStore.js';
import { TokenTracker } from '../llm/tokenTracker.js';
import { BlueprintRegistry } from '../blueprints/registry.js';
import { TaskPlanner } from './planner.js';
import { buildSystemPrompt } from '../llm/systemPrompts.js';
import { AgentEvent } from '../types/agent.js';
import { ToolCall, ToolResult } from '../types/messages.js';
import { CONTEXT_LIMITS } from '../config/constants.js';

export interface CorvusAgentOptions {
  workspaceRoot: string;
  client: DeepSeekClient;
  tools: ToolRegistry;
  permissions: PermissionManager;
  blueprints: BlueprintRegistry;
  stateStore?: StateStore;
}

/**
 * Moteur ReAct principal de l'agent d'ingénierie logicielle Corvus.
 *
 * Pilote l'interaction intelligente en plusieurs tours :
 * 1. Raisonnement & Réflexion (DeepSeek-R1 / V3)
 * 2. Génération & Sélection d'outils
 * 3. Filtrage par le système de permissions et Sandbox
 * 4. Exécution sécurisée et observation des retours
 * 5. Auto-correction autonome en cas d'erreur
 *
 * @example
 * ```typescript
 * const agent = new CorvusAgent({ workspaceRoot: process.cwd(), client, tools, permissions, blueprints });
 * for await (const event of agent.run("Créer un service d'authentification NestJS")) {
 *   console.log(event);
 * }
 * ```
 */
export class CorvusAgent {
  private workspaceRoot: string;
  private client: DeepSeekClient;
  private tools: ToolRegistry;
  private permissions: PermissionManager;
  private blueprints: BlueprintRegistry;
  private memory: ConversationMemory;
  private stateStore: StateStore;
  private tokenTracker: TokenTracker;
  private planner: TaskPlanner;

  constructor(options: CorvusAgentOptions) {
    this.workspaceRoot = options.workspaceRoot;
    this.client = options.client;
    this.tools = options.tools;
    this.permissions = options.permissions;
    this.blueprints = options.blueprints;
    this.memory = new ConversationMemory();
    this.tokenTracker = new TokenTracker();
    this.planner = new TaskPlanner();
    this.stateStore = options.stateStore ?? new StateStore();
  }

  public getStateStore(): StateStore {
    return this.stateStore;
  }

  public getMemory(): ConversationMemory {
    return this.memory;
  }

  public getTokenTracker(): TokenTracker {
    return this.tokenTracker;
  }

  public getPlanner(): TaskPlanner {
    return this.planner;
  }

  /**
   * Exécute une instruction utilisateur dans la boucle ReAct autonome.
   *
   * @param {string} userPrompt - La consigne ou question de l'utilisateur.
   * @param {AbortSignal} [signal] - Signal d'annulation optionnel.
   * @returns {AsyncGenerator<AgentEvent, void, unknown>} Flux continu des événements de l'agent.
   */
  public async *run(userPrompt: string, signal?: AbortSignal): AsyncGenerator<AgentEvent, void, unknown> {
    // 1. Détection automatique de la stack logicielle du workspace si non définie
    const currentState = this.stateStore.getState();
    let activeBlueprint = this.blueprints.getBlueprint(currentState.activeStack);

    if (!activeBlueprint || currentState.activeStack === 'universal') {
      const detection = await this.blueprints.autoDetectStack(this.workspaceRoot);
      activeBlueprint = this.blueprints.getBlueprint(detection.detectedStack);
      if (activeBlueprint) {
        this.stateStore.setState({ activeStack: activeBlueprint.id });
      }
    }

    // 2. Assemblage du prompt système
    const systemPromptText = buildSystemPrompt({
      workspaceRoot: this.workspaceRoot,
      blueprintName: activeBlueprint?.name,
      blueprintContribution: activeBlueprint?.getSystemPromptContribution(),
      mode: currentState.isPlanMode ? 'plan' : 'default',
    });
    this.memory.setSystemPrompt(systemPromptText);

    // 3. Enregistrement du message utilisateur
    this.memory.addUserMessage(userPrompt);

    let turnCount = 0;
    const maxTurns = CONTEXT_LIMITS.MAX_REACT_TURNS;

    while (turnCount < maxTurns) {
      turnCount++;

      this.stateStore.setStatus('thinking', 'Raisonnement en cours...');
      yield { type: 'status_change', status: 'thinking', message: 'Raisonnement en cours...' };

      let assistantContent = '';
      let assistantThinking = '';
      let toolCallsToExecute: ToolCall[] = [];

      try {
        const stream = this.client.streamChat({
          model: currentState.currentModel,
          messages: this.memory.getMessages(),
          tools: this.tools.toOpenAISchemas(),
          signal,
        });

        for await (const chunk of stream) {
          if (chunk.type === 'thinking_delta') {
            assistantThinking += chunk.text;
            yield { type: 'thinking_delta', text: chunk.text };
          } else if (chunk.type === 'content_delta') {
            assistantContent += chunk.text;
            yield { type: 'content_delta', text: chunk.text };
          } else if (chunk.type === 'completed') {
            toolCallsToExecute = chunk.toolCalls;
            if (chunk.usage) {
              this.tokenTracker.recordUsage({
                inputTokens: chunk.usage.inputTokens,
                outputTokens: chunk.usage.outputTokens,
              });
              this.stateStore.updateMetrics(this.tokenTracker.getMetrics());
            }
          }
        }
      } catch (err: any) {
        this.stateStore.setStatus('error', err.message);
        yield { type: 'error', error: err };
        return;
      }

      // Enregistre la réponse de l'assistant dans la mémoire
      const assistantMessage = this.memory.addAssistantMessage(
        assistantContent,
        assistantThinking.length > 0 ? assistantThinking : undefined,
        toolCallsToExecute.length > 0 ? toolCallsToExecute : undefined,
      );

      // Si le modèle n'a demandé aucun outil, la réponse est terminée
      if (toolCallsToExecute.length === 0) {
        this.stateStore.setStatus('done');
        yield { type: 'turn_complete', message: assistantMessage };
        yield { type: 'status_change', status: 'idle' };
        return;
      }

      // 4. Exécution séquentielle des outils demandés par le modèle
      this.stateStore.setStatus('executing_tool', `Exécution de ${toolCallsToExecute.length} outil(s)...`);
      yield {
        type: 'status_change',
        status: 'executing_tool',
        message: `Exécution de ${toolCallsToExecute.length} outil(s)...`,
      };

      for (const tc of toolCallsToExecute) {
        yield { type: 'tool_call_start', toolCall: tc };

        const tool = this.tools.getTool(tc.function.name);
        if (!tool) {
          const errMsg = `Outil '${tc.function.name}' inconnu dans le registre Corvus.`;
          this.memory.addToolResult(tc.id, tc.function.name, errMsg, true);
          yield {
            type: 'tool_call_end',
            result: { toolCallId: tc.id, toolName: tc.function.name, content: errMsg, isError: true },
          };
          continue;
        }

        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
        } catch {
          parsedArgs = {};
        }

        // Vérification des permissions
        const actionType = tool.isReadOnly ? 'read' : tc.function.name === 'bash_run' ? 'execute' : 'write';
        const isAllowed = await this.permissions.checkPermission({
          toolName: tool.name,
          actionType,
          description: `Exécution de ${tool.name}`,
          params: parsedArgs,
        });

        if (!isAllowed) {
          const deniedMsg = `[Refusé par l'Utilisateur] L'exécution de l'outil '${tool.name}' a été refusée.`;
          this.memory.addToolResult(tc.id, tool.name, deniedMsg, true);
          yield {
            type: 'tool_call_end',
            result: { toolCallId: tc.id, toolName: tool.name, content: deniedMsg, isError: true },
          };
          continue;
        }

        // Exécution sécurisée de l'outil
        const startTime = Date.now();
        try {
          const output = await tool.execute(parsedArgs, {
            workspaceRoot: this.workspaceRoot,
            sessionId: `session_${Date.now()}`,
            signal,
            onProgress: progress => {
              // Notification de progression
            },
          });

          const executionTimeMs = Date.now() - startTime;
          const outputString = typeof output === 'string' ? output : JSON.stringify(output, null, 2);

          this.tokenTracker.recordToolExecution();
          this.memory.addToolResult(tc.id, tool.name, outputString, false);

          const toolResult: ToolResult = {
            toolCallId: tc.id,
            toolName: tool.name,
            content: outputString,
            isError: false,
            executionTimeMs,
          };

          yield { type: 'tool_call_end', result: toolResult };
        } catch (execErr: any) {
          const executionTimeMs = Date.now() - startTime;
          const errOutput = `[Erreur d'Exécution] ${execErr.message}`;

          this.memory.addToolResult(tc.id, tool.name, errOutput, true);

          const toolResult: ToolResult = {
            toolCallId: tc.id,
            toolName: tool.name,
            content: errOutput,
            isError: true,
            executionTimeMs,
          };

          yield { type: 'tool_call_end', result: toolResult };
        }
      }

      // La boucle continue automatiquement (ReAct Observation -> Nouveau tour de pensée)
    }

    this.stateStore.setStatus('idle');
    yield { type: 'status_change', status: 'idle' };
  }
}
