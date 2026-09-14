/**
 * @file tools.test.ts
 * @description Suite de tests unitaires automatisés pour vérifier tous les outils, la sécurité et les Blueprints de Corvus.
 */

import path from 'path';
import fs from 'fs/promises';
import { WorkspaceSandbox } from '../../src/security/sandbox.js';
import { PermissionManager } from '../../src/security/permissionManager.js';
import { FileWriteTool } from '../../src/tools/fileWriteTool.js';
import { FileReadTool } from '../../src/tools/fileReadTool.js';
import { FileEditTool } from '../../src/tools/fileEditTool.js';
import { GrepTool } from '../../src/tools/grepTool.js';
import { GlobTool } from '../../src/tools/globTool.js';
import { BlueprintRegistry } from '../../src/blueprints/registry.js';
import { TokenTracker } from '../../src/llm/tokenTracker.js';
import { ConversationMemory } from '../../src/core/conversationMemory.js';
import { ContextCompactor } from '../../src/core/contextCompactor.js';

const TEST_DIR = path.resolve(process.cwd(), '.test_sandbox');

async function runTests() {
  console.log('\n🦅 ─── LANCEMENT DE LA SUITE DE TESTS UNITAIRES CORVUS ───\n');
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      failed++;
    }
  };

  // Préparation du dossier de test
  await fs.mkdir(TEST_DIR, { recursive: true });

  try {
    // 1. Test du Bac à Sable (Sandbox)
    console.log('\n[1/6] Test du Confinement Sandbox :');
    const sandbox = new WorkspaceSandbox(TEST_DIR);
    assert(sandbox.isInsideWorkspace('src/app.ts'), 'Autorise les chemins internes au workspace');
    let threwEscaping = false;
    try {
      sandbox.resolveSafePath('../../escaped.txt');
    } catch {
      threwEscaping = true;
    }
    assert(threwEscaping, 'Bloque et refuse les chemins sortant du workspace (Directory Traversal)');

    // 2. Test du Gestionnaire de Permissions & ACL
    console.log('\n[2/6] Test des Permissions & ACL :');
    const pm = new PermissionManager('default');
    const readAllowed = await pm.checkPermission({
      toolName: 'file_read',
      actionType: 'read',
      description: 'Lecture de fichier',
      params: { path: 'test.txt' },
    });
    assert(readAllowed, 'La lecture pure est auto-approuvée');

    const gitStatusAllowed = await pm.checkPermission({
      toolName: 'bash_run',
      actionType: 'execute',
      description: 'Consultation statut git',
      params: { command: 'git status' },
    });
    assert(gitStatusAllowed, 'Règle ACL "git status" bénigne auto-approuvée');

    // 3. Test des Outils de Fichiers (Write, Read, Edit)
    console.log('\n[3/6] Test des Outils de Fichiers & Diffs :');
    const writeTool = new FileWriteTool();
    const readTool = new FileReadTool();
    const editTool = new FileEditTool();

    const writeRes = await writeTool.execute(
      {
        path: 'sample.ts',
        content: 'export function hello() {\n  return "Bonjour";\n}\n',
      },
      { workspaceRoot: TEST_DIR, sessionId: 'test_1' },
    );
    assert(writeRes.status === 'created' && writeRes.linesCount === 4, 'FileWriteTool crée le fichier avec succès');

    const readRes = await readTool.execute(
      { path: 'sample.ts', startLine: 1, endLine: 3 },
      { workspaceRoot: TEST_DIR, sessionId: 'test_1' },
    );
    assert(readRes.totalLines === 4 && readRes.content.includes('Bonjour'), 'FileReadTool lit le fichier avec pagination');

    const editRes = await editTool.execute(
      {
        path: 'sample.ts',
        targetContent: 'return "Bonjour";',
        replacementContent: 'return "Bonjour Corvus !";',
      },
      { workspaceRoot: TEST_DIR, sessionId: 'test_1' },
    );
    assert(
      editRes.appliedCount === 1 && editRes.diff.includes('+  return "Bonjour Corvus !";'),
      'FileEditTool applique le remplacement chirurgical et produit un diff',
    );

    // 4. Test des Outils de Recherche (Grep & Glob)
    console.log('\n[4/6] Test des Outils de Recherche (Grep & Glob) :');
    const grepTool = new GrepTool();
    const globTool = new GlobTool();

    const grepRes = await grepTool.execute(
      { query: 'Corvus' },
      { workspaceRoot: TEST_DIR, sessionId: 'test_1' },
    );
    assert(grepRes.totalMatches >= 1, 'GrepTool localise les correspondances regex');

    const globRes = await globTool.execute(
      { pattern: '*.ts' },
      { workspaceRoot: TEST_DIR, sessionId: 'test_1' },
    );
    assert(globRes.totalFound >= 1 && globRes.files.includes('sample.ts'), 'GlobTool liste les fichiers par motif');

    // 5. Test des Blueprints & Détection Automatique
    console.log('\n[5/6] Test des Blueprints Multi-Stack :');
    const bpRegistry = BlueprintRegistry.createDefaultRegistry();
    assert(bpRegistry.getAllBlueprints().length === 7, 'Tous les 7 Blueprints sont enregistrés');

    // Crée un fichier sentinelle NestJS pour tester la détection
    await fs.writeFile(path.join(TEST_DIR, 'nest-cli.json'), '{}', 'utf-8');
    const detection = await bpRegistry.autoDetectStack(TEST_DIR);
    assert(detection.detectedStack === 'nestjs', 'Détection automatique de NestJS via nest-cli.json');

    // 6. Test du TokenTracker et de la Compaction
    console.log('\n[6/6] Test du TokenTracker & Compaction :');
    const tracker = new TokenTracker('deepseek-chat');
    tracker.recordUsage({ inputTokens: 5000, outputTokens: 1000 });
    const cost = tracker.calculateEstimatedCost();
    assert(cost > 0, `Calcul du coût DeepSeek valide (${tracker.getEstimatedCostFormatted()})`);

    const memory = new ConversationMemory();
    for (let i = 0; i < 15; i++) {
      memory.addUserMessage(`Demande numéro ${i}`);
      memory.addAssistantMessage(`Réponse numéro ${i}`);
    }
    const compactRes = ContextCompactor.compact(memory, 4);
    assert(compactRes.compactedMessageCount < 30, 'ContextCompactor compresse avec succès l\'historique');

  } finally {
    // Nettoyage du dossier de test
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  }

  console.log(`\n🏁 ─── RÉSULTATS : ${passed} PASSÉS, ${failed} ÉCHOUÉS ───\n`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('[Test Runner Error]', err);
  process.exit(1);
});
