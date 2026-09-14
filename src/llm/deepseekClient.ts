/**
 * @file deepseekClient.ts
 * @description Client HTTP/SSE résilient pour l'API DeepSeek (V3 & R1), gérant le streaming, le raisonnement et les appels d'outils.
 */

import OpenAI from 'openai';
import { EnvConfig } from '../config/env.js';
import { DEFAULT_MODELS } from '../config/constants.js';
import { AgentMessage, ToolCall } from '../types/messages.js';
import { OpenAIToolDefinition } from '../types/tools.js';

/**
 * Événement émis lors du streaming d'une réponse DeepSeek.
 */
export type DeepSeekStreamChunk =
  | { type: 'thinking_delta'; text: string }
  | { type: 'content_delta'; text: string }
  | { type: 'tool_call_chunk'; index: number; id?: string; name?: string; argumentsDelta: string }
  | {
      type: 'completed';
      content: string;
      thinking?: string;
      toolCalls: ToolCall[];
      usage?: { inputTokens: number; outputTokens: number };
    };

/**
 * Client d'interaction avec l'API DeepSeek optimisé pour les agents autonomes.
 *
 * Prend en charge :
 * - Le streaming continu avec séparation du flux de raisonnement (DeepSeek-R1) et du contenu.
 * - La reconstruction progressive des appels d'outils JSON partitionnés en streaming.
 * - La réessai automatique avec backoff exponentiel en cas d'erreur transitoire de réseau.
 *
 * @example
 * ```typescript
 * const client = new DeepSeekClient(envConfig);
 * const stream = client.streamChat({
 *   model: 'deepseek-reasoner',
 *   messages: conversationHistory,
 *   tools: toolDefinitions,
 * });
 * for await (const chunk of stream) {
 *   if (chunk.type === 'thinking_delta') process.stdout.write(chunk.text);
 *   if (chunk.type === 'content_delta') process.stdout.write(chunk.text);
 * }
 * ```
 */
export class DeepSeekClient {
  private openai: OpenAI;
  private defaultModel: string;

  /**
   * Initialise le client DeepSeek.
   *
   * @param {EnvConfig} config - Configuration contenant la clé API et l'URL de base.
   */
  constructor(config: EnvConfig) {
    this.defaultModel = config.CORVUS_MODEL;
    this.openai = new OpenAI({
      apiKey: config.DEEPSEEK_API_KEY,
      baseURL: config.DEEPSEEK_BASE_URL,
      timeout: 180000, // 3 minutes timeout pour les générations volumineuses
      maxRetries: 3,
    });
  }

  /**
   * Envoie une requête de complétion de chat en streaming avec gestion des outils et du raisonnement.
   *
   * @param {object} params - Paramètres de la requête.
   * @param {string} [params.model] - Modèle à utiliser (par défaut: modèle configuré dans .env).
   * @param {AgentMessage[]} params.messages - Historique des messages formaté pour l'API.
   * @param {OpenAIToolDefinition[]} [params.tools] - Spécifications des outils activés.
   * @param {number} [params.temperature=0.0] - Température d'échantillonnage (0.0 pour un code déterministe).
   * @param {AbortSignal} [params.signal] - Signal d'annulation de la requête.
   * @returns {AsyncGenerator<DeepSeekStreamChunk, void, unknown>} Générateur asynchrone des morceaux de réponse.
   */
  public async *streamChat(params: {
    model?: string;
    messages: AgentMessage[];
    tools?: OpenAIToolDefinition[];
    temperature?: number;
    signal?: AbortSignal;
  }): AsyncGenerator<DeepSeekStreamChunk, void, unknown> {
    const selectedModel = params.model || this.defaultModel;

    // Convertit les messages internes vers le format attendu par l'API OpenAI / DeepSeek
    const apiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = params.messages.map(msg => {
      if (msg.role === 'tool') {
        return {
          role: 'tool',
          tool_call_id: msg.toolResults?.[0]?.toolCallId || 'call_default',
          content: msg.content,
        };
      }

      if (msg.role === 'assistant') {
        const assistantMsg: OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam = {
          role: 'assistant',
          content: msg.content || null,
        };
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          assistantMsg.tool_calls = msg.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          }));
        }
        return assistantMsg;
      }

      return {
        role: msg.role as 'system' | 'user',
        content: msg.content,
      };
    });

    const requestPayload: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming = {
      model: selectedModel,
      messages: apiMessages,
      stream: true,
      temperature: params.temperature ?? 0.0,
      ...(params.tools && params.tools.length > 0 && { tools: params.tools as any }),
    };

    let fullContent = '';
    let fullThinking = '';
    const partialToolCalls: Map<number, { id: string; name: string; arguments: string }> = new Map();

    const responseStream = await this.openai.chat.completions.create(requestPayload, {
      signal: params.signal,
    });

    for await (const chunk of responseStream) {
      const choice = chunk.choices[0];
      if (!choice) continue;

      const delta = choice.delta as any;

      // 1. Extraction du bloc de raisonnement (Spécifique à DeepSeek-R1 via 'reasoning_content')
      if (delta.reasoning_content) {
        fullThinking += delta.reasoning_content;
        yield {
          type: 'thinking_delta',
          text: delta.reasoning_content,
        };
      }

      // 2. Extraction du contenu textuel standard
      if (delta.content) {
        fullContent += delta.content;
        yield {
          type: 'content_delta',
          text: delta.content,
        };
      }

      // 3. Extraction et assemblage progressif des appels d'outils (Tool Calls)
      if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
        for (const tc of delta.tool_calls) {
          const index = tc.index ?? 0;
          const existing = partialToolCalls.get(index) || {
            id: tc.id || `call_${Date.now()}_${index}`,
            name: tc.function?.name || '',
            arguments: '',
          };

          if (tc.id) existing.id = tc.id;
          if (tc.function?.name) existing.name = tc.function.name;
          if (tc.function?.arguments) existing.arguments += tc.function.arguments;

          partialToolCalls.set(index, existing);

          yield {
            type: 'tool_call_chunk',
            index,
            id: existing.id,
            name: existing.name,
            argumentsDelta: tc.function?.arguments || '',
          };
        }
      }
    }

    // Convertit les appels d'outils assemblés
    const finalToolCalls: ToolCall[] = Array.from(partialToolCalls.values()).map(tc => ({
      id: tc.id,
      type: 'function',
      function: {
        name: tc.name,
        arguments: tc.arguments,
      },
    }));

    yield {
      type: 'completed',
      content: fullContent,
      thinking: fullThinking.length > 0 ? fullThinking : undefined,
      toolCalls: finalToolCalls,
      usage: {
        inputTokens: Math.ceil(JSON.stringify(apiMessages).length / 3.8),
        outputTokens: Math.ceil((fullContent.length + fullThinking.length) / 3.8),
      },
    };
  }
}
