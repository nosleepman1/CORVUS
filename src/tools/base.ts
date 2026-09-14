/**
 * @file base.ts
 * @description Classe abstraite fondamentale pour tous les outils de l'agent Corvus.
 */

import { z } from 'zod';
import { ITool, OpenAIToolDefinition, ToolExecutionContext } from '../types/tools.js';

/**
 * Classe abstraite servant de modèle de base pour chaque outil de Corvus.
 *
 * Implémente la validation Zod automatique, la conversion vers le schéma OpenAI / DeepSeek
 * et standardise la gestion des erreurs d'exécution.
 *
 * @template TInput - Type des arguments d'entrée.
 * @template TOutput - Type de la valeur de retour.
 */
export abstract class BaseTool<TInput = unknown, TOutput = unknown> implements ITool<TInput, TOutput> {
  public abstract readonly name: string;
  public abstract readonly description: string;
  public abstract readonly schema: z.ZodType<TInput, any, any>;
  public abstract readonly isReadOnly: boolean;
  public abstract readonly requiresApproval: boolean;

  /**
   * Méthode interne exécutant la logique propre à l'outil après validation des entrées.
   *
   * @param {TInput} input - Entrées validées par le schéma Zod.
   * @param {ToolExecutionContext} context - Contexte du workspace et de la session.
   * @returns {Promise<TOutput>} Le résultat de l'opération.
   */
  protected abstract run(input: TInput, context: ToolExecutionContext): Promise<TOutput>;

  /**
   * Point d'entrée public pour exécuter l'outil, validant d'abord les paramètres.
   *
   * @param {TInput} rawInput - Les arguments bruts fournis par le modèle LLM.
   * @param {ToolExecutionContext} context - Le contexte de la session.
   * @returns {Promise<TOutput>} Le résultat de l'exécution.
   * @throws {Error} Si les arguments ne correspondent pas au schéma Zod.
   */
  public async execute(rawInput: TInput, context: ToolExecutionContext): Promise<TOutput> {
    const parseResult = this.schema.safeParse(rawInput);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors
        .map(e => `Paramètre invalide '${e.path.join('.')}': ${e.message}`)
        .join('; ');
      throw new Error(`[Erreur d'Arguments pour l'outil ${this.name}] ${errorMsg}`);
    }

    return await this.run(parseResult.data, context);
  }

  /**
   * Convertit le schéma Zod de l'outil vers une spécification JSON Schema pour l'API DeepSeek.
   *
   * @returns {OpenAIToolDefinition} La définition d'outil compatible OpenAI / DeepSeek.
   */
  public toOpenAISchema(): OpenAIToolDefinition {
    const jsonSchema = this.zodToJsonSchema(this.schema);
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: jsonSchema,
      },
    };
  }

  /**
   * Transforme un schéma Zod en schéma JSON compatible avec le function calling des LLMs.
   */
  protected zodToJsonSchema(schema: z.ZodType<any>): Record<string, unknown> {
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        const fieldSchema = value as z.ZodType<any>;
        properties[key] = this.convertZodType(fieldSchema);
        if (!fieldSchema.isOptional()) {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required,
        additionalProperties: false,
      };
    }

    return { type: 'object', properties: {} };
  }

  private convertZodType(val: z.ZodType<any>): Record<string, unknown> {
    if (val instanceof z.ZodString) {
      return { type: 'string', description: val.description };
    }
    if (val instanceof z.ZodNumber) {
      return { type: 'number', description: val.description };
    }
    if (val instanceof z.ZodBoolean) {
      return { type: 'boolean', description: val.description };
    }
    if (val instanceof z.ZodArray) {
      return { type: 'array', items: this.convertZodType((val as any).element) };
    }
    if (val instanceof z.ZodEnum) {
      return { type: 'string', enum: (val as any).options };
    }
    if (val instanceof z.ZodOptional) {
      return this.convertZodType((val as any).unwrap());
    }
    return { type: 'string' };
  }
}
