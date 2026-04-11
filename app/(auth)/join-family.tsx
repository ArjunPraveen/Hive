import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Plus, UserPlus, ChevronRight, LogOut, ArrowLeft, Key, Users } from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { HexIcon } from '@/components/ui/HexIcon';

export default function JoinFamilyScreen() {
  const { user, createFamily, joinFamily, signOut } = useAuth();
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');
  const [familyName, setFamilyName] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteCodeResult, setInviteCodeResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = ['Dad', 'Mom', 'Son', 'Daughter', 'Other'];

  const handleCreate = async () => {
    if (loading) return;
    if (!familyName.trim()) { setError('Give your family a name'); return; }
    setError(''); setLoading(true);
    try {
      const result = await createFamily(familyName.trim(), roleLabel || undefined);
      setLoading(false);
      if (result.error) { setError(result.error); }
      else if (result.inviteCode) {
        setInviteCodeResult(result.inviteCode);
        setTimeout(() => router.replace('/(tabs)'), 2000);
      }
    } catch (e: any) { setError(e?.message || 'Something went wrong'); setLoading(false); }
  };

  const handleJoin = async () => {
    if (loading) return;
    if (!inviteCode.trim()) { setError('Enter an invite code'); return; }
    setError(''); setLoading(true);
    try {
      const result = await joinFamily(inviteCode.trim(), roleLabel || undefined);
      setLoading(false);
      if (result.error) { setError(result.error); }
      else { router.replace('/(tabs)'); }
    } catch (e: any) { setError(e?.message || 'Something went wrong'); setLoading(false); }
  };

  if (mode === 'choice') {
    return (
      <View style={s.container}>
        <View style={s.content}>
          <View style={s.logoSection}>
            <HexIcon size={72} bg={Colors.primaryDark}>
              <Text style={{ fontSize: 24 }}>🐝</Text>
            </HexIcon>
            <Text style={s.welcomeTitle}>Welcome, {user?.display_name}!</Text>
            <Text style={s.welcomeSub}>Create a new family or join an existing one</Text>
          </View>

          <View style={{ gap: 12, width: '100%' }}>
            <TouchableOpacity style={s.choiceCard} onPress={() => setMode('create')} activeOpacity={0.7}>
              <HexIcon size={40} bg={Colors.primary}><Plus size={18} color={Colors.background} /></HexIcon>
              <View style={s.choiceText}>
                <Text style={s.choiceTitle}>Create Family</Text>
                <Text style={s.choiceDesc}>Start a new family and invite others</Text>
              </View>
              <ChevronRight size={18} color={Colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={s.choiceCard} onPress={() => setMode('join')} activeOpacity={0.7}>
              <HexIcon size={40} bg={Colors.surfaceLight}><UserPlus size={18} color={Colors.foreground} /></HexIcon>
              <View style={s.choiceText}>
                <Text style={s.choiceTitle}>Join Family</Text>
                <Text style={s.choiceDesc}>Enter an invite code from a family member</Text>
              </View>
              <ChevronRight size={18} color={Colors.muted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={signOut} style={s.signOutBtn}>
            <LogOut size={16} color={Colors.muted} />
            <Text style={s.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity onPress={() => { setMode('choice'); setError(''); }} style={{ marginBottom: 20 }}>
          <ArrowLeft size={20} color={Colors.muted} />
        </TouchableOpacity>

        <Text style={s.formTitle}>{mode === 'create' ? 'Create Your Family' : 'Join a Family'}</Text>
        <Text style={[s.welcomeSub, { marginBottom: 24 }]}>
          {mode === 'create' ? "Name your family and you'll get an invite code to share" : 'Ask a family member for their invite code'}
        </Text>

        <View style={{ gap: 16 }}>
          {mode === 'create' ? (
            <View style={s.inputRow}>
              <Users size={18} color={Colors.muted} />
              <TextInput style={s.input} placeholder='Family name (e.g., "The Kumars")' placeholderTextColor={Colors.muted} value={familyName} onChangeText={setFamilyName} />
            </View>
          ) : (
            <View style={s.inputRow}>
              <Key size={18} color={Colors.muted} />
              <TextInput style={s.input} placeholder="Invite code" placeholderTextColor={Colors.muted} value={inviteCode} onChangeText={setInviteCode} autoCapitalize="characters" />
            </View>
          )}

          <Text style={s.label}>Your role</Text>
          <View style={s.roleRow}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role}
                onPress={() => setRoleLabel(roleLabel === role ? '' : role)}
                style={[s.rolePill, roleLabel === role && s.rolePillActive]}>
                <Text style={[s.roleText, roleLabel === role && s.roleTextActive]}>{role}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          {inviteCodeResult ? (
            <View style={s.successBox}>
              <Text style={s.successTitle}>Family created!</Text>
              <Text style={s.inviteCodeText}>{inviteCodeResult}</Text>
              <Text style={s.successHint}>Share this code with your family. Redirecting...</Text>
            </View>
          ) : null}

          <TouchableOpacity style={s.button} onPress={mode === 'create' ? handleCreate : handleJoin} disabled={loading || !!inviteCodeResult} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={Colors.background} /> : (
              <Text style={s.buttonText}>{mode === 'create' ? 'Create Family' : 'Join Family'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, maxWidth: 400, alignSelf: 'center', width: '100%' },
  logoSection: { alignItems: 'center', marginBottom: 40 },
  welcomeTitle: { fontSize: 24, fontWeight: '700', color: Colors.foreground, marginTop: 16 },
  welcomeSub: { fontSize: 14, color: Colors.muted, marginTop: 4 },
  formTitle: { fontSize: 24, fontWeight: '700', color: Colors.foreground },
  choiceCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16 },
  choiceText: { flex: 1 },
  choiceTitle: { fontSize: 15, fontWeight: '600', color: Colors.foreground },
  choiceDesc: { fontSize: 12, color: Colors.muted, marginTop: 2 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 32, alignSelf: 'center' },
  signOutText: { fontSize: 14, color: Colors.muted },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 16, height: 48 },
  input: { flex: 1, fontSize: 15, color: Colors.foreground },
  label: { fontSize: 11, fontWeight: '600', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rolePill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  rolePillActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  roleText: { fontSize: 13, fontWeight: '600', color: Colors.muted },
  roleTextActive: { color: Colors.primary },
  error: { fontSize: 13, color: Colors.destructive, textAlign: 'center' },
  successBox: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.success, backgroundColor: 'rgba(37,211,102,0.1)', alignItems: 'center', gap: 4 },
  successTitle: { fontSize: 15, fontWeight: '700', color: Colors.success },
  inviteCodeText: { fontSize: 28, fontWeight: '800', color: Colors.foreground, letterSpacing: 4 },
  successHint: { fontSize: 12, color: Colors.muted },
  button: { backgroundColor: Colors.primary, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: Colors.background, fontSize: 16, fontWeight: '600' },
});
