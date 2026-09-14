/**
 * @file registry.ts
 * @description Registre centralisé et gestionnaire d'outils pour l'agent Corvus.
 */

import { ITool, OpenAIToolDefinition } from '../types/tools.js';
import { FileReadTool } from './fileReadTool.js';
import { FileWriteTool } from './fileWriteTool.js';
import { FileEditTool } from './fileEditTool.js';
import { BashTool } from './bashTool.js';
import { GrepTool } from './grepTool.js';
import { GlobTool } from './globTool.js';
import { GitSnapshotTool } from './gitSnapshotTool.js';
import { AskUserTool } from './askUserTool.js';

/**
 * Registre centralisant tous les outils mis à disposition de l'agent Corvus.
 *
 * Permet l'enregistrement dynamique d'outils, la récupération par nom
 * et l'exportation des définitions de fonctions au format JSON Schema pour DeepSeek.
 *
 * @example
 * ```typescript
 * const registry = ToolRegistry.createDefaultRegistry();
 * const schemas = registry.toOpenAISchemas();
 * const tool = registry.getTool('file_read');
 * ```
 */
export class ToolRegistry {
  private tools: Map<string, ITool<any, any>> = new Map();

  /**
   * Enregistre un nouvel outil dans le registre.
   *
   * @param {ITool<any, any>} tool - L'instance de l'outil à enregistrer.
   */
  public register(tool: ITool<any, any>): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Récupère un outil par son nom.
   *
   * @param {string} name - Le nom unique de l'outil.
   * @returns {ITool<any, any> | undefined} L'outil correspondant ou undefined s'il n'existe pas.
   */
  public getTool(name: string): ITool<any, any> | undefined {
    return this.tools.get(name);
  }

  /**
   * Retourne la liste de tous les outils actuellement enregistrés.
   *
   * @returns {ITool<any, any>[]} Tableau de tous les outils.
   */
  public getAllTools(): ITool<any, any>[] {
    return Array.from(this.tools.values());
  }

  /**
   * Génère la liste des spécifications d'outils compatibles OpenAI / DeepSeek function calling.
   *
   * @returns {OpenAIToolDefinition[]} Définitions prêtes pour l'appel API.
   */
  public toOpenAISchemas(): OpenAIToolDefinition[] {
    return this.getAllTools().map(tool => tool.toOpenAISchema());
  }

  /**
   * Fabrique et retourne une instance du registre contenant la panoplie complète d'outils par défaut de Corvus.
   *
   * @returns {ToolRegistry} Le registre prêt à l'emploi.
   */
  public static createDefaultRegistry(): ToolRegistry {
    const registry = new ToolRegistry();

    registry.register(new FileReadTool());
    registry.register(new FileWriteTool());
    registry.register(new FileEditTool());
    registry.register(new BashTool());
    registry.register(new GrepTool());
    registry.register(new GlobTool());
    registry.register(new GitSnapshotTool());
    registry.register(new AskUserTool());

    return registry;
  }
}
