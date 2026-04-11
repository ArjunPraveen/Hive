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

export default function SignUpScreen() {
  const colors = useThemeColors();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (loading) return;
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const result = await signUp(email.trim(), password, name.trim());
      setLoading(false);
      if (result.error) {
        setError(result.error);
      } else if (result.needsConfirmation) {
        setInfo('Check your email for a confirmation link, then sign in.');
      } else {
        // Auto-logged in — go to join-family
        router.replace('/(auth)/join-family');
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
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Join Hive and get your family organized
          </Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <FontAwesome name="user-o" size={16} color={colors.textTertiary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Your name"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoComplete="name"
            />
          </View>

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
              placeholder="Password (min 6 characters)"
              placeholderTextColor={colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />
          </View>

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
          {info ? (
            <View style={[styles.infoBox, { backgroundColor: colors.info + '15' }]}>
              <FontAwesome name="info-circle" size={16} color={colors.info} />
              <Text style={[styles.infoText, { color: colors.info }]}>{info}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 15, marginTop: 6 },
  form: { gap: 14 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52, gap: 12 },
  input: { flex: 1, fontSize: 15 },
  error: { fontSize: 13, textAlign: 'center' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10 },
  infoText: { fontSize: 13, fontWeight: '600', flex: 1 },
  button: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
});
