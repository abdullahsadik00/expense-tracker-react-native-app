import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { styled } from 'tailwindcss-react-native';

const StyledTextInput = styled(TextInput);

interface InputProps extends TextInputProps {
  className?: string;
}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <StyledTextInput
      className={`
        flex h-10 border border-input bg-background px-3 py-2 rounded-md
        text-sm placeholder:text-muted-foreground
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        ${className}
      `}
      placeholderTextColor="#6b7280"
      {...props}
    />
  );
}