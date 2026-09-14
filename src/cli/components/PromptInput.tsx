/**
 * @file PromptInput.tsx
 * @description Composant React Ink pour la saisie interactive des consignes et commandes utilisateur.
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { theme } from '../../config/theme.js';

interface PromptInputProps {
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, disabled = false }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (submittedValue: string) => {
    if (!submittedValue.trim() || disabled) return;
    setValue('');
    onSubmit(submittedValue);
  };

  return (
    <Box borderStyle="round" borderColor="magenta" paddingX={1} marginY={1}>
      <Text color="magenta" bold>
        {theme.icons.pointer}{' '}
      </Text>
      {disabled ? (
        <Text color="gray">Corvus est en train de travailler...</Text>
      ) : (
        <TextInput
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          placeholder="Décrivez votre tâche logicielle ou tapez /help..."
        />
      )}
    </Box>
  );
};
