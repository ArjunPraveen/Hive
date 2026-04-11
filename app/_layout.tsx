import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { useColorScheme, ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import Colors from '@/constants/Colors';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

const HiveLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.amber[500],
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const HiveDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.amber[400],
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AuthProvider>
      <DataProvider>
        <RootLayoutNav />
      </DataProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { session, user, initialLoading } = useAuth();
  const router = useRouter();

  // Single redirect effect — handles initial load + session loss
  useEffect(() => {
    if (initialLoading) return;

    if (!session) {
      router.replace('/(auth)/login');
    } else if (!user?.family_id) {
      router.replace('/(auth)/join-family');
    } else {
      router.replace('/(tabs)');
    }
  }, [initialLoading, session, user?.family_id]);

  if (initialLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors[colorScheme === 'dark' ? 'dark' : 'light'].background }}>
        <ActivityIndicator size="large" color={Colors.amber[500]} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? HiveDarkTheme : HiveLightTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
