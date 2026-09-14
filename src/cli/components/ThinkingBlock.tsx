/**
 * @file ThinkingBlock.tsx
 * @description Composant React Ink affichant le bloc de raisonnement interne de DeepSeek-R1.
 */

import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../config/theme.js';

interface ThinkingBlockProps {
  thinking: string;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({ thinking }) => {
  if (!thinking) return null;

  const preview = thinking.length > 300 ? `${thinking.slice(0, 300)}...` : thinking;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="magenta"
      paddingX={1}
      marginY={1}
    >
      <Text color="magenta" bold>
        {theme.icons.brain} Raisonnement DeepSeek-R1 :
      </Text>
      <Text color="gray">{preview}</Text>
    </Box>
  );
};
