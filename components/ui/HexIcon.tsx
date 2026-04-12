import React from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import Svg, { Polygon, Path } from 'react-native-svg';

interface HexIconProps {
  children: React.ReactNode;
  size?: number;
  bg?: string;
}

export function HexIcon({ children, size = 48, bg = '#f5a623' }: HexIconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg viewBox="0 0 100 100" width={size} height={size} style={StyleSheet.absoluteFill}>
        <Polygon
          points="50,2 95,25 95,75 50,98 5,75 5,25"
          fill={bg}
          stroke="none"
        />
      </Svg>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

interface HexCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  strokeColor?: string;
}

export function HexCard({ children, onPress, style, strokeColor = '#f5a623' }: HexCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.hexCard, style]}>
      <Svg viewBox="0 0 200 180" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Path
          d="M100,10 Q104,8 108,10 L184,44 Q188,46 188,50 L188,130 Q188,134 184,136 L108,170 Q104,172 100,170 L16,136 Q12,134 12,130 L12,50 Q12,46 16,44 Z"
          fill="#2a2a2a"
          stroke={strokeColor}
          strokeWidth="1.5"
        />
      </Svg>
      <View style={styles.hexCardContent}>
        {children}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'relative',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexCard: {
    position: 'relative',
    flex: 1,
    aspectRatio: 200 / 180,
  },
  hexCardContent: {
    position: 'relative',
    zIndex: 10,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
});
