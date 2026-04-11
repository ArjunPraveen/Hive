import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export function Card({ children, style, padded = true }: CardProps) {
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
          borderColor: colors.borderLight,
        },
        padded && styles.padded,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  padded: {
    padding: 16,
  },
});
