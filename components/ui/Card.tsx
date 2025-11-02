import React from 'react';
import { View } from 'react-native';
import { styled } from 'tailwindcss-react-native';

const StyledView = styled(View);

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <StyledView className={`bg-card rounded-lg border border-border shadow-sm ${className}`}>
      {children}
    </StyledView>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <StyledView className={`p-6 pb-4 ${className}`}>
      {children}
    </StyledView>
  );
}

export function CardContent({ children, className = '' }: CardProps) {
  return (
    <StyledView className={`p-6 pt-0 ${className}`}>
      {children}
    </StyledView>
  );
}