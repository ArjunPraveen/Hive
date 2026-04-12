import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, Animated, Platform } from 'react-native';

const USE_NATIVE = Platform.OS !== 'web';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const HEX_ICON_PATH = "M50,4 Q54,2 58,4 L91,22 Q95,24 95,28 L95,72 Q95,76 91,78 L58,96 Q54,98 50,96 L9,78 Q5,76 5,72 L5,28 Q5,24 9,22 Z";
const HEX_CARD_PATH = "M100,10 Q104,8 108,10 L184,44 Q188,46 188,50 L188,130 Q188,134 184,136 L108,170 Q104,172 100,170 L16,136 Q12,134 12,130 L12,50 Q12,46 16,44 Z";

// Animated rotating glow — uses a rotating gradient on the stroke
function useGlowRotation() {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 16000,
        useNativeDriver: USE_NATIVE,
      })
    ).start();
  }, []);

  return rotation;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface HexIconProps {
  children: React.ReactNode;
  size?: number;
  bg?: string;
}

export function HexIcon({ children, size = 48, bg = '#f5a623' }: HexIconProps) {
  const rotation = useGlowRotation();

  const strokeDashoffset = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg viewBox="0 0 100 100" width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="glowIcon" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#f5a623" stopOpacity="0.8" />
            <Stop offset="0.5" stopColor="#ffe082" stopOpacity="0.2" />
            <Stop offset="1" stopColor="#f5a623" stopOpacity="0.8" />
          </LinearGradient>
        </Defs>
        <Path d={HEX_ICON_PATH} fill={bg} stroke="none" />
        <AnimatedPath
          d={HEX_ICON_PATH}
          fill="none"
          stroke="url(#glowIcon)"
          strokeWidth="2"
          strokeDasharray="40 360"
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
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
  const rotation = useGlowRotation();

  const strokeDashoffset = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 800],
  });

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.hexCard, style]}>
      <Svg viewBox="0 0 200 180" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="glowCard" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={strokeColor} stopOpacity="0.9" />
            <Stop offset="0.5" stopColor="#ffe082" stopOpacity="0.15" />
            <Stop offset="1" stopColor={strokeColor} stopOpacity="0.9" />
          </LinearGradient>
        </Defs>
        <Path d={HEX_CARD_PATH} fill="#2a2a2a" stroke={strokeColor} strokeWidth="0.5" strokeOpacity={0.3} />
        <AnimatedPath
          d={HEX_CARD_PATH}
          fill="none"
          stroke="url(#glowCard)"
          strokeWidth="2"
          strokeDasharray="80 720"
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
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
