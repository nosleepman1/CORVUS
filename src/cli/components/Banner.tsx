/**
 * @file Banner.tsx
 * @description Composant React Ink affichant la bannière et la mascotte Corvus.
 */

import React from 'react';
import { Box, Text } from 'ink';
import { CORVUS_ASCII_BANNER } from '../../config/constants.js';
import { theme } from '../../config/theme.js';

export const Banner: React.FC = () => {
  return (
    <Box flexDirection="column" marginY={1}>
      <Text color="magenta">{CORVUS_ASCII_BANNER}</Text>
      <Box justifyContent="center">
        <Text color="cyan">
          {theme.icons.raven} <Text bold>Corvus</Text> — Tapez votre demande ou{' '}
          <Text color="yellow" bold>/help</Text> pour les commandes
        </Text>
      </Box>
    </Box>
  );
};
