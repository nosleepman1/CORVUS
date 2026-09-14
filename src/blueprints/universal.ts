/**
 * @file universal.ts
 * @description Blueprint universel polyglotte s'appliquant par défaut à n'importe quel langage ou architecture logicielle.
 */

import { BaseBlueprint } from './base.js';
import { StackType } from '../types/blueprints.js';

/**
 * Blueprint universel généraliste pour Corvus.
 */
export class UniversalBlueprint extends BaseBlueprint {
  public readonly id: StackType = 'universal';
  public readonly name = 'Moteur Universel Polyglotte';
  public readonly description =
    'Ingénierie logicielle universelle pour tous les langages et frameworks (Rust, C#, C++, Vue, Angular, Ruby, etc.).';
  public readonly sentinelFiles = [];

  public readonly engineeringRules = [
    'Appliquer les principes d\'ingénierie logicielle propres (Clean Code, SOLID, DRY, KISS, YAGNI).',
    'Respecter scrupuleusement les idiomes, conventions de nommage et standards de la communauté pour le langage ciblé.',
    'Assurer la gestion rigoureuse des erreurs avec types et messages explicites (pas de plantages silencieux).',
    'Isoler les configurations et secrets applicatifs dans des variables d\'environnement ou fichiers de configuration dédiés.',
    'Favoriser une architecture modulaire et facilement testable par injection de dépendances.',
    'Accompagner chaque nouvelle fonctionnalité critique de tests unitaires ou de vérifications automatisées.',
  ];

  public override detect(_workspaceFiles: string[]): number {
    return 0.1; // Score de base par défaut si aucun autre blueprint ne correspond
  }
}
