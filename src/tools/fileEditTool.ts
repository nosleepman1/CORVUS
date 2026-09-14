/**
 * @file fileEditTool.ts
 * @description Outil d'édition chirurgicale de fichiers par remplacement ciblé de blocs de code avec calcul de diff unifié.
 */

import { z } from 'zod';
import fs from 'fs/promises';
import { createPatch } from 'diff';
import { BaseTool } from './base.js';
import { ToolExecutionContext } from '../types/tools.js';
import { WorkspaceSandbox } from '../security/sandbox.js';

/**
 * Schéma Zod pour les arguments de l'outil `file_edit`.
 */
export const FileEditInputSchema = z.object({
  path: z.string().min(1).describe('Chemin relatif du fichier à modifier.'),
  targetContent: z
    .string()
    .min(1)
    .describe('Le bloc de texte ou de code exact existant à remplacer (incluant indentation et retours à la ligne).'),
  replacementContent: z
    .string()
    .describe('Le nouveau bloc de texte ou de code qui doit remplacer le bloc ciblé.'),
  description: z.string().optional().describe('Explication synthétique du changement apporté.'),
});

export type FileEditInput = z.infer<typeof FileEditInputSchema>;

/**
 * Résultat retourné par l'outil `file_edit`.
 */
export interface FileEditOutput {
  path: string;
  diff: string;
  appliedCount: number;
  message: string;
}

/**
 * Outil d'édition chirurgicale de fichiers de code.
 *
 * Évite la réécriture complète de fichiers volumineux en remplaçant précisément
 * une séquence de code ciblée par son équivalent corrigé ou enrichi.
 * Génère automatiquement un diff unifié pour la prévisualisation dans le terminal ou l'UI Desktop.
 */
export class FileEditTool extends BaseTool<FileEditInput, FileEditOutput> {
  public readonly name = 'file_edit';
  public readonly description =
    'Modifie chirurgicalement une partie d\'un fichier existant en remplaçant une chaîne cible exacte par un nouveau contenu.';
  public readonly schema = FileEditInputSchema;
  public readonly isReadOnly = false;
  public readonly requiresApproval = true;

  protected async run(input: FileEditInput, context: ToolExecutionContext): Promise<FileEditOutput> {
    const sandbox = new WorkspaceSandbox(context.workspaceRoot);
    const safePath = sandbox.resolveSafePath(input.path);

    let originalContent: string;
    try {
      originalContent = await fs.readFile(safePath, 'utf-8');
    } catch (err: any) {
      throw new Error(`Impossible d'ouvrir le fichier "${input.path}" pour modification: ${err.message}`);
    }

    // Normalise les fins de ligne CRLF / LF pour éviter les faux négatifs
    const normalizedOriginal = originalContent.replace(/\r\n/g, '\n');
    const normalizedTarget = input.targetContent.replace(/\r\n/g, '\n');
    const normalizedReplacement = input.replacementContent.replace(/\r\n/g, '\n');

    const occurrences = normalizedOriginal.split(normalizedTarget).length - 1;

    if (occurrences === 0) {
      throw new Error(
        `Le bloc cible ('targetContent') est introuvable dans "${input.path}". Assurez-vous d'avoir lu le fichier au préalable avec 'file_read' et que les espaces/indentations correspondent exactement.`,
      );
    }

    if (occurrences > 1) {
      throw new Error(
        `Le bloc cible ('targetContent') apparaît ${occurrences} fois dans "${input.path}". Veuillez inclure plus de lignes de contexte autour du bloc pour rendre le remplacement univoque.`,
      );
    }

    // Effectue le remplacement unique
    const updatedContent = normalizedOriginal.replace(normalizedTarget, normalizedReplacement);

    // Écrit le fichier mis à jour
    await fs.writeFile(safePath, updatedContent, 'utf-8');

    // Génère le diff unifié pour l'affichage visuel
    const diff = createPatch(input.path, originalContent, updatedContent, 'Original', 'Modifié');

    return {
      path: input.path,
      diff,
      appliedCount: 1,
      message: `Modification appliquée avec succès dans "${input.path}".`,
    };
  }
}
