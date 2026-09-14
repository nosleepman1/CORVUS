/**
 * @file tokenTracker.ts
 * @description Suivi précis des consommations de tokens et calcul des coûts financiers en temps réel pour DeepSeek.
 */

import { DEEPSEEK_PRICING, DEFAULT_MODELS } from '../config/constants.js';
import { SessionMetrics } from '../types/agent.js';

/**
 * Gestionnaire et compteur de tokens pour la session Corvus.
 *
 * Permet de suivre la consommation de tokens d'entrée, de sortie et de cache,
 * et calcule dynamiquement le coût selon les tarifs officiels de DeepSeek.
 *
 * @example
 * ```typescript
 * const tracker = new TokenTracker('deepseek-chat');
 * tracker.recordUsage({ inputTokens: 1200, outputTokens: 450 });
 * console.log(`Coût estimé : ${tracker.getEstimatedCostFormatted()}`);
 * ```
 */
export class TokenTracker {
  private activeModel: string;
  private totalInputTokens = 0;
  private totalOutputTokens = 0;
  private cacheHitTokens = 0;
  private turnCount = 0;
  private toolsExecutedCount = 0;
  private readonly startedAt = new Date();

  /**
   * Initialise une nouvelle instance du tracker.
   *
   * @param {string} [initialModel=DEFAULT_MODELS.CHAT] - Modèle initialement sélectionné.
   */
  constructor(initialModel: string = DEFAULT_MODELS.CHAT) {
    this.activeModel = initialModel;
  }

  /**
   * Modifie le modèle actif pour les prochains calculs de tarification.
   *
   * @param {string} model - Le nom du modèle actif.
   */
  public setModel(model: string): void {
    this.activeModel = model;
  }

  /**
   * Enregistre la consommation d'un tour d'interaction avec le modèle.
   *
   * @param {object} usage - Détails des tokens consommés.
   * @param {number} usage.inputTokens - Nombre de tokens de prompt.
   * @param {number} usage.outputTokens - Nombre de tokens de réponse.
   * @param {number} [usage.cacheHitTokens=0] - Tokens servis depuis le cache de prompt.
   */
  public recordUsage(usage: {
    inputTokens: number;
    outputTokens: number;
    cacheHitTokens?: number;
  }): void {
    this.totalInputTokens += usage.inputTokens;
    this.totalOutputTokens += usage.outputTokens;
    this.cacheHitTokens += usage.cacheHitTokens ?? 0;
    this.turnCount += 1;
  }

  /**
   * Incrémente le compteur d'outils exécutés.
   */
  public recordToolExecution(): void {
    this.toolsExecutedCount += 1;
  }

  /**
   * Calcule le coût financier cumulé estimé en dollars américains (USD).
   *
   * @returns {number} Le coût estimé en USD.
   */
  public calculateEstimatedCost(): number {
    const pricing =
      this.activeModel === DEFAULT_MODELS.REASONER
        ? DEEPSEEK_PRICING[DEFAULT_MODELS.REASONER]
        : DEEPSEEK_PRICING[DEFAULT_MODELS.CHAT];

    const inputCost = (this.totalInputTokens / 1_000_000) * pricing.inputPerMillionTokens;
    const outputCost = (this.totalOutputTokens / 1_000_000) * pricing.outputPerMillionTokens;
    const cacheHitCost = (this.cacheHitTokens / 1_000_000) * pricing.cacheHitInputPerMillionTokens;

    return Number((inputCost + outputCost + cacheHitCost).toFixed(6));
  }

  /**
   * Formate le coût sous forme de chaîne lisible pour l'utilisateur (ex: '$0.0042 USD').
   *
   * @returns {string} Coût formaté.
   */
  public getEstimatedCostFormatted(): string {
    const cost = this.calculateEstimatedCost();
    return `$${cost.toFixed(4)} USD`;
  }

  /**
   * Renvoie l'instantané complet des métriques de la session courante.
   *
   * @returns {SessionMetrics} L'objet des métriques à jour.
   */
  public getMetrics(): SessionMetrics {
    return {
      totalInputTokens: this.totalInputTokens,
      totalOutputTokens: this.totalOutputTokens,
      cacheHitTokens: this.cacheHitTokens,
      estimatedCostUsd: this.calculateEstimatedCost(),
      turnCount: this.turnCount,
      toolsExecutedCount: this.toolsExecutedCount,
      startedAt: this.startedAt,
    };
  }

  /**
   * Estime approximativement le nombre de tokens d'un texte (règle empirique ~4 caractères par token).
   *
   * @param {string} text - Le texte à évaluer.
   * @returns {number} Nombre approximatif de tokens.
   */
  public static estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 3.8);
  }
}
