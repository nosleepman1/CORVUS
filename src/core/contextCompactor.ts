/**
 * @file contextCompactor.ts
 * @description Algorithme de compression et de compaction de contexte conversationnel pour les longues sessions (/compact).
 */

import { AgentMessage } from '../types/messages.js';
import { ConversationMemory } from './conversationMemory.js';
import { TokenTracker } from '../llm/tokenTracker.js';

export interface CompactionResult {
  originalMessageCount: number;
  compactedMessageCount: number;
  estimatedTokensSaved: number;
  summary: string;
}

/**
 * Moteur de compaction de contexte pour l'agent Corvus.
 *
 * Résume les tours de conversation anciens et élague les sorties d'outils volumineuses
 * pour maintenir la session sous les limites de la fenêtre de contexte du modèle.
 */
export class ContextCompactor {
  /**
   * Compacte la mémoire conversationnelle active.
   *
   * @param {ConversationMemory} memory - La mémoire à compacter.
   * @param {number} [preserveRecentTurns=6] - Nombre de tours récents à conserver intégralement.
   * @returns {CompactionResult} Le rapport de compaction.
   */
  public static compact(memory: ConversationMemory, preserveRecentTurns: number = 6): CompactionResult {
    const messages = memory.getMessages();
    const originalCount = messages.length;

    if (messages.length <= preserveRecentTurns + 2) {
      return {
        originalMessageCount: originalCount,
        compactedMessageCount: originalCount,
        estimatedTokensSaved: 0,
        summary: 'Historique trop court pour nécessiter une compaction.',
      };
    }

    const systemMessage = messages[0].role === 'system' ? messages[0] : undefined;
    const workingMessages = systemMessage ? messages.slice(1) : [...messages];

    const splitIndex = Math.max(0, workingMessages.length - preserveRecentTurns);
    const olderMessages = workingMessages.slice(0, splitIndex);
    const recentMessages = workingMessages.slice(splitIndex);

    // Synthétise les messages anciens
    const summaryPoints: string[] = [];
    for (const msg of olderMessages) {
      if (msg.role === 'user') {
        summaryPoints.push(`- Requête utilisateur: "${msg.content.slice(0, 120)}..."`);
      } else if (msg.role === 'assistant' && msg.content) {
        summaryPoints.push(`- Réponse assistant: "${msg.content.slice(0, 100)}..."`);
      } else if (msg.role === 'tool') {
        const toolName = msg.toolResults?.[0]?.toolName || 'outil';
        summaryPoints.push(`- Exécution de l'outil ${toolName}`);
      }
    }

    const summaryContent = `[RÉSUMÉ DU CONTEXTE PRÉCÉDENT COMPACTÉ]\n${summaryPoints.join('\n')}\n[FIN DU RÉSUMÉ]`;

    const summaryMessage: AgentMessage = {
      id: `msg_summary_${Date.now()}`,
      role: 'user',
      content: summaryContent,
      createdAt: new Date(),
    };

    const newHistory: AgentMessage[] = [];
    if (systemMessage) newHistory.push(systemMessage);
    newHistory.push(summaryMessage);
    newHistory.push(...recentMessages);

    const oldTokenEstimate = messages.reduce((acc, m) => acc + TokenTracker.estimateTokens(m.content), 0);
    const newTokenEstimate = newHistory.reduce((acc, m) => acc + TokenTracker.estimateTokens(m.content), 0);
    const tokensSaved = Math.max(0, oldTokenEstimate - newTokenEstimate);

    memory.setMessages(newHistory);

    return {
      originalMessageCount: originalCount,
      compactedMessageCount: newHistory.length,
      estimatedTokensSaved: tokensSaved,
      summary: `Compaction réussie : ${originalCount} messages réduits à ${newHistory.length} (~${tokensSaved} tokens économisés).`,
    };
  }
}
