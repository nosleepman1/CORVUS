/**
 * @file env.ts
 * @description Validation et chargement typé des variables d'environnement pour Corvus.
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import { DEFAULT_MODELS } from './constants.js';

// Charge les variables d'environnement depuis le fichier .env
dotenv.config();

/**
 * Schéma Zod validant la structure et la conformité des variables d'environnement.
 */
export const EnvSchema = z.object({
  /** Clé API DeepSeek requise pour interagir avec les modèles */
  DEEPSEEK_API_KEY: z.string().min(1, {
    message: 'La variable DEEPSEEK_API_KEY est requise. Veuillez la définir dans votre fichier .env ou dans votre environnement.',
  }).default('sk-placeholder-key'),

  /** URL de base de l'API DeepSeek */
  DEEPSEEK_BASE_URL: z.string().url().default('https://api.deepseek.com'),

  /** Modèle standard pour les échanges courants et la génération de code */
  CORVUS_MODEL: z.string().default(DEFAULT_MODELS.CHAT),

  /** Modèle de raisonnement architectural avancé */
  CORVUS_REASONER_MODEL: z.string().default(DEFAULT_MODELS.REASONER),

  /** Mode de gestion des permissions ('default' | 'plan' | 'bypass') */
  CORVUS_PERMISSION_MODE: z.enum(['default', 'plan', 'bypass']).default('default'),

  /** Port d'écoute pour le serveur WebSocket Daemon */
  CORVUS_DAEMON_PORT: z.coerce.number().int().positive().default(3080),

  /** Niveau de verbosité des journaux applicatifs */
  CORVUS_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

/**
 * Type inféré de la configuration environnementale de Corvus.
 */
export type EnvConfig = z.infer<typeof EnvSchema>;

/**
 * Charge et valide les variables d'environnement courantes.
 *
 * @returns {EnvConfig} La configuration validée et fortement typée.
 * @throws {z.ZodError} Si une variable obligatoire est invalide ou manquante.
 *
 * @example
 * ```typescript
 * import { loadEnv } from '@/config/env.js';
 * const config = loadEnv();
 * console.log(`Clé DeepSeek configurée : ${config.DEEPSEEK_BASE_URL}`);
 * ```
 */
export function loadEnv(): EnvConfig {
  const result = EnvSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = result.error.errors
      .map(err => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    console.warn(`[Corvus Warning] Certaines variables d'environnement sont incomplètes :\n${errorDetails}`);
    return EnvSchema.parse({});
  }

  return result.data;
}

/**
 * Instance globale de la configuration environnementale.
 */
export const env = loadEnv();
