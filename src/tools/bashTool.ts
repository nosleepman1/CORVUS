/**
 * @file bashTool.ts
 * @description Outil d'exécution de commandes shell/terminal avec capture de flux et gestion des signaux d'annulation.
 */

import { z } from 'zod';
import { spawn } from 'child_process';
import { BaseTool } from './base.js';
import { ToolExecutionContext } from '../types/tools.js';
import { CONTEXT_LIMITS } from '../config/constants.js';

/**
 * Schéma Zod pour les arguments de l'outil `bash_run`.
 */
export const BashInputSchema = z.object({
  command: z.string().min(1).describe('La commande shell ou PowerShell à exécuter.'),
  timeoutMs: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Délai d\'expiration maximal en millisecondes avant interruption forcée.'),
  description: z.string().optional().describe('Explication synthétique de l\'objectif de cette commande.'),
});

export type BashInput = z.infer<typeof BashInputSchema>;

/**
 * Résultat retourné par l'outil `bash_run`.
 */
export interface BashOutput {
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  isTimedOut: boolean;
}

/**
 * Outil permettant à l'agent d'exécuter des commandes système de build, de test, de linter ou de packaging.
 *
 * S'exécute directement dans le répertoire racine du projet et supporte l'interruption
 * gracieuse via AbortSignal et les limites de timeout.
 */
export class BashTool extends BaseTool<BashInput, BashOutput> {
  public readonly name = 'bash_run';
  public readonly description =
    'Exécute une commande shell ou PowerShell (tests unitaires, npm run, go build, php artisan, git, etc.) dans l\'espace de travail.';
  public readonly schema = BashInputSchema;
  public readonly isReadOnly = false;
  public readonly requiresApproval = true;

  protected async run(input: BashInput, context: ToolExecutionContext): Promise<BashOutput> {
    const isWindows = process.platform === 'win32';
    const shellExecutable = isWindows ? 'powershell.exe' : '/bin/bash';
    const shellArgs = isWindows ? ['-NoProfile', '-NonInteractive', '-Command', input.command] : ['-c', input.command];

    const timeout = input.timeoutMs ?? CONTEXT_LIMITS.DEFAULT_BASH_TIMEOUT_MS;
    const startTime = Date.now();

    return new Promise<BashOutput>((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let isTimedOut = false;

      const child = spawn(shellExecutable, shellArgs, {
        cwd: context.workspaceRoot,
        env: {
          ...process.env,
          CI: 'true',
          PAGER: 'cat',
        },
      });

      // Gestion du timeout
      const timer = setTimeout(() => {
        isTimedOut = true;
        child.kill('SIGTERM');
      }, timeout);

      // Gestion du signal d'annulation externe
      if (context.signal) {
        context.signal.addEventListener('abort', () => {
          child.kill('SIGKILL');
        });
      }

      child.stdout.on('data', chunk => {
        const text = chunk.toString();
        stdout += text;
        if (context.onProgress) {
          context.onProgress(text);
        }
      });

      child.stderr.on('data', chunk => {
        const text = chunk.toString();
        stderr += text;
        if (context.onProgress) {
          context.onProgress(text);
        }
      });

      child.on('error', err => {
        clearTimeout(timer);
        reject(new Error(`Erreur lors du lancement de la commande "${input.command}": ${err.message}`));
      });

      child.on('close', code => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;

        resolve({
          command: input.command,
          exitCode: code ?? (isTimedOut ? 124 : 0),
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          durationMs,
          isTimedOut,
        });
      });
    });
  }
}
