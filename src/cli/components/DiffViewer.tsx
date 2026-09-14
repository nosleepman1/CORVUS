/**
 * @file DiffViewer.tsx
 * @description Composant React Ink affichant les diffs de code unifiés avec coloration syntaxique des ajouts/suppressions.
 */

import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../config/theme.js';

interface DiffViewerProps {
  diff: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diff }) => {
  if (!diff) return null;

  const lines = diff.split('\n');

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="blue" paddingX={1} marginY={1}>
      <Text color="cyan" bold>
        {theme.icons.diff} Diff de Modification :
      </Text>
      {lines.slice(0, 25).map((line, index) => {
        let color: string | undefined;
        if (line.startsWith('+') && !line.startsWith('+++')) color = 'green';
        else if (line.startsWith('-') && !line.startsWith('---')) color = 'red';
        else if (line.startsWith('@@')) color = 'magenta';
        else color = 'gray';

        return (
          <Text key={index} color={color}>
            {line}
          </Text>
        );
      })}
      {lines.length > 25 && (
        <Text color="yellow">... ({lines.length - 25} lignes supplémentaires)</Text>
      )}
    </Box>
  );
};
