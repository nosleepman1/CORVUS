/**
 * @file globTool.ts
 * @description Outil de recherche et d'exploration de fichiers par motifs Glob.
 */

import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import picomatch from 'picomatch';
import { BaseTool } from './base.js';
import { ToolExecutionContext } from '../types/tools.js';

/**
 * Schéma Zod pour les arguments de l'outil `glob_find`.
 */
export const GlobInputSchema = z.object({
  pattern: z
    .string()
    .min(1)
    .describe('Le motif glob de recherche (ex: "**/*.ts", "src/**/*.go", "app/Http/Controllers/*.php").'),
  maxResults: z.number().int().positive().optional().default(100).describe('Nombre maximal de fichiers à retourner.'),
});

export type GlobInput = z.infer<typeof GlobInputSchema>;

export interface GlobOutput {
  pattern: string;
  totalFound: number;
  files: string[];
  isTruncated: boolean;
}

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
 * Outil permettant à l'agent de découvrir la structure des dossiers et de localiser des fichiers par motif.
 */
export class GlobTool extends BaseTool<GlobInput, GlobOutput> {
  public readonly name = 'glob_find';
  public readonly description =
    'Trouve tous les fichiers correspondant à un motif glob (ex: "**/*.ts", "src/models/*.go") dans le projet.';
  public readonly schema = GlobInputSchema;
  public readonly isReadOnly = true;
  public readonly requiresApproval = false;

  protected async run(input: GlobInput, context: ToolExecutionContext): Promise<GlobOutput> {
    const isMatch = picomatch(input.pattern, { dot: true });
    const matchedFiles: string[] = [];
    const maxResults = input.maxResults ?? 100;

    await this.walkDirectory(context.workspaceRoot, context.workspaceRoot, isMatch, matchedFiles, maxResults);

    return {
      pattern: input.pattern,
      totalFound: matchedFiles.length,
      files: matchedFiles,
      isTruncated: matchedFiles.length >= maxResults,
    };
  }

  private async walkDirectory(
    root: string,
    currentDir: string,
    isMatch: (str: string) => boolean,
    results: string[],
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
      const relativePath = path.relative(root, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name) && !entry.name.startsWith('.')) {
          await this.walkDirectory(root, fullPath, isMatch, results, maxResults);
        }
      } else if (entry.isFile()) {
        if (isMatch(relativePath) || isMatch(entry.name)) {
          results.push(relativePath);
        }
      }
    }
  }
}
