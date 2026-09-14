/**
 * @file grepTool.ts
 * @description Outil de recherche de motifs textuels ou expressions régulières (Regex) dans les fichiers du projet.
 */

import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { BaseTool } from './base.js';
import { ToolExecutionContext } from '../types/tools.js';
import { WorkspaceSandbox } from '../security/sandbox.js';

/**
 * Schéma Zod pour les arguments de l'outil `grep_search`.
 */
export const GrepInputSchema = z.object({
  query: z.string().min(1).describe('La chaîne de caractères ou expression régulière à rechercher.'),
  caseSensitive: z.boolean().optional().default(false).describe('Activer la sensibilité à la casse.'),
  fileExtension: z
    .string()
    .optional()
    .describe('Extension de fichier optionnelle pour filtrer la recherche (ex: ".ts", ".go", ".php").'),
  maxResults: z.number().int().positive().optional().default(50).describe('Nombre maximal de correspondances à retourner.'),
});

export type GrepInput = z.infer<typeof GrepInputSchema>;

export interface GrepMatch {
  file: string;
  lineNumber: number;
  lineContent: string;
}

export interface GrepOutput {
  query: string;
  totalMatches: number;
  matches: GrepMatch[];
  isTruncated: boolean;
}

/** Répertoires ignorés par défaut lors de la recherche récursive */
const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'target',
  'vendor',
  '.next',
  '.corvus_snapshots',
  '_reference_claude_code',
]);

/**
 * Outil de recherche par expression régulière dans le code source.
 */
export class GrepTool extends BaseTool<GrepInput, GrepOutput> {
  public readonly name = 'grep_search';
  public readonly description =
    'Recherche rapidement une expression ou un mot-clé dans tous les fichiers du projet et renvoie les numéros de lignes.';
  public readonly schema = GrepInputSchema;
  public readonly isReadOnly = true;
  public readonly requiresApproval = false;

  protected async run(input: GrepInput, context: ToolExecutionContext): Promise<GrepOutput> {
    const sandbox = new WorkspaceSandbox(context.workspaceRoot);
    const flags = input.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(input.query, flags);

    const matches: GrepMatch[] = [];
    const maxResults = input.maxResults ?? 50;

    await this.searchDirectory(context.workspaceRoot, context.workspaceRoot, regex, input.fileExtension, matches, maxResults);

    return {
      query: input.query,
      totalMatches: matches.length,
      matches,
      isTruncated: matches.length >= maxResults,
    };
  }

  private async searchDirectory(
    root: string,
    currentDir: string,
    regex: RegExp,
    extensionFilter: string | undefined,
    results: GrepMatch[],
    maxResults: number,
  ): Promise<void> {
    if (results.length >= maxResults) return;

    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (results.length >= maxResults) break;

      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name) && !entry.name.startsWith('.')) {
          await this.searchDirectory(root, fullPath, regex, extensionFilter, results, maxResults);
        }
      } else if (entry.isFile()) {
        if (extensionFilter && !entry.name.endsWith(extensionFilter)) {
          continue;
        }

        // Évite les fichiers binaires ou trop volumineux
        try {
          const stats = await fs.stat(fullPath);
          if (stats.size > 1024 * 1024) continue; // Ignore les fichiers > 1Mo

          const content = await fs.readFile(fullPath, 'utf-8');
          const lines = content.split(/\r?\n/);
          const relativePath = path.relative(root, fullPath).replace(/\\/g, '/');

          for (let i = 0; i < lines.length; i++) {
            if (results.length >= maxResults) break;
            const line = lines[i];
            if (regex.test(line)) {
              results.push({
                file: relativePath,
                lineNumber: i + 1,
                lineContent: line.trim(),
              });
              regex.lastIndex = 0; // Réinitialise l'état global du regex
            }
          }
        } catch {
          // Ignore les erreurs de lecture de fichiers individuels
        }
      }
    }
  }
}
