/**
 * @file theme.ts
 * @description Palette de couleurs, icônes et styles pour l'interface de terminal React+Ink de Corvus.
 */

import chalk from 'chalk';
import figures from 'figures';

/**
 * Tokens de couleurs et de typographie du thème Corvus.
 */
export const theme = {
  /** Couleurs de marque Corvus (Teintes Raven / Indigo / Cyan) */
  brand: chalk.hex('#7C3AED').bold, // Violet Corbeau intense
  brandSecondary: chalk.hex('#06B6D4'), // Cyan électrique
  brandMuted: chalk.hex('#6D28D9'),

  /** Statuts d'exécution */
  success: chalk.hex('#10B981'), // Vert émeraude
  warning: chalk.hex('#F59E0B'), // Ambre
  error: chalk.hex('#EF4444').bold, // Rouge vif
  info: chalk.hex('#3B82F6'), // Bleu cobalt

  /** Éléments de code et diffs */
  diffAdded: chalk.hex('#34D399'),
  diffRemoved: chalk.hex('#F87171'),
  diffHeader: chalk.hex('#9CA3AF').bold,
  codeKeyword: chalk.hex('#F472B6'),
  codeString: chalk.hex('#FBBF24'),
  codeComment: chalk.hex('#6B7280').italic,

  /** Éléments de structure */
  dim: chalk.hex('#4B5563'),
  highlight: chalk.hex('#F3F4F6').bold,
  subtle: chalk.hex('#9CA3AF'),
  command: chalk.hex('#E879F9').bold,

  /** Symboles et icônes CLI universels */
  icons: {
    raven: '🦅',
    sparkle: figures.star,
    check: figures.tick,
    cross: figures.cross,
    warning: figures.warning,
    pointer: figures.pointer,
    bullet: figures.bullet,
    ellipsis: figures.ellipsis,
    gear: '⚙️',
    tool: '🛠️',
    diff: '📝',
    shield: '🛡️',
    lock: '🔒',
    brain: '🧠',
    rocket: '🚀',
    terminal: '$',
  },
} as const;

/**
 * Formate un message de titre pour le terminal.
 *
 * @param {string} text - Le texte du titre à afficher.
 * @returns {string} La chaîne formatée avec bordures et couleurs.
 */
export function formatSectionTitle(text: string): string {
  return `${theme.brand('───')} ${theme.highlight(text)} ${theme.brand('──────────────────────────────────────────────')}`;
}
