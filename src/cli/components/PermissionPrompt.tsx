/**
 * @file PermissionPrompt.tsx
 * @description Boîte de dialogue interactive React Ink demandant l'approbation d'une opération à l'utilisateur.
 */

import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { PermissionRequest } from '../../types/permissions.js';
import { theme } from '../../config/theme.js';

interface PermissionPromptProps {
  request: PermissionRequest;
  onSelect: (item: { value: string; label: string }) => void;
}

export const PermissionPrompt: React.FC<PermissionPromptProps> = ({ request, onSelect }) => {
  const items = [
    { label: '✅ Autoriser cette action une fois', value: 'allow_once' },
    { label: '🛡️ Toujours autoriser pour cette session', value: 'allow_always' },
    { label: '❌ Refuser l\'action', value: 'deny' },
  ];

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="yellow"
      paddingX={1}
      marginY={1}
    >
      <Text color="yellow" bold>
        {theme.icons.shield} DEMANDE D'AUTORISATION : {request.toolName.toUpperCase()}
      </Text>
      <Text color="white">{request.description}</Text>

      {request.diffPreview && (
        <Box marginY={1}>
          <Text color="gray">{request.diffPreview}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <SelectInput items={items} onSelect={onSelect} />
      </Box>
    </Box>
  );
};
