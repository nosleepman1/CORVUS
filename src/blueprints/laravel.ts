/**
 * @file laravel.ts
 * @description Blueprint expert pour Laravel 11 (PHP 8.2+, PSR-12, Eloquent, FormRequests, Sanctum).
 */

import { BaseBlueprint } from './base.js';
import { StackType } from '../types/blueprints.js';

/**
 * Blueprint d'ingénierie logicielle pour Laravel 11.
 */
export class LaravelBlueprint extends BaseBlueprint {
  public readonly id: StackType = 'laravel';
  public readonly name = 'Laravel 11 (PHP)';
  public readonly description =
    'Développement moderne d\'APIs et d\'applications robustes avec Laravel 11, Eloquent et Sanctum.';
  public readonly sentinelFiles = ['composer.json', 'artisan', 'app/Http/Kernel.php', 'bootstrap/app.php'];

  public readonly engineeringRules = [
    'Conformité stricte aux standards PSR-12 et utilisation des fonctionnalités modernes de PHP 8.2+ (match expressions, readonly classes, typed properties).',
    'Ne jamais mettre de logique métier lourde dans les Contrôleurs : Utiliser des Actions ou Services dédiés.',
    'Validation des requêtes HTTP via des FormRequests dédiées (`StoreUserRequest`, `UpdateUserRequest`) avec règles précises.',
    'Sérialisation et formatage des réponses JSON API avec les API Resources (`JsonResource`) pour découpler les modèles de la vue API.',
    'Migrations de base de données systématiquement accompagnées de Seeders et Factories pour les tests.',
    'Authentification d\'API sécurisée via Laravel Sanctum (Personal Access Tokens) ou Laravel Passport pour OAuth2.',
    'Tests automatisés avec Pest PHP ou PHPUnit.',
  ];
}
