/**
 * @file nestjs.ts
 * @description Blueprint expert pour NestJS (TypeScript, Clean Architecture, TypeORM/Prisma, DTOs).
 */

import { BaseBlueprint } from './base.js';
import { StackType } from '../types/blueprints.js';

/**
 * Blueprint d'ingénierie logicielle pour NestJS.
 */
export class NestJsBlueprint extends BaseBlueprint {
  public readonly id: StackType = 'nestjs';
  public readonly name = 'NestJS (TypeScript)';
  public readonly description =
    'Architecture modulaire d\'entreprise avec NestJS, injection de dépendances, DTOs class-validator et TypeORM/Prisma.';
  public readonly sentinelFiles = ['nest-cli.json', 'src/app.module.ts', 'src/main.ts'];

  public readonly engineeringRules = [
    'Architecture modulaire stricte : Chaque fonctionnalité possède son propre module (`FeatureModule`), contrôleur, service et entités.',
    'Validation rigoureuse des requêtes avec les DTOs (`class-validator` et `class-transformer`) et activation globale du ValidationPipe.',
    'Gestion propre des erreurs HTTP avec des `HttpException` appropriées (NotFoundException, BadRequestException, UnauthorizedException).',
    'Intégration d\'ORM typé (TypeORM ou Prisma) avec utilisation du pattern Repository pour isoler les requêtes de données.',
    'Authentification sécurisée avec Passport.js, stratégie JWT et Guards personnalisés (@UseGuards(JwtAuthGuard)).',
    'Documentation OpenAPI automatique avec les décorateurs `@nestjs/swagger` (@ApiTags, @ApiOperation, @ApiResponse, @ApiProperty).',
    'Tests unitaires avec Jest et tests end-to-end (e2e) avec Supertest.',
  ];
}
