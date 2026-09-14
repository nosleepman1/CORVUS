/**
 * @file nextjs.ts
 * @description Blueprint expert pour Next.js 15 (App Router), React 19, Server Actions et Tailwind CSS.
 */

import { BaseBlueprint } from './base.js';
import { StackType } from '../types/blueprints.js';

/**
 * Blueprint d'ingénierie logicielle pour Next.js 15 & React 19.
 */
export class NextJsBlueprint extends BaseBlueprint {
  public readonly id: StackType = 'nextjs';
  public readonly name = 'Next.js 15 & React 19';
  public readonly description =
    'Application moderne Fullstack / Frontend avec App Router, Server Components, Server Actions et Tailwind CSS.';
  public readonly sentinelFiles = ['next.config.js', 'next.config.mjs', 'next.config.ts', 'app/layout.tsx', 'pages/_app.tsx'];

  public readonly engineeringRules = [
    'Adopter l\'App Router de Next.js (répertoire `app/`) avec structure claire (page.tsx, layout.tsx, loading.tsx, error.tsx).',
    'Privilégier les React Server Components (RSC) par défaut. Utiliser "use client" uniquement pour les composants interactifs nécessitant des hooks ou des écouteurs d\'événements.',
    'Utiliser les Server Actions ("use server") pour les mutations de données avec validation de schéma Zod.',
    'Concevoir une interface utilisateur premium avec Tailwind CSS, Lucide Icons, et composants accessibles (Radix UI / Shadcn).',
    'Optimiser le chargement avec next/image, next/font et le streaming Suspense.',
    'Gérer le routage d\'API via les Route Handlers (`app/api/.../route.ts`) avec typage TypeScript strict.',
    'Gérer l\'authentification via NextAuth / Auth.js ou Supabase Auth avec middlewares de protection de routes.',
  ];
}
