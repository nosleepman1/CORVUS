# 🦅 Corvus — Agent d'Ingénierie Logicielle Autonome & Polyglotte

```
  ╭─────────────────────────────────────────────────────────────╮
  │   🦅  C O R V U S  —  A G E N T I C   C O D E   E N G I N E  │
  │   Mascotte : Le Corbeau Façonneur d'Outils                  │
  │   Motorisé par DeepSeek V3 / R1 & Multi-Stack Blueprints    │
  ╰─────────────────────────────────────────────────────────────╯
```

**Corvus** est un agent d'ingénierie logicielle autonome, modulaire et orienté production, conçu en **TypeScript 5.7+ (Node.js 20+ ESM)** et motorisé par les modèles **DeepSeek** (`deepseek-chat` / V3 et `deepseek-reasoner` / R1).

Inspiré des standards d'architecture de *Claude Code* et *Antigravity*, Corvus combine une interface terminal interactive réactive (**React + Ink**), un système de permissions à granularité fine (**ACL & Sandbox**), une suite de **Blueprints experts multi-stack**, et un serveur **WebSocket Daemon (JSON-RPC 2.0)** prêt pour le pilotage par une future application Desktop (**Tauri / Electron**).

---

## 🌟 Points Forts

* **🧠 Cerveau DeepSeek V3 & R1** : Streaming SSE temps réel, extraction des blocs de raisonnement (*ThinkingBlock*), basculement dynamique de modèle et suivi précis des coûts financiers.
* **🛠️ Moteur d'Outils Robuste & Sûr** :
  * `file_read` : Lecture avec support de pagination par plage de lignes et numérotation.
  * `file_write` : Création et écrasement sécurisé avec génération automatique des dossiers parents.
  * `file_edit` : Remplacement chirurgical de code avec validation de contexte et calcul de diffs unifiés.
  * `bash_run` : Exécution de commandes de build/tests avec streaming, timeout et interruption par signal.
  * `grep_search` & `glob_find` : Navigation instantanée par expressions régulières et motifs glob.
  * `git_snapshot` : Sauvegarde automatique d'états pour la fonction de restauration instantanée (`/undo`).
  * `ask_user` : Sollicitation interactive de l'utilisateur en cas d'ambiguïté fonctionnelle.
* **🛡️ Sécurité Sandbox & ACL** :
  * Confinement strict au répertoire du workspace (protection contre le *Directory Traversal*).
  * Système de règles ACL par motifs glob (`bash:git status*`, `edit:src/**`).
  * Boîte de dialogue interactive d'approbation avant toute opération destructive.
* **📐 Suite de Blueprints Multi-Stack & Auto-Détection** :
  * **Java Spring Boot 3** : Java Records, Spring Data JPA, DTOs Jakarta Validation, OpenAPI.
  * **Next.js 15 & React 19** : App Router, Server Actions, Tailwind CSS, Shadcn UI.
  * **Python** : FastAPI asynchrone, Pydantic v2, Django REST Framework, SQLAlchemy 2.0.
  * **NestJS** : Architecture modulaire, DTOs `class-validator`, TypeORM/Prisma, Swagger.
  * **Go (Golang)** : Standard Layout, Clean Architecture, routes Gin/Fiber, GORM.
  * **Laravel 11** : PHP 8.2+, PSR-12, Eloquent, FormRequests, Sanctum.
  * **Moteur Universel Polyglotte** : Support de tout autre langage (Rust, C#, C++, Vue, Angular).
* **🖥️ Double Interface : CLI Réactif & Bridge Desktop** :
  * Terminal réactif avec **React + Ink**, coloration syntaxique, spinners, diffs et autocomplétion.
  * Serveur WebSocket Daemon JSON-RPC 2.0 pour connecter une interface graphique Desktop.

---

## 🏗️ Architecture du Projet

```
corvus/
├── src/
│   ├── index.ts               # Point d'entrée CLI (React + Ink)
│   ├── daemon.ts              # Point d'entrée Serveur Daemon WebSocket (Desktop Bridge)
│   │
│   ├── config/                # Constantes, Thème terminal, Validation .env
│   ├── types/                 # Types stricts (Messages, Outils, Permissions, Blueprints, Bridge)
│   ├── llm/                   # Client DeepSeek, TokenTracker, Prompts Système
│   ├── security/              # WorkspaceSandbox, PermissionManager, Règles ACL
│   ├── tools/                 # FileRead, FileWrite, FileEdit, Bash, Grep, Glob, GitSnapshot, AskUser
│   ├── blueprints/            # Blueprints spécialisés (SpringBoot, NextJS, Python, NestJS, Go, Laravel)
│   ├── core/                  # Agent ReAct, StateStore, ConversationMemory, ContextCompactor, Planner
│   ├── cli/                   # Composants React Ink (Banner, StatusBar, ThinkingBlock, DiffViewer, etc.)
│   └── server/                # Serveur WebSocket JSON-RPC 2.0 et EventDispatcher
│
└── tests/                     # Suite de tests unitaires automatisés
```

---

## 🚀 Installation & Démarrage Rapide

### 1. Prérequis
* **Node.js** >= 20.0.0
* Une clé API **DeepSeek** (disponible sur [platform.deepseek.com](https://platform.deepseek.com/))

### 2. Configuration
Créez votre fichier `.env` à la racine :

```env
DEEPSEEK_API_KEY=sk-votre-cle-api-deepseek
DEEPSEEK_BASE_URL=https://api.deepseek.com
CORVUS_MODEL=deepseek-chat
CORVUS_REASONER_MODEL=deepseek-reasoner
CORVUS_PERMISSION_MODE=default
CORVUS_DAEMON_PORT=3080
```

### 3. Lancement du CLI Interactif
```bash
# Mode développement
npm run dev

# Ou après compilation
npm run build
npm start
```

### 4. Lancement du Serveur Daemon pour App Desktop
```bash
npm run daemon
# Le serveur WebSocket écoutera sur ws://localhost:3080
```

---

## ⌨️ Commandes Slash dans le Terminal

| Commande | Description |
| :--- | :--- |
| `/model [chat\|reasoner]` | Bascule entre DeepSeek V3 (chat/code rapide) et R1 (raisonnement architectural) |
| `/blueprint [stack]` | Affiche ou force la stack (`springboot`, `nextjs`, `python`, `nestjs`, `golang`, `laravel`, `universal`) |
| `/plan` | Active/désactive le mode Planification (aucun fichier modifié sans validation préalable) |
| `/undo` | Restaure le dernier snapshot avant modification de fichiers |
| `/cost` | Affiche le rapport financier de consommation de tokens et coût estimé |
| `/compact` | Compresse l'historique de conversation pour les longues sessions |
| `/doctor` | Diagnostic de santé (outils, permissions, workspace, connectivité) |
| `/clear` | Réinitialise l'historique de conversation |
| `/help` | Affiche la liste des commandes |

---

## 🧪 Tests Automatisés

```bash
# Lancement de la suite de tests unitaires
npm test

# Vérification stricte des types TypeScript
npm run typecheck
```

---

## 📄 Licence
Ce projet est sous licence MIT.
