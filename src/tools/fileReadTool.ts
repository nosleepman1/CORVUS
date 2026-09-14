/**
 * @file fileReadTool.ts
 * @description Outil de lecture sécurisée de fichiers texte et code source avec support de plages de lignes.
 */

import { z } from 'zod';
import fs from 'fs/promises';
import { BaseTool } from './base.js';
import { ToolExecutionContext } from '../types/tools.js';
import { WorkspaceSandbox } from '../security/sandbox.js';

/**
 * Schéma Zod pour les arguments de l'outil `file_read`.
 */
export const FileReadInputSchema = z.object({
  path: z.string().min(1).describe('Le chemin relatif ou absolu du fichier à lire.'),
  startLine: z.number().int().positive().optional().describe('Numéro de la première ligne à lire (1-indexé).'),
  endLine: z.number().int().positive().optional().describe('Numéro de la dernière ligne à lire (inclusive).'),
});

export type FileReadInput = z.infer<typeof FileReadInputSchema>;

/**
 * Résultat retourné par l'outil `file_read`.
 */
export interface FileReadOutput {
  path: string;
  totalLines: number;
  content: string;
  startLine: number;
  endLine: number;
  isTruncated: boolean;
}

/**
 * Outil permettant à l'agent de lire le contenu de fichiers de code source en toute sécurité.
 *
 * Supporte le découpage par plages de lignes pour économiser le budget de tokens
 * et affiche les numéros de lignes pour faciliter les futures éditions chirurgicales.
 */
export class FileReadTool extends BaseTool<FileReadInput, FileReadOutput> {
  public readonly name = 'file_read';
  public readonly description =
    'Lit le contenu d\'un fichier du projet. Vous pouvez spécifier une plage de lignes (startLine, endLine) pour cibler une fonction spécifique.';
  public readonly schema = FileReadInputSchema;
  public readonly isReadOnly = true;
  public readonly requiresApproval = false;

  protected async run(input: FileReadInput, context: ToolExecutionContext): Promise<FileReadOutput> {
    const sandbox = new WorkspaceSandbox(context.workspaceRoot);
    const safePath = sandbox.resolveSafePath(input.path);

    let rawContent: string;
    try {
      rawContent = await fs.readFile(safePath, 'utf-8');
    } catch (err: any) {
      throw new Error(`Impossible de lire le fichier "${input.path}": ${err.message}`);
    }

    const allLines = rawContent.split(/\r?\n/);
    const totalLines = allLines.length;

    const startLine = Math.max(1, input.startLine ?? 1);
    const endLine = Math.min(totalLines, input.endLine ?? totalLines);

    if (startLine > totalLines) {
      throw new Error(
        `startLine (${startLine}) est supérieur au nombre total de lignes du fichier (${totalLines}).`,
      );
    }

    const selectedLines = allLines.slice(startLine - 1, endLine);
    const numberedContent = selectedLines
      .map((line, index) => {
        const lineNum = (startLine + index).toString().padStart(4, ' ');
        return `${lineNum} | ${line}`;
      })
      .join('\n');

    return {
      path: input.path,
      totalLines,
      startLine,
      endLine,
      content: numberedContent,
      isTruncated: startLine > 1 || endLine < totalLines,
    };
  }
}
