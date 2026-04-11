import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

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
});
