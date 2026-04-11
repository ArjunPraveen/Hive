import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const colors = useThemeColors();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    if (!email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      // signIn loaded profile — navigate based on result
      // The root layout effect will also handle this, but explicit nav is faster
      if (result.needsFamily) {
        router.replace('/(auth)/join-family');
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primaryLight }]}>
            <FontAwesome name="home" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Hive</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Your family, in sync
          </Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FontAwesome name="envelope-o" size={16} color={colors.textTertiary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FontAwesome name="lock" size={18} color={colors.textTertiary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/signup')}
          style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <Text style={[styles.footerLink, { color: colors.primary }]}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  logoSection: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName: { fontSize: 32, fontWeight: '800' },
  tagline: { fontSize: 15, marginTop: 4 },
  form: { gap: 14 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52, gap: 12 },
  input: { flex: 1, fontSize: 15 },
  error: { fontSize: 13, textAlign: 'center' },
  button: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
});
