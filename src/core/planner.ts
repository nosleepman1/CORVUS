/**
 * @file planner.ts
 * @description Moteur de planification et gestionnaire du mode Planification sans exécution (/plan).
 */

export interface PlanStep {
  id: number;
  title: string;
  description: string;
  affectedFiles: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

export interface ExecutionPlan {
  id: string;
  goal: string;
  architectureSummary: string;
  steps: PlanStep[];
  createdAt: Date;
  isApproved: boolean;
}

/**
 * Gestionnaire du mode Planification (Plan Mode) pour l'agent Corvus.
 *
 * Permet d'analyser une demande volumineuse, de concevoir l'architecture
 * et de produire un plan structuré étape par étape avant d'engager toute modification.
 */
export class TaskPlanner {
  private currentPlan?: ExecutionPlan;

  /**
   * Crée un nouveau plan d'exécution structuré.
   *
   * @param {string} goal - L'objectif principal de la tâche.
   * @param {string} summary - Synthèse de la stratégie architecturale.
   * @param {Array<Omit<PlanStep, 'id' | 'status'>>} steps - Les étapes envisagées.
   * @returns {ExecutionPlan} Le plan créé.
   */
  public createPlan(
    goal: string,
    summary: string,
    steps: Array<{ title: string; description: string; affectedFiles: string[] }>,
  ): ExecutionPlan {
    const formattedSteps: PlanStep[] = steps.map((s, index) => ({
      id: index + 1,
      title: s.title,
      description: s.description,
      affectedFiles: s.affectedFiles,
      status: 'pending',
    }));

    this.currentPlan = {
      id: `plan_${Date.now()}`,
      goal,
      architectureSummary: summary,
      steps: formattedSteps,
      createdAt: new Date(),
      isApproved: false,
    };

    return this.currentPlan;
  }

  /**
   * Retourne le plan d'exécution actuellement actif.
   *
   * @returns {ExecutionPlan | undefined} Le plan en cours.
   */
  public getCurrentPlan(): ExecutionPlan | undefined {
    return this.currentPlan;
  }

  /**
   * Approuve le plan actif pour permettre le passage à l'exécution.
   */
  public approvePlan(): void {
    if (this.currentPlan) {
      this.currentPlan.isApproved = true;
    }
  }

  /**
   * Met à jour le statut d'une étape spécifique du plan.
   *
   * @param {number} stepId - Identifiant de l'étape.
   * @param {PlanStep['status']} status - Le nouveau statut.
   */
  public updateStepStatus(stepId: number, status: PlanStep['status']): void {
    if (!this.currentPlan) return;
    const step = this.currentPlan.steps.find(s => s.id === stepId);
    if (step) {
      step.status = status;
    }
  }

  /**
   * Formate le plan actif en texte Markdown lisible pour le terminal ou l'UI.
   *
   * @returns {string} Le plan formaté.
   */
  public formatPlanMarkdown(): string {
    if (!this.currentPlan) return 'Aucun plan actif.';

    const header = `## 📋 PLAN D'EXÉCUTION : ${this.currentPlan.goal}\n\n**Architecture :** ${this.currentPlan.architectureSummary}\n\n### ÉTAPES :`;
    const stepsList = this.currentPlan.steps
      .map(
        s =>
          `${s.id}. [${s.status.toUpperCase()}] **${s.title}**\n   ${s.description}\n   *Fichiers:* ${s.affectedFiles.join(', ') || 'N/A'}`,
      )
      .join('\n\n');

    return `${header}\n\n${stepsList}`;
  }
}
