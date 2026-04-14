import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Colors from '@/constants/Colors';

const USE_NATIVE = Platform.OS !== 'web';
const HEX_PATH = "M50,4 Q54,2 58,4 L91,22 Q95,24 95,28 L95,72 Q95,76 91,78 L58,96 Q54,98 50,96 L9,78 Q5,76 5,72 L5,28 Q5,24 9,22 Z";

export function HiveLoader({ size = 64, showLabel = true }: { size?: number; showLabel?: boolean }) {
  const rotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: USE_NATIVE }),
        Animated.timing(pulse, { toValue: 0.8, duration: 800, easing: Easing.inOut(Easing.quad), useNativeDriver: USE_NATIVE }),
      ])
    ).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size }}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spin }, { scale: pulse }] }]}>
          <Svg viewBox="0 0 100 100" width={size} height={size}>
            <Path d={HEX_PATH} fill="none" stroke={Colors.primary} strokeWidth="2.5" />
            <Path d={HEX_PATH} fill={Colors.primary} fillOpacity={0.1} />
          </Svg>
        </Animated.View>
        <View style={[styles.beeContainer, { width: size, height: size }]}>
          <Text style={[styles.bee, { fontSize: size * 0.35 }]}>🐝</Text>
        </View>
      </View>
      {showLabel && <Text style={styles.label}>Hive</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  beeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bee: {
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 2,
  },
});
