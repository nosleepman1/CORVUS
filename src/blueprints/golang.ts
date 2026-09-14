/**
 * @file golang.ts
 * @description Blueprint expert pour Go (Golang, Standard Layout, Gin / Fiber, GORM, Clean Architecture).
 */

import { BaseBlueprint } from './base.js';
import { StackType } from '../types/blueprints.js';

/**
 * Blueprint d'ingénierie logicielle pour Go (Golang).
 */
export class GolangBlueprint extends BaseBlueprint {
  public readonly id: StackType = 'golang';
  public readonly name = 'Go (Golang)';
  public readonly description =
    'Architecture propre et performante en Go avec Gin ou Fiber, standard project layout et GORM/SQLX.';
  public readonly sentinelFiles = ['go.mod', 'go.sum', 'main.go'];

  public readonly engineeringRules = [
    'Adopter le Standard Go Project Layout : `cmd/`, `internal/` (code privé), `pkg/` (code réutilisable), `api/`.',
    'Gestion des erreurs idiomatique : Toujours vérifier `if err != nil`, enrichir le contexte d\'erreur avec `fmt.Errorf("action: %w", err)`.',
    'Clean Architecture : Découper en couches claires : Handlers (HTTP/gRPC) -> UseCases / Services -> Repositories -> Domain Entities.',
    'Utiliser des interfaces Go fines et définies là où elles sont consommées (principe d\'inversion de dépendances).',
    'Gestion de la concurrence sûre avec des Goroutines encadrées par `context.Context` et `sync.WaitGroup` ou channels.',
    'Accès base de données avec GORM ou SQLX avec utilisation systématique du contexte (`WithContext(ctx)`).',
    'Tests unitaires avec le package standard `testing` et assertions avec `github.com/stretchr/testify`.',
  ];
}
