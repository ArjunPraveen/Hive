import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
  size?: 'sm' | 'md';
}

export function Badge({ label, color, textColor, style, size = 'sm' }: BadgeProps) {
  const colors = useThemeColors();
  const bg = color || colors.primaryLight;
  const fg = textColor || colors.primaryDark;

  return (
    <View style={[styles.badge, size === 'md' && styles.badgeMd, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, size === 'md' && styles.textMd, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeMd: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
  textMd: {
    fontSize: 13,
  },
});
