import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { styled } from 'tailwindcss-react-native';

const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledText = styled(Text);

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({ 
  children, 
  onPress, 
  variant = 'default', 
  size = 'default', 
  disabled = false,
  loading = false,
  className = ''
}: ButtonProps) {
  const variantStyles = {
    default: 'bg-primary px-4 py-2 rounded-md',
    destructive: 'bg-destructive px-4 py-2 rounded-md',
    outline: 'border border-input bg-background px-4 py-2 rounded-md',
    secondary: 'bg-secondary px-4 py-2 rounded-md',
    ghost: 'px-4 py-2 rounded-md',
    link: 'px-4 py-2 rounded-md underline'
  };

  const sizeStyles = {
    default: 'px-4 py-2',
    sm: 'px-3 py-1',
    lg: 'px-8 py-3',
    icon: 'p-2'
  };

  const textStyles = {
    default: 'text-primary-foreground',
    destructive: 'text-destructive-foreground',
    outline: 'text-foreground',
    secondary: 'text-secondary-foreground',
    ghost: 'text-foreground',
    link: 'text-primary underline'
  };

  return (
    <StyledTouchableOpacity
      className={`
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled ? 'opacity-50' : ''}
        ${className}
        items-center justify-center flex-row
      `}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading && <ActivityIndicator size="small" className="mr-2" />}
      <StyledText className={`text-sm font-medium ${textStyles[variant]}`}>
        {children}
      </StyledText>
    </StyledTouchableOpacity>
  );
}