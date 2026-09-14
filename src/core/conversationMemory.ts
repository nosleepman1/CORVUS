/**
 * @file conversationMemory.ts
 * @description Gestion de l'historique conversationnel multi-tours et du contexte de session de Corvus.
 */

import { AgentMessage, MessageRole } from '../types/messages.js';

/**
 * Mémoire conversationnelle de l'agent Corvus.
 *
 * Conserve l'historique ordonné des échanges, des pensées (DeepSeek-R1)
 * et des résultats d'outils, avec support de l'exportation et de la réinitialisation.
 *
 * @example
 * ```typescript
 * const memory = new ConversationMemory();
 * memory.addUserMessage("Créer l'entité User");
 * memory.addAssistantMessage("Voici l'entité...", undefined, toolCalls);
 * ```
 */
export class ConversationMemory {
  private messages: AgentMessage[] = [];

  /**
   * Ajoute un message générique à l'historique.
   *
   * @param {AgentMessage} message - Le message à ajouter.
   */
  public addMessage(message: AgentMessage): void {
    this.messages.push(message);
  }

  /**
   * Ajoute le message système initial à la mémoire.
   *
   * @param {string} content - Le texte du prompt système.
   */
  public setSystemPrompt(content: string): void {
    // Si un message système existe déjà en début d'historique, le remplace
    if (this.messages.length > 0 && this.messages[0].role === 'system') {
      this.messages[0] = {
        id: 'msg_sys_root',
        role: 'system',
        content,
        createdAt: new Date(),
      };
    } else {
      this.messages.unshift({
        id: 'msg_sys_root',
        role: 'system',
        content,
        createdAt: new Date(),
      });
    }
  }

  /**
   * Ajoute une requête utilisateur à l'historique.
   *
   * @param {string} content - Le texte saisi par l'utilisateur.
   * @returns {AgentMessage} Le message utilisateur créé.
   */
  public addUserMessage(content: string): AgentMessage {
    const msg: AgentMessage = {
      id: `msg_user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role: 'user',
      content,
      createdAt: new Date(),
    };
    this.messages.push(msg);
    return msg;
  }

  /**
   * Ajoute une réponse de l'assistant à l'historique.
   *
   * @param {string} content - Le texte de réponse généré.
   * @param {string} [thinking] - Le bloc de raisonnement interne (R1).
   * @param {any[]} [toolCalls] - Les appels d'outils associés.
   * @returns {AgentMessage} Le message assistant créé.
   */
  public addAssistantMessage(content: string, thinking?: string, toolCalls?: any[]): AgentMessage {
    const msg: AgentMessage = {
      id: `msg_ast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role: 'assistant',
      content,
      thinking,
      toolCalls,
      createdAt: new Date(),
    };
    this.messages.push(msg);
    return msg;
  }

  /**
   * Ajoute le résultat de l'exécution d'un outil dans l'historique.
   *
   * @param {string} toolCallId - L'ID de l'appel d'outil.
   * @param {string} toolName - Le nom de l'outil.
   * @param {string} result - Le résultat textuel ou JSON.
   * @param {boolean} isError - Indique si l'outil a échoué.
   * @returns {AgentMessage} Le message d'outil créé.
   */
  public addToolResult(toolCallId: string, toolName: string, result: string, isError: boolean): AgentMessage {
    const msg: AgentMessage = {
      id: `msg_tool_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      role: 'tool',
      content: result,
      toolResults: [
        {
          toolCallId,
          toolName,
          content: result,
          isError,
        },
      ],
      createdAt: new Date(),
    };
    this.messages.push(msg);
    return msg;
  }

  /**
   * Récupère l'intégralité des messages de la session.
   *
   * @returns {AgentMessage[]} La liste des messages.
   */
  public getMessages(): AgentMessage[] {
    return [...this.messages];
  }

  /**
   * Remplace l'historique actuel par une nouvelle liste de messages (utilisé après compaction).
   *
   * @param {AgentMessage[]} newMessages - La nouvelle liste de messages.
   */
  public setMessages(newMessages: AgentMessage[]): void {
    this.messages = [...newMessages];
  }

  /**
   * Supprime tous les messages de l'historique sauf le prompt système de base.
   */
  public clear(): void {
    const systemMsg = this.messages.find(m => m.role === 'system');
    this.messages = systemMsg ? [systemMsg] : [];
  }
}
