/**
 * @file sandbox.ts
 * @description Confinement d'accès aux fichiers et isolation stricte au sein de l'espace de travail.
 */

import path from 'path';
import fs from 'fs';

/**
 * Gestionnaire d'isolation et de bac à sable pour l'agent Corvus.
 *
 * Empêche toute lecture ou écriture arbitraire en dehors du répertoire racine
 * du projet (protection contre les attaques par Directory Traversal et les fuites de secrets système).
 *
 * @example
 * ```typescript
 * const sandbox = new WorkspaceSandbox('/path/to/project');
 * const safePath = sandbox.resolveSafePath('src/main.ts');
 * ```
 */
export class WorkspaceSandbox {
  private readonly normalizedRoot: string;

  /**
   * Initialise le bac à sable avec la racine du projet.
   *
   * @param {string} workspaceRoot - Chemin absolu ou relatif du projet.
   */
  constructor(workspaceRoot: string) {
    this.normalizedRoot = path.resolve(workspaceRoot);
  }

  /**
   * Obtient le chemin canonique de la racine du workspace.
   *
   * @returns {string} Le chemin normalisé.
   */
  public getRoot(): string {
    return this.normalizedRoot;
  }

  /**
   * Résout et valide qu'un chemin cible se situe strictement à l'intérieur du workspace.
   *
   * @param {string} targetPath - Chemin relatif ou absolu demandé par l'agent.
   * @returns {string} Le chemin absolu et sécurisé.
   * @throws {Error} Si le chemin tente de s'échapper du workspace.
   */
  public resolveSafePath(targetPath: string): string {
    const resolved = path.isAbsolute(targetPath)
      ? path.normalize(targetPath)
      : path.resolve(this.normalizedRoot, targetPath);

    // Vérifie que le chemin résolu commence bien par la racine du workspace
    const relative = path.relative(this.normalizedRoot, resolved);
    const isEscaping = relative.startsWith('..') || path.isAbsolute(relative);

    if (isEscaping) {
      throw new Error(
        `[Violation de Sécurité Sandbox] L'accès au chemin "${targetPath}" est refusé car il se situe en dehors de l'espace de travail "${this.normalizedRoot}".`,
      );
    }

    return resolved;
  }

  /**
   * Vérifie si un chemin donné est confiné dans l'espace de travail sans lever d'exception.
   *
   * @param {string} targetPath - Chemin à vérifier.
   * @returns {boolean} Vrai si le chemin est dans le workspace.
   */
  public isInsideWorkspace(targetPath: string): boolean {
    try {
      this.resolveSafePath(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Vérifie si un fichier ou répertoire existe de manière sécurisée.
   *
   * @param {string} targetPath - Chemin du fichier.
   * @returns {boolean} Vrai si le fichier existe et est sécurisé.
   */
  public exists(targetPath: string): boolean {
    try {
      const safe = this.resolveSafePath(targetPath);
      return fs.existsSync(safe);
    } catch {
      return false;
    }
  }
}
