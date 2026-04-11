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

export default function JoinFamilyScreen() {
  const colors = useThemeColors();
  const { user, createFamily, joinFamily, signOut } = useAuth();
  const [mode, setMode] = useState<'choice' | 'create' | 'join'>('choice');

  // Create family state
  const [familyName, setFamilyName] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Join family state
  const [inviteCode, setInviteCode] = useState('');

  const roles = ['Dad', 'Mom', 'Son', 'Daughter', 'Other'];

  const [inviteCodeResult, setInviteCodeResult] = useState('');

  const handleCreate = async () => {
    if (loading) return;
    if (!familyName.trim()) {
      setError('Give your family a name');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await createFamily(familyName.trim(), roleLabel || undefined);
      setLoading(false);
      if (result.error) {
        setError(result.error);
      } else if (result.inviteCode) {
        setInviteCodeResult(result.inviteCode);
        // Navigate to tabs after a short delay so user can see the code
        setTimeout(() => router.replace('/(tabs)'), 2000);
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (loading) return;
    if (!inviteCode.trim()) {
      setError('Enter an invite code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await joinFamily(inviteCode.trim(), roleLabel || undefined);
      setLoading(false);
      if (result.error) {
        setError(result.error);
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong');
      setLoading(false);
    }
  };

  // Choice screen
  if (mode === 'choice') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.logoCircle, { backgroundColor: colors.primaryLight }]}>
              <FontAwesome name="home" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Welcome, {user?.display_name}!
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Create a new family or join an existing one
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.choiceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setMode('create')}
            activeOpacity={0.7}>
            <View style={[styles.choiceIcon, { backgroundColor: colors.primaryLight }]}>
              <FontAwesome name="plus" size={20} color={colors.primary} />
            </View>
            <View style={styles.choiceText}>
              <Text style={[styles.choiceTitle, { color: colors.text }]}>Create Family</Text>
              <Text style={[styles.choiceDesc, { color: colors.textSecondary }]}>
                Start a new family and invite others
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.choiceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setMode('join')}
            activeOpacity={0.7}>
            <View style={[styles.choiceIcon, { backgroundColor: colors.info + '20' }]}>
              <FontAwesome name="sign-in" size={20} color={colors.info} />
            </View>
            <View style={styles.choiceText}>
              <Text style={[styles.choiceTitle, { color: colors.text }]}>Join Family</Text>
              <Text style={[styles.choiceDesc, { color: colors.textSecondary }]}>
                Enter an invite code from a family member
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={14} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={signOut} style={styles.signOutLink}>
            <Text style={[styles.signOutText, { color: colors.textTertiary }]}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Create or Join form
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Back button */}
        <TouchableOpacity onPress={() => { setMode('choice'); setError(''); }} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.text }]}>
          {mode === 'create' ? 'Create Your Family' : 'Join a Family'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, marginBottom: 24 }]}>
          {mode === 'create'
            ? "Name your family and you'll get an invite code to share"
            : 'Ask a family member for their invite code'}
        </Text>

        <View style={styles.form}>
          {mode === 'create' ? (
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FontAwesome name="users" size={16} color={colors.textTertiary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder='Family name (e.g., "The Kumars")'
                placeholderTextColor={colors.textTertiary}
                value={familyName}
                onChangeText={setFamilyName}
                autoFocus
              />
            </View>
          ) : (
            <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FontAwesome name="key" size={16} color={colors.textTertiary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Invite code"
                placeholderTextColor={colors.textTertiary}
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                autoFocus
              />
            </View>
          )}

          {/* Role selection */}
          <Text style={[styles.label, { color: colors.textSecondary }]}>Your role</Text>
          <View style={styles.roleRow}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role}
                onPress={() => setRoleLabel(roleLabel === role ? '' : role)}
                style={[
                  styles.rolePill,
                  {
                    backgroundColor: roleLabel === role ? colors.primaryLight : colors.surface,
                    borderColor: roleLabel === role ? colors.primary : colors.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.roleText,
                    { color: roleLabel === role ? colors.primaryDark : colors.textSecondary },
                  ]}>
                  {role}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

          {inviteCodeResult ? (
            <View style={[styles.successBox, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
              <Text style={[styles.successTitle, { color: colors.success }]}>Family created!</Text>
              <Text style={[styles.inviteCode, { color: colors.text }]}>{inviteCodeResult}</Text>
              <Text style={[styles.successHint, { color: colors.textSecondary }]}>Share this code with your family. Redirecting...</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={mode === 'create' ? handleCreate : handleJoin}
            disabled={loading || !!inviteCodeResult}
            activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'create' ? 'Create Family' : 'Join Family'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 15, marginTop: 6 },
  backBtn: { marginBottom: 20 },
  // Choice cards
  choiceCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
  choiceIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  choiceText: { flex: 1 },
  choiceTitle: { fontSize: 16, fontWeight: '700' },
  choiceDesc: { fontSize: 13, marginTop: 2 },
  // Form
  form: { gap: 14 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, height: 52, gap: 12 },
  input: { flex: 1, fontSize: 15 },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rolePill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  roleText: { fontSize: 13, fontWeight: '600' },
  error: { fontSize: 13, textAlign: 'center' },
  successBox: { padding: 16, borderRadius: 12, borderWidth: 1, alignItems: 'center', gap: 4 },
  successTitle: { fontSize: 15, fontWeight: '700' },
  inviteCode: { fontSize: 28, fontWeight: '800', letterSpacing: 4, marginVertical: 4 },
  successHint: { fontSize: 12 },
  button: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  signOutLink: { alignItems: 'center', marginTop: 24 },
  signOutText: { fontSize: 14 },
});
