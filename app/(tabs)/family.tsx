import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { ArrowLeft, Copy, CheckSquare, Flame, Crown, Users, LogOut } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { showAlert, confirm } from '@/lib/alert';

export default function FamilyScreen() {
  const { user, family, familyMembers, signOut } = useAuth();
  const { leaderboard, todos } = useData();

  const totalCompleted = todos.filter((t) => t.status === 'done').length;
  const bestStreak = leaderboard.length > 0 ? leaderboard[0].todosCompleted : 0;

  const maxTodos = Math.max(...leaderboard.map((m) => m.todosCompleted), 1);

  const getMemberEmoji = (name: string, roleLabel: string | null) => {
    if (roleLabel === 'Mom') return '👩';
    if (roleLabel === 'Dad') return '👨';
    if (roleLabel === 'Son') return '🧑';
    if (roleLabel === 'Daughter') return '👧';
    return '😊';
  };

  const handleCopyInvite = async () => {
    if (!family?.invite_code) return;
    if (Platform.OS === 'web') {
      try { await navigator.clipboard.writeText(family.invite_code); } catch {}
    } else {
      await Clipboard.setStringAsync(family.invite_code);
    }
    showAlert('Copied!', 'Invite code copied to clipboard');
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.foreground} />
          </TouchableOpacity>
          <Text style={s.title}>Family</Text>
          <View style={s.memberCount}>
            <Users size={14} color={Colors.primary} />
            <Text style={s.memberCountText}>{familyMembers.length}</Text>
          </View>
        </View>
      </View>

      {/* Invite code */}
      <View style={s.inviteCard}>
        <View>
          <Text style={s.inviteLabel}>Invite Code</Text>
          <Text style={s.inviteCode}>{family?.invite_code || '------'}</Text>
        </View>
        <TouchableOpacity style={s.copyBtn} onPress={handleCopyInvite} activeOpacity={0.8}>
          <Copy size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Leaderboard */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Crown size={16} color={Colors.primary} />
          <Text style={s.sectionTitle}>Leaderboard</Text>
        </View>

        {/* Podium */}
        {leaderboard.length >= 3 && (
          <View style={s.podiumCard}>
            <View style={s.podiumRow}>
              {/* 2nd place */}
              <View style={s.podiumItem}>
                <View style={[s.podiumAvatar, { backgroundColor: Colors.memberColors[1] + '25', borderColor: Colors.memberColors[1] }]}>
                  <Text style={{ fontSize: 16 }}>{getMemberEmoji(leaderboard[1].name, leaderboard[1].roleLabel)}</Text>
                </View>
                <Text style={s.podiumName}>{leaderboard[1].name}</Text>
                <View style={[s.podiumBar, s.podiumBar2, { backgroundColor: 'rgba(192,192,192,0.2)' }]}>
                  <Text style={{ fontSize: 16 }}>🥈</Text>
                </View>
              </View>

              {/* 1st place */}
              <View style={[s.podiumItem, { marginTop: -16 }]}>
                <Text style={{ fontSize: 16, marginBottom: 4 }}>👑</Text>
                <View style={[s.podiumAvatarFirst, { backgroundColor: Colors.memberColors[0] + '25', borderColor: Colors.memberColors[0] }]}>
                  <Text style={{ fontSize: 18 }}>{getMemberEmoji(leaderboard[0].name, leaderboard[0].roleLabel)}</Text>
                </View>
                <Text style={s.podiumName}>{leaderboard[0].name}</Text>
                <View style={[s.podiumBar, s.podiumBar1, { backgroundColor: Colors.primaryBg }]}>
                  <Text style={{ fontSize: 16 }}>🥇</Text>
                </View>
              </View>

              {/* 3rd place */}
              <View style={s.podiumItem}>
                <View style={[s.podiumAvatar, { backgroundColor: Colors.memberColors[2] + '25', borderColor: Colors.memberColors[2] }]}>
                  <Text style={{ fontSize: 16 }}>{getMemberEmoji(leaderboard[2].name, leaderboard[2].roleLabel)}</Text>
                </View>
                <Text style={s.podiumName}>{leaderboard[2].name}</Text>
                <View style={[s.podiumBar, s.podiumBar3, { backgroundColor: 'rgba(205,127,50,0.2)' }]}>
                  <Text style={{ fontSize: 16 }}>🥉</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Full rankings */}
        <View style={{ gap: 8 }}>
          {leaderboard.map((entry, i) => {
            const color = Colors.memberColors[i % Colors.memberColors.length];
            return (
              <View key={entry.userId} style={s.rankCard}>
                <Text style={s.rankNum}>{i + 1}</Text>
                <View style={[s.rankAvatar, { backgroundColor: color + '25', borderColor: color }]}>
                  <Text style={{ fontSize: 14 }}>{getMemberEmoji(entry.name, entry.roleLabel)}</Text>
                </View>
                <View style={s.rankInfo}>
                  <View style={s.rankNameRow}>
                    <Text style={s.rankName}>{entry.name}</Text>
                  </View>
                  <View style={s.rankBarOuter}>
                    <View style={[s.rankBarInner, { width: `${(entry.todosCompleted / maxTodos) * 100}%`, backgroundColor: color }]} />
                  </View>
                </View>
                <View style={s.streakBadge}>
                  <Flame size={12} color="#f39c12" />
                  <Text style={s.streakText}>{entry.todosCompleted}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Weekly summary */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>This Week</Text>
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <CheckSquare size={14} color={Colors.primary} />
            <Text style={s.summaryNum}>{totalCompleted}</Text>
            <Text style={s.summaryLabel}>Tasks completed</Text>
          </View>
          <View style={s.summaryCard}>
            <Flame size={14} color="#f39c12" />
            <Text style={s.summaryNum}>{bestStreak}</Text>
            <Text style={s.summaryLabel}>Best score</Text>
          </View>
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity
        style={s.signOutBtn}
        onPress={() => confirm('Sign Out', 'Are you sure?', signOut, true)}
        activeOpacity={0.8}>
        <LogOut size={16} color={Colors.destructive} />
        <Text style={s.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 100, maxWidth: 500, alignSelf: 'center', width: '100%' },
  header: { paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.foreground },
  memberCount: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  memberCountText: { fontSize: 12, fontWeight: '600', color: Colors.foreground },
  inviteCard: { marginHorizontal: 16, marginTop: 12, backgroundColor: Colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inviteLabel: { fontSize: 10, color: Colors.muted },
  inviteCode: { fontSize: 18, fontWeight: '700', color: Colors.primary, letterSpacing: 3, marginTop: 2 },
  copyBtn: { padding: 10, borderRadius: 10, backgroundColor: Colors.primaryBg },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.foreground },
  podiumCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  podiumRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 12 },
  podiumItem: { alignItems: 'center', flex: 1 },
  podiumAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  podiumAvatarFirst: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  podiumName: { fontSize: 12, color: Colors.foreground, marginBottom: 4 },
  podiumBar: { borderTopLeftRadius: 8, borderTopRightRadius: 8, width: 56, alignItems: 'center', justifyContent: 'center' },
  podiumBar1: { height: 80 },
  podiumBar2: { height: 56 },
  podiumBar3: { height: 40 },
  rankCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  rankNum: { width: 24, textAlign: 'center', fontSize: 14, color: Colors.muted, fontWeight: '600' },
  rankAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  rankInfo: { flex: 1 },
  rankNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankName: { fontSize: 14, fontWeight: '600', color: Colors.foreground },
  rankBarOuter: { height: 6, backgroundColor: Colors.background, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  rankBarInner: { height: 6, borderRadius: 3 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  streakText: { fontSize: 12, color: Colors.muted },
  summaryRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  summaryCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: Colors.border },
  summaryNum: { fontSize: 22, fontWeight: '700', color: Colors.foreground, marginTop: 4 },
  summaryLabel: { fontSize: 10, color: Colors.muted },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 24, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.destructive },
  signOutText: { fontSize: 14, fontWeight: '600', color: Colors.destructive },
});
