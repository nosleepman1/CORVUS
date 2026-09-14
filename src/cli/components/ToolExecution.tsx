/**
 * @file ToolExecution.tsx
 * @description Composant React Ink affichant les appels d'outils en cours avec spinner et statut.
 */

import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { ToolResult } from '../../types/messages.js';
import { theme } from '../../config/theme.js';

interface ToolExecutionProps {
  currentToolName?: string;
  results: ToolResult[];
}

export const ToolExecution: React.FC<ToolExecutionProps> = ({ currentToolName, results }) => {
  return (
    <Box flexDirection="column" marginY={1}>
      {/* Outil actuellement en cours d'exécution */}
      {currentToolName && (
        <Box>
          <Text color="yellow">
            <Spinner type="dots" /> {theme.icons.tool} Exécution de <Text bold>{currentToolName}</Text>...
          </Text>
        </Box>
      )}

      {/* Résultats des outils terminés */}
      {results.map((res, index) => (
        <Box key={index} flexDirection="column" marginY={0}>
          <Box>
            <Text color={res.isError ? 'red' : 'green'}>
              {res.isError ? theme.icons.cross : theme.icons.check} <Text bold>{res.toolName}</Text>{' '}
              <Text color="gray">({res.executionTimeMs ?? 0}ms)</Text>
            </Text>
          </Box>
        </Box>
      ))}
    </Box>
  );
};
