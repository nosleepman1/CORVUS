/**
 * @file python.ts
 * @description Blueprint expert pour Python (FastAPI, Django REST Framework, Pydantic v2, SQLAlchemy).
 */

import { BaseBlueprint } from './base.js';
import { StackType } from '../types/blueprints.js';

/**
 * Blueprint d'ingénierie logicielle pour Python (FastAPI & Django).
 */
export class PythonBlueprint extends BaseBlueprint {
  public readonly id: StackType = 'python';
  public readonly name = 'Python (FastAPI & Django / DRF)';
  public readonly description =
    'APIs et backends Python modernes, typés et asynchrones avec FastAPI ou Django REST Framework.';
  public readonly sentinelFiles = [
    'pyproject.toml',
    'requirements.txt',
    'Pipfile',
    'manage.py',
    'main.py',
    'setup.py',
  ];

  public readonly engineeringRules = [
    'Typage statique strict avec Python 3.10+ (typing, Union, Optional, List, Dict, TypeVar).',
    'Pour FastAPI : Validation systématique des schémas d\'entrée et sortie avec Pydantic v2 (BaseModel, Field, validator).',
    'Utilisation des fonctions asynchrones (async/await) pour les opérations d\'I/O réseau et base de données.',
    'Gestion de base de données asynchrone avec SQLAlchemy 2.0 (AsyncSession) ou Django ORM avec migrations Alembic / Django.',
    'Injection de dépendances avec Depends() de FastAPI pour la gestion des sessions DB, sécurité et authentification JWT.',
    'Pour Django / DRF : Sérialiseurs ModelSerializer stricts, ViewSets modulaires, permissions IsAuthenticated et pagination.',
    'Tests automatisés avec pytest, pytest-asyncio, et couverture avec pytest-cov.',
  ];
}
