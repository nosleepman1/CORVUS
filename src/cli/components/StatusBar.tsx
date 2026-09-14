/**
 * @file StatusBar.tsx
 * @description Composant React Ink affichant la barre d'état (modèle, tokens, coût, stack, mode).
 */

import React from 'react';
import { Box, Text } from 'ink';
import { CorvusState } from '../../core/stateStore.js';

interface StatusBarProps {
  state: CorvusState;
}

export const StatusBar: React.FC<StatusBarProps> = ({ state }) => {
  const isReasoner = state.currentModel.includes('reasoner');
  const modelColor = isReasoner ? 'magenta' : 'cyan';
  const modeText = state.isPlanMode ? 'PLAN MODE' : 'EXECUTE';
  const modeColor = state.isPlanMode ? 'yellow' : 'green';

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} justifyContent="space-between">
      <Box>
        <Text color={modelColor} bold>
          [{state.currentModel}]
        </Text>
        <Text color="gray"> │ </Text>
        <Text color="blue">Stack: {state.activeStack.toUpperCase()}</Text>
        <Text color="gray"> │ </Text>
        <Text color={modeColor} bold>
          {modeText}
        </Text>
      </Box>
      <Box>
        <Text color="gray">Tokens: </Text>
        <Text color="white">
          {(state.metrics.totalInputTokens + state.metrics.totalOutputTokens).toLocaleString()}
        </Text>
        <Text color="gray"> │ Coût: </Text>
        <Text color="green" bold>
          ${state.metrics.estimatedCostUsd.toFixed(4)}
        </Text>
      </Box>
    </Box>
  );
};
