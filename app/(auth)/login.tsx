import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Mail, Lock } from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { HexIcon } from '@/components/ui/HexIcon';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;
    if (!email.trim() || !password) { setError('Please fill in all fields'); return; }
    setError('');
    setLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      setLoading(false);
      if (result.error) { setError(result.error); return; }
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <View style={s.content}>
        <View style={s.logoSection}>
          <HexIcon size={80} bg={Colors.primaryDark}>
            <Text style={{ fontSize: 28 }}>🐝</Text>
          </HexIcon>
          <Text style={s.appName}>Hive</Text>
          <Text style={s.tagline}>Your family, in sync</Text>
        </View>

        <View style={s.form}>
          <View style={s.inputRow}>
            <Mail size={18} color={Colors.muted} />
            <TextInput
              style={s.input}
              placeholder="Email"
              placeholderTextColor={Colors.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={s.inputRow}>
            <Lock size={18} color={Colors.muted} />
            <TextInput
              style={s.input}
              placeholder="Password"
              placeholderTextColor={Colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={s.button} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={Colors.background} /> : <Text style={s.buttonText}>Sign In</Text>}
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={s.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, maxWidth: 400, alignSelf: 'center', width: '100%' },
  logoSection: { alignItems: 'center', marginBottom: 40 },
  appName: { fontSize: 28, fontWeight: '700', color: Colors.foreground, marginTop: 16 },
  tagline: { fontSize: 14, color: Colors.muted, marginTop: 4 },
  form: { gap: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 16, height: 48 },
  input: { flex: 1, fontSize: 15, color: Colors.foreground },
  error: { fontSize: 13, color: Colors.destructive, textAlign: 'center' },
  button: { backgroundColor: Colors.primary, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: Colors.background, fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: Colors.muted },
  footerLink: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
