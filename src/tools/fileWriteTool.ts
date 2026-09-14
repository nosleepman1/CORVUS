/**
 * @file fileWriteTool.ts
 * @description Outil de création et d'écrasement sécurisé de fichiers complets.
 */

import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { BaseTool } from './base.js';
import { ToolExecutionContext } from '../types/tools.js';
import { WorkspaceSandbox } from '../security/sandbox.js';

/**
 * Schéma Zod pour les arguments de l'outil `file_write`.
 */
export const FileWriteInputSchema = z.object({
  path: z.string().min(1).describe('Le chemin relatif du fichier à créer ou écraser.'),
  content: z.string().describe('Le contenu textuel intégral à écrire dans le fichier.'),
  description: z.string().optional().describe('Brève explication du rôle de ce nouveau fichier.'),
});

export type FileWriteInput = z.infer<typeof FileWriteInputSchema>;

/**
 * Résultat retourné par l'outil `file_write`.
 */
export interface FileWriteOutput {
  path: string;
  bytesWritten: number;
  linesCount: number;
  status: 'created' | 'overwritten';
}

/**
 * Outil permettant à l'agent de créer de nouveaux fichiers dans le projet.
 *
 * Crée automatiquement les répertoires parents s'ils n'existent pas encore
 * et garantit l'écriture atomique dans le workspace.
 */
export class FileWriteTool extends BaseTool<FileWriteInput, FileWriteOutput> {
  public readonly name = 'file_write';
  public readonly description =
    'Crée un nouveau fichier ou remplace intégralement le contenu d\'un fichier existant.';
  public readonly schema = FileWriteInputSchema;
  public readonly isReadOnly = false;
  public readonly requiresApproval = true;

  protected async run(input: FileWriteInput, context: ToolExecutionContext): Promise<FileWriteOutput> {
    const sandbox = new WorkspaceSandbox(context.workspaceRoot);
    const safePath = sandbox.resolveSafePath(input.path);

    const exists = sandbox.exists(input.path);
    const parentDir = path.dirname(safePath);

    // Crée les dossiers parents si nécessaire
    await fs.mkdir(parentDir, { recursive: true });

    // Écrit le contenu dans le fichier
    await fs.writeFile(safePath, input.content, 'utf-8');

    const linesCount = input.content.split(/\r?\n/).length;
    const bytesWritten = Buffer.byteLength(input.content, 'utf-8');

    return {
      path: input.path,
      bytesWritten,
      linesCount,
      status: exists ? 'overwritten' : 'created',
    };
  }
}
