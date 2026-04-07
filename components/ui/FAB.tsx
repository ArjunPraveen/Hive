import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useThemeColors';

interface FABProps {
  onPress: () => void;
  icon?: string;
  style?: ViewStyle;
}

export function FAB({ onPress, icon = 'plus', style }: FABProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }, style]}
      onPress={onPress}
      activeOpacity={0.8}>
      <FontAwesome name={icon as any} size={24} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
