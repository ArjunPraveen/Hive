import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { User, Mail, Lock, Info } from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (loading) return;
    if (!name.trim() || !email.trim() || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError(''); setInfo('');
    setLoading(true);
    try {
      const result = await signUp(email.trim(), password, name.trim());
      setLoading(false);
      if (result.error) { setError(result.error); }
      else if (result.needsConfirmation) { setInfo('Check your email for a confirmation link, then sign in.'); }
      else { router.replace('/(auth)/join-family'); }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <View style={s.content}>
        <Text style={s.title}>Create Account</Text>
        <Text style={s.subtitle}>Join Hive and get your family organized</Text>

        <View style={s.form}>
          <View style={s.inputRow}>
            <User size={18} color={Colors.muted} />
            <TextInput style={s.input} placeholder="Your name" placeholderTextColor={Colors.muted} value={name} onChangeText={setName} />
          </View>
          <View style={s.inputRow}>
            <Mail size={18} color={Colors.muted} />
            <TextInput style={s.input} placeholder="Email" placeholderTextColor={Colors.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={s.inputRow}>
            <Lock size={18} color={Colors.muted} />
            <TextInput style={s.input} placeholder="Password (min 6 characters)" placeholderTextColor={Colors.muted} value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}
          {info ? (
            <View style={s.infoBox}>
              <Info size={16} color="#3498db" />
              <Text style={s.infoText}>{info}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={s.button} onPress={handleSignUp} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={Colors.background} /> : <Text style={s.buttonText}>Create Account</Text>}
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, maxWidth: 400, alignSelf: 'center', width: '100%' },
  title: { fontSize: 28, fontWeight: '700', color: Colors.foreground },
  subtitle: { fontSize: 14, color: Colors.muted, marginTop: 4, marginBottom: 40 },
  form: { gap: 16 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 16, height: 48 },
  input: { flex: 1, fontSize: 15, color: Colors.foreground },
  error: { fontSize: 13, color: Colors.destructive, textAlign: 'center' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(52,152,219,0.15)', padding: 12, borderRadius: 10 },
  infoText: { fontSize: 13, fontWeight: '600', color: '#3498db', flex: 1 },
  button: { backgroundColor: Colors.primary, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: Colors.background, fontSize: 16, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: Colors.muted },
  footerLink: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
