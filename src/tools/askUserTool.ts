/**
 * @file askUserTool.ts
 * @description Outil permettant à l'agent d'interroger directement l'utilisateur en cas d'ambiguïté ou de choix de conception.
 */

import { z } from 'zod';
import { BaseTool } from './base.js';
import { ToolExecutionContext } from '../types/tools.js';

export const AskUserInputSchema = z.object({
  question: z.string().min(1).describe('La question claire et précise à poser à l\'utilisateur.'),
  options: z
    .array(z.string())
    .optional()
    .describe('Liste optionnelle de choix prédéfinis pour guider la réponse.'),
});

export type AskUserInput = z.infer<typeof AskUserInputSchema>;

export interface AskUserOutput {
  question: string;
  response: string;
}

/**
 * Outil de sollicitation interactive de l'utilisateur par l'agent.
 */
export class AskUserTool extends BaseTool<AskUserInput, AskUserOutput> {
  public readonly name = 'ask_user';
  public readonly description =
    'Pose une question à l\'utilisateur pour clarifier un besoin fonctionnel ou choisir entre plusieurs options techniques.';
  public readonly schema = AskUserInputSchema;
  public readonly isReadOnly = true;
  public readonly requiresApproval = false;

  protected async run(input: AskUserInput, context: ToolExecutionContext): Promise<AskUserOutput> {
    // Par défaut dans le runtime ReAct, la question est retransmise à la couche UI / Bridge
    return {
      question: input.question,
      response: 'Réponse transmise via le canal interactif de Corvus.',
    };
  }
}
