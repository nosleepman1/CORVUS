/**
 * @file blueprints.ts
 * @description Interfaces pour les Blueprints spécialisés (Laravel, NestJS, Go, Spring Boot, Next.js, FastAPI/Django, Universal).
 */

/**
 * Identifiants des écosystèmes et frameworks pris en charge.
 */
export type StackType =
  | 'universal'
  | 'laravel'
  | 'nestjs'
  | 'golang'
  | 'springboot'
  | 'nextjs'
  | 'python';

/**
 * Résultat de l'analyse automatique d'un répertoire de travail.
 */
export interface StackDetectionResult {
  /** Type de stack principal détecté */
  detectedStack: StackType;
  /** Niveau de confiance dans la détection (0 à 1) */
  confidence: number;
  /** Fichiers clés ayant permis la détection (ex: 'pom.xml', 'package.json', 'go.mod') */
  matchingFiles: string[];
  /** Description synthétique de l'écosystème identifié */
  summary: string;
}

/**
 * Structure d'un fichier généré ou recommandé par un Blueprint.
 */
export interface BlueprintFileTemplate {
  /** Chemin relatif du fichier par rapport à la racine du projet */
  relativePath: string;
  /** Description du rôle du fichier */
  purpose: string;
  /** Contenu initial ou modèle du fichier */
  content: string;
}

/**
 * Interface fondamentale d'un Blueprint de framework pour Corvus.
 */
export interface IBlueprint {
  /** Identifiant unique de la stack (ex: 'laravel', 'nestjs', 'golang') */
  readonly id: StackType;
  /** Nom d'affichage du framework (ex: 'NestJS (TypeScript)', 'Go (Golang)') */
  readonly name: string;
  /** Description du domaine d'application */
  readonly description: string;
  /** Liste des conventions et règles strictes injectées dans le prompt système */
  readonly engineeringRules: string[];
  /** Fichiers sentinelles utilisés pour la détection automatique (ex: ['composer.json', 'artisan']) */
  readonly sentinelFiles: string[];

  /**
   * Analyse les fichiers du workspace pour déterminer si ce Blueprint correspond au projet.
   *
   * @param {string[]} workspaceFiles - Liste des noms de fichiers à la racine du projet.
   * @returns {number} Score de confiance entre 0 (aucun match) et 1 (correspondance certaine).
   */
  detect(workspaceFiles: string[]): number;

  /**
   * Fournit les instructions système spécifiques à ce framework pour guider la génération de code.
   *
   * @returns {string} Le bloc d'instructions de haut niveau pour le modèle LLM.
   */
  getSystemPromptContribution(): string;
}
