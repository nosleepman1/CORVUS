/**
 * @file registry.ts
 * @description Registre centralisé des Blueprints et détecteur automatique de stack logicielle pour Corvus.
 */

import fs from 'fs/promises';
import { IBlueprint, StackDetectionResult, StackType } from '../types/blueprints.js';
import { SpringBootBlueprint } from './springboot.js';
import { NextJsBlueprint } from './nextjs.js';
import { PythonBlueprint } from './python.js';
import { NestJsBlueprint } from './nestjs.js';
import { GolangBlueprint } from './golang.js';
import { LaravelBlueprint } from './laravel.js';
import { UniversalBlueprint } from './universal.js';

/**
 * Registre des Blueprints et moteur de détection intelligente de framework pour Corvus.
 *
 * Inspecte la racine du projet pour identifier automatiquement la stack technologique
 * et activer les règles d'architecture correspondantes.
 *
 * @example
 * ```typescript
 * const registry = BlueprintRegistry.createDefaultRegistry();
 * const detection = await registry.autoDetectStack('/path/to/project');
 * console.log(`Stack détectée : ${detection.detectedStack} (${detection.summary})`);
 * ```
 */
export class BlueprintRegistry {
  private blueprints: Map<StackType, IBlueprint> = new Map();

  /**
   * Enregistre un Blueprint dans le registre.
   *
   * @param {IBlueprint} blueprint - L'instance du Blueprint.
   */
  public register(blueprint: IBlueprint): void {
    this.blueprints.set(blueprint.id, blueprint);
  }

  /**
   * Récupère un Blueprint par son identifiant unique.
   *
   * @param {StackType} id - L'identifiant de la stack ('laravel', 'nestjs', 'golang', etc.).
   * @returns {IBlueprint | undefined} Le Blueprint ou undefined s'il n'existe pas.
   */
  public getBlueprint(id: StackType): IBlueprint | undefined {
    return this.blueprints.get(id);
  }

  /**
   * Retourne la liste de tous les Blueprints enregistrés.
   *
   * @returns {IBlueprint[]} La collection complète de Blueprints.
   */
  public getAllBlueprints(): IBlueprint[] {
    return Array.from(this.blueprints.values());
  }

  /**
   * Détecte automatiquement la stack d'un projet en examinant les fichiers à la racine du workspace.
   *
   * @param {string} workspaceRoot - Chemin absolu du répertoire projet.
   * @returns {Promise<StackDetectionResult>} Le résultat détaillé de la détection.
   */
  public async autoDetectStack(workspaceRoot: string): Promise<StackDetectionResult> {
    let files: string[] = [];
    try {
      files = await fs.readdir(workspaceRoot);
    } catch {
      files = [];
    }

    let bestBlueprint: IBlueprint = this.getBlueprint('universal') || new UniversalBlueprint();
    let highestScore = 0;
    let matchedSentinels: string[] = [];

    for (const blueprint of this.getAllBlueprints()) {
      if (blueprint.id === 'universal') continue;

      const score = blueprint.detect(files);
      if (score > highestScore) {
        highestScore = score;
        bestBlueprint = blueprint;
        matchedSentinels = blueprint.sentinelFiles.filter(s =>
          files.some(f => f.toLowerCase() === s.toLowerCase()),
        );
      }
    }

    if (highestScore === 0) {
      return {
        detectedStack: 'universal',
        confidence: 1.0,
        matchingFiles: [],
        summary: 'Projet généraliste / Stack mixte (Moteur Universel Polyglotte actif)',
      };
    }

    return {
      detectedStack: bestBlueprint.id,
      confidence: highestScore,
      matchingFiles: matchedSentinels,
      summary: `Stack ${bestBlueprint.name} identifiée via : ${matchedSentinels.join(', ')}`,
    };
  }

  /**
   * Crée et initialise le registre par défaut avec l'ensemble des Blueprints supportés.
   *
   * @returns {BlueprintRegistry} Le registre prêt à l'emploi.
   */
  public static createDefaultRegistry(): BlueprintRegistry {
    const registry = new BlueprintRegistry();

    registry.register(new SpringBootBlueprint());
    registry.register(new NextJsBlueprint());
    registry.register(new PythonBlueprint());
    registry.register(new NestJsBlueprint());
    registry.register(new GolangBlueprint());
    registry.register(new LaravelBlueprint());
    registry.register(new UniversalBlueprint());

    return registry;
  }
}
