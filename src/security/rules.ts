/**
 * @file rules.ts
 * @description Règles de sécurité ACL prédéfinies pour l'approbation automatique des opérations courantes.
 */

import { AclRule } from '../types/permissions.js';

/**
 * Liste des règles de contrôle d'accès (ACL) par défaut pour Corvus.
 *
 * Les commandes bénignes (tests, builds, inspections git) sont automatiquement autorisées,
 * tandis que les opérations risquées ou destructives passent par l'approbation interactive.
 */
export const DEFAULT_ACL_RULES: AclRule[] = [
  // 1. Commandes de lecture et statut Git bénignes
  {
    id: 'git-safe-status',
    pattern: 'bash:git status*',
    decision: 'allow',
    description: 'Autoriser la consultation du statut Git',
  },
  {
    id: 'git-safe-diff',
    pattern: 'bash:git diff*',
    decision: 'allow',
    description: 'Autoriser la consultation des diffs Git',
  },
  {
    id: 'git-safe-log',
    pattern: 'bash:git log*',
    decision: 'allow',
    description: 'Autoriser la lecture de l\'historique Git',
  },

  // 2. Commandes de tests unitaires et builds standards
  {
    id: 'npm-test',
    pattern: 'bash:npm test*',
    decision: 'allow',
    description: 'Autoriser l\'exécution des tests npm',
  },
  {
    id: 'go-test',
    pattern: 'bash:go test*',
    decision: 'allow',
    description: 'Autoriser l\'exécution des tests Go',
  },
  {
    id: 'pytest',
    pattern: 'bash:pytest*',
    decision: 'allow',
    description: 'Autoriser l\'exécution des tests Python',
  },
  {
    id: 'mvn-test',
    pattern: 'bash:mvn test*',
    decision: 'allow',
    description: 'Autoriser les tests Maven',
  },

  // 3. Outils de lecture de fichiers
  {
    id: 'read-all',
    pattern: 'read:*',
    decision: 'allow',
    description: 'Autoriser la lecture des fichiers du workspace',
  },
  {
    id: 'grep-all',
    pattern: 'grep:*',
    decision: 'allow',
    description: 'Autoriser la recherche grep dans le workspace',
  },
  {
    id: 'glob-all',
    pattern: 'glob:*',
    decision: 'allow',
    description: 'Autoriser la recherche de fichiers par glob',
  },
];
