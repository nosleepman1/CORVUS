/**
 * @file tools.ts
 * @description Interfaces, schémas et contrats pour les outils du moteur agentique Corvus.
 */

import { z } from 'zod';

/**
 * Contexte d'exécution fourni à un outil lorsqu'il est invoqué.
 */
export interface ToolExecutionContext {
  /** Répertoire de travail absolu du projet actif */
  workspaceRoot: string;
  /** Identifiant de la session en cours */
  sessionId: string;
  /** Signal d'annulation permettant d'interrompre l'outil */
  signal?: AbortSignal;
  /** Fonction de rappel pour diffuser des progrès ou des logs en temps réel */
  onProgress?: (message: string) => void;
}

/**
 * Schéma pour la définition d'un outil compatible OpenAI / DeepSeek function calling.
 */
export interface OpenAIToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/**
 * Contrat de base que tout outil Corvus doit implémenter.
 *
 * @template TInput - Type des arguments d'entrée de l'outil.
 * @template TOutput - Type du résultat renvoyé par l'outil.
 */
export interface ITool<TInput = unknown, TOutput = unknown> {
  /** Nom unique de l'outil (ex: 'file_read', 'bash_run') */
  readonly name: string;
  /** Description détaillée de l'outil transmise au modèle LLM */
  readonly description: string;
  /** Schéma Zod pour valider strictement les paramètres d'entrée */
  readonly schema: z.ZodType<TInput>;
  /** Indique si l'outil est en lecture seule (non destructif) */
  readonly isReadOnly: boolean;
  /** Indique si l'outil nécessite une confirmation utilisateur dans le mode par défaut */
  readonly requiresApproval: boolean;

  /**
   * Exécute l'outil avec les arguments validés et le contexte fourni.
   *
   * @param {TInput} input - Les paramètres validés de l'outil.
   * @param {ToolExecutionContext} context - Le contexte d'exécution de la session.
   * @returns {Promise<TOutput>} Le résultat d'exécution.
   */
  execute(input: TInput, context: ToolExecutionContext): Promise<TOutput>;

  /**
   * Convertit la définition de l'outil au format JSON Schema pour l'API DeepSeek.
   *
   * @returns {OpenAIToolDefinition} La spécification de fonction OpenAI / DeepSeek.
   */
  toOpenAISchema(): OpenAIToolDefinition;
}
