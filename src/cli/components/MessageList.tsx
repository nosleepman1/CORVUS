/**
 * @file MessageList.tsx
 * @description Composant React Ink affichant l'historique des échanges entre l'utilisateur et Corvus.
 */

import React from 'react';
import { Box, Text } from 'ink';
import { AgentMessage } from '../../types/messages.js';
import { theme } from '../../config/theme.js';

interface MessageListProps {
  messages: AgentMessage[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  // Filtre les messages système et outils pour n'afficher que le dialogue utilisateur / assistant
  const displayable = messages.filter(m => m.role === 'user' || m.role === 'assistant');

  return (
    <Box flexDirection="column" marginY={1}>
      {displayable.slice(-10).map((msg, index) => {
        const isUser = msg.role === 'user';
        const prefix = isUser ? `${theme.icons.pointer} Vous :` : `${theme.icons.raven} Corvus :`;
        const prefixColor = isUser ? 'cyan' : 'magenta';

        return (
          <Box key={msg.id || index} flexDirection="column" marginY={1}>
            <Text color={prefixColor} bold>
              {prefix}
            </Text>
            <Box paddingLeft={2}>
              <Text color="white">{msg.content}</Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
