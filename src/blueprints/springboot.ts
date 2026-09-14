/**
 * @file springboot.ts
 * @description Blueprint expert pour Java 21+ et Spring Boot 3 (Maven / Gradle, JPA/Hibernate, Spring Security).
 */

import { BaseBlueprint } from './base.js';
import { StackType } from '../types/blueprints.js';

/**
 * Blueprint d'ingénierie logicielle pour l'écosystème Java & Spring Boot 3.
 */
export class SpringBootBlueprint extends BaseBlueprint {
  public readonly id: StackType = 'springboot';
  public readonly name = 'Java Spring Boot 3';
  public readonly description =
    'Architecture d\'entreprise Java 21+ avec Spring Boot 3, Spring Data JPA, DTO Records et Spring Security.';
  public readonly sentinelFiles = ['pom.xml', 'build.gradle', 'build.gradle.kts', 'mvnw', 'gradlew'];

  public readonly engineeringRules = [
    'Utiliser Java 21+ avec les Java Records pour tous les DTOs et objets de transfert de données.',
    'Respecter l\'architecture en couches stricte : Controller -> Service (Interface + Impl) -> Repository (Spring Data JPA) -> Entity.',
    'Valider systématiquement les requêtes entrantes avec Jakarta Validation (@Valid, @NotNull, @NotBlank, @Size, @Email).',
    'Gérer les erreurs et exceptions via un @RestControllerAdvice global retournant une structure JSON ProblemDetail ou ApiError standardisée.',
    'Utiliser Lombok (@Getter, @Setter, @Builder, @RequiredArgsConstructor) pour alléger les entités JPA.',
    'Gérer les migrations de base de données avec Flyway ou Liquibase plutôt que ddl-auto=update en production.',
    'Documenter automatiquement les endpoints avec SpringDoc OpenAPI (@Operation, @ApiResponse, @Tag).',
    'Écrire des tests unitaires et d\'intégration complets avec JUnit 5, Mockito et @SpringBootTest.',
  ];
}
