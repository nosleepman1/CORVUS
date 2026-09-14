/**
 * @file base.ts
 * @description Classe abstraite de base pour les Blueprints de frameworks de Corvus.
 */

import { IBlueprint, StackType } from '../types/blueprints.js';

/**
 * Classe abstraite définissant la structure standard d'un Blueprint de framework pour Corvus.
 *
 * Fournit les mécanismes de détection de fichiers sentinelles et la génération de règles d'ingénierie.
 */
export abstract class BaseBlueprint implements IBlueprint {
  public abstract readonly id: StackType;
  public abstract readonly name: string;
  public abstract readonly description: string;
  public abstract readonly engineeringRules: string[];
  public abstract readonly sentinelFiles: string[];

  /**
   * Analyse les fichiers à la racine du workspace pour déterminer le score de correspondance.
   *
   * @param {string[]} workspaceFiles - Fichiers présents à la racine du projet.
   * @returns {number} Score entre 0.0 (aucun match) et 1.0 (match certain).
   */
  public detect(workspaceFiles: string[]): number {
    const fileSet = new Set(workspaceFiles.map(f => f.toLowerCase()));
    let matches = 0;

    for (const sentinel of this.sentinelFiles) {
      if (fileSet.has(sentinel.toLowerCase())) {
        matches += 1;
      }
    }

    if (matches === 0) return 0;
    return Math.min(1.0, matches / Math.max(1, this.sentinelFiles.length));
  }

  /**
   * Formate les règles d'ingénierie sous forme de bloc markdown injecté dans le prompt système.
   *
   * @returns {string} Le bloc de règles du Blueprint.
   */
  public getSystemPromptContribution(): string {
    const rulesList = this.engineeringRules.map(rule => `- ${rule}`).join('\n');
    return `### RÈGLES D'EXCELLENCE POUR ${this.name.toUpperCase()} :\n${rulesList}\n`;
  }
}
