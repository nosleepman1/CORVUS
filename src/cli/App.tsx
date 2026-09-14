/**
 * @file App.tsx
 * @description Composant racine React Ink de l'interface terminal de Corvus.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import { CorvusAgent } from '../core/agent.js';
import { CorvusState } from '../core/stateStore.js';
import { AgentMessage, ToolResult } from '../types/messages.js';
import { PermissionRequest } from '../types/permissions.js';
import { Banner } from './components/Banner.js';
import { StatusBar } from './components/StatusBar.js';
import { MessageList } from './components/MessageList.js';
import { ThinkingBlock } from './components/ThinkingBlock.js';
import { ToolExecution } from './components/ToolExecution.js';
import { PermissionPrompt } from './components/PermissionPrompt.js';
import { PromptInput } from './components/PromptInput.js';
import { handleSlashCommand } from './commands/handler.js';

interface AppProps {
  agent: CorvusAgent;
}

export const App: React.FC<AppProps> = ({ agent }) => {
  const [appState, setAppState] = useState<CorvusState>(agent.getStateStore().getState());
  const [messages, setMessages] = useState<AgentMessage[]>(agent.getMemory().getMessages());
  const [currentThinking, setCurrentThinking] = useState<string>('');
  const [currentTool, setCurrentTool] = useState<string | undefined>();
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);
  const [activePermissionRequest, setActivePermissionRequest] = useState<PermissionRequest | null>(null);
  const permissionResolverRef = useRef<((allowed: boolean) => void) | null>(null);

  useEffect(() => {
    // 1. Abonnement aux mutations du StateStore
    const unsubscribe = agent.getStateStore().subscribe(newState => {
      setAppState(newState);
      setMessages(agent.getMemory().getMessages());
    });

    // 2. Enregistrement du gestionnaire de permissions interactif dans le terminal
    (agent as any).permissions.registerApprovalHandler((request: PermissionRequest) => {
      return new Promise<boolean>(resolve => {
        permissionResolverRef.current = resolve;
        setActivePermissionRequest(request);
      });
    });

    return () => {
      unsubscribe();
    };
  }, [agent]);

  const handlePermissionSelect = (item: { value: string; label: string }) => {
    const isAllowed = item.value === 'allow_once' || item.value === 'allow_always';
    if (item.value === 'allow_always' && activePermissionRequest) {
      (agent as any).permissions.addRule({
        id: `rule_${Date.now()}`,
        pattern: `${activePermissionRequest.toolName}:*`,
        decision: 'allow',
      });
    }

    if (permissionResolverRef.current) {
      permissionResolverRef.current(isAllowed);
      permissionResolverRef.current = null;
    }
    setActivePermissionRequest(null);
  };

  const handleUserInput = async (input: string) => {
    // A. Traitement d'une commande slash
    if (input.startsWith('/')) {
      const result = await handleSlashCommand(input, agent);
      if (result.handled) {
        agent.getMemory().addUserMessage(input);
        agent.getMemory().addAssistantMessage(result.output);
        setMessages(agent.getMemory().getMessages());
        return;
      }
    }

    // B. Lancement de la boucle ReAct
    setCurrentThinking('');
    setToolResults([]);

    try {
      for await (const event of agent.run(input)) {
        if (event.type === 'thinking_delta') {
          setCurrentThinking(prev => prev + event.text);
        } else if (event.type === 'tool_call_start') {
          setCurrentTool(event.toolCall.function.name);
        } else if (event.type === 'tool_call_end') {
          setCurrentTool(undefined);
          setToolResults(prev => [...prev, event.result]);
        }
      }
    } catch (err: any) {
      console.error('[Corvus Error]', err);
    } finally {
      setCurrentTool(undefined);
      setCurrentThinking('');
      setMessages(agent.getMemory().getMessages());
    }
  };

  const isWorking = appState.status === 'thinking' || appState.status === 'executing_tool';

  return (
    <Box flexDirection="column" paddingX={1}>
      <Banner />
      <StatusBar state={appState} />
      <MessageList messages={messages} />

      {currentThinking.length > 0 && <ThinkingBlock thinking={currentThinking} />}

      <ToolExecution currentToolName={currentTool} results={toolResults} />

      {activePermissionRequest ? (
        <PermissionPrompt request={activePermissionRequest} onSelect={handlePermissionSelect} />
      ) : (
        <PromptInput onSubmit={handleUserInput} disabled={isWorking} />
      )}
    </Box>
  );
};
