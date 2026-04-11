import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { CheckSquare, Calendar, Flame, BookOpen, Bell, ChevronRight, Trophy } from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

const WORDS = [
  { word: 'Serendipity', meaning: 'The occurrence of events by chance in a happy way', language: 'English' },
  { word: 'Ikigai', meaning: 'A reason for being; the thing that gets you up in the morning', language: 'Japanese' },
  { word: 'Hygge', meaning: 'A quality of coziness and comfortable conviviality', language: 'Danish' },
  { word: 'Ubuntu', meaning: 'I am because we are — humanity towards others', language: 'Zulu' },
  { word: 'Gezellig', meaning: 'Cozy, warm atmosphere shared with loved ones', language: 'Dutch' },
];

export default function DashboardScreen() {
  const { user, family, familyMembers } = useAuth();
  const { todos, events, leaderboard } = useData();
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    setWordIndex(new Date().getDate() % WORDS.length);
  }, []);

  const word = WORDS[wordIndex];
  const myTodos = todos.filter((t) => t.assigned_to === user?.id && t.status !== 'done');
  const upcomingEvents = events.filter((e) => new Date(e.event_date) >= new Date());
  const topMember = leaderboard[0];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}</Text>
          <Text style={s.familyName}>{family?.name || 'Hive'} 🐝</Text>
        </View>
        <TouchableOpacity style={s.bellBtn}>
          <Bell size={18} color={Colors.foreground} />
          <View style={s.bellDot} />
        </TouchableOpacity>
      </View>

      {/* Family members row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.membersScroll} contentContainerStyle={s.membersRow}>
        {familyMembers.map((m, i) => {
          const color = Colors.memberColors[i % Colors.memberColors.length];
          return (
            <View key={m.id} style={s.memberItem}>
              <View style={[s.memberAvatar, { backgroundColor: color + '25', borderColor: color }]}>
                <Text style={{ fontSize: 16 }}>{m.role_label === 'Mom' ? '👩' : m.role_label === 'Dad' ? '👨' : m.role_label === 'Son' ? '🧑' : m.role_label === 'Daughter' ? '👧' : '😊'}</Text>
              </View>
              <Text style={s.memberName}>{m.display_name.split(' ')[0]}</Text>
            </View>
          );
        })}
        <View style={s.memberItem}>
          <View style={s.inviteAvatar}><Text style={s.invitePlus}>+</Text></View>
          <Text style={s.memberName}>Invite</Text>
        </View>
      </ScrollView>

      {/* Stats cards */}
      <View style={s.statsRow}>
        <TouchableOpacity style={s.statCard} onPress={() => router.push('/(tabs)/todos')} activeOpacity={0.8}>
          <CheckSquare size={16} color={Colors.primary} />
          <Text style={s.statNumber}>{myTodos.length}</Text>
          <Text style={s.statLabel}>Tasks left</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.statCard} onPress={() => router.push('/(tabs)/calendar')} activeOpacity={0.8}>
          <Calendar size={16} color="#e74c3c" />
          <Text style={s.statNumber}>{upcomingEvents.length}</Text>
          <Text style={s.statLabel}>This week</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.statCard} onPress={() => router.push('/(tabs)/family')} activeOpacity={0.8}>
          <Flame size={16} color={Colors.primary} />
          <Text style={s.statNumber}>{topMember?.todosCompleted || 0}</Text>
          <Text style={s.statLabel}>Top score</Text>
        </TouchableOpacity>
      </View>

      {/* Word of the Day */}
      <View style={s.wordCard}>
        <View style={s.wordHeader}>
          <BookOpen size={14} color={Colors.primary} />
          <Text style={s.wordLabel}>WORD OF THE DAY</Text>
        </View>
        <Text style={s.wordText}>{word.word}</Text>
        <Text style={s.wordLang}>{word.language}</Text>
        <Text style={s.wordMeaning}>{word.meaning}</Text>
      </View>

      {/* Quick nav */}
      <View style={s.quickNav}>
        {[
          { label: "Today's Todos", sub: `${myTodos.length} remaining`, icon: CheckSquare, color: Colors.primary, path: '/(tabs)/todos' },
          { label: 'Upcoming Events', sub: `${upcomingEvents.length} events`, icon: Calendar, color: '#e74c3c', path: '/(tabs)/calendar' },
          { label: 'Leaderboard', sub: topMember ? `${topMember.name} is leading!` : 'No data yet', icon: Trophy, color: '#9b59b6', path: '/(tabs)/family' },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={s.navCard} onPress={() => router.push(item.path as any)} activeOpacity={0.8}>
            <View style={[s.navIcon, { backgroundColor: item.color + '20' }]}>
              <item.icon size={18} color={item.color} />
            </View>
            <View style={s.navText}>
              <Text style={s.navLabel}>{item.label}</Text>
              <Text style={s.navSub}>{item.sub}</Text>
            </View>
            <ChevronRight size={16} color={Colors.muted} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 80, maxWidth: 500, alignSelf: 'center', width: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12 },
  greeting: { fontSize: 12, color: Colors.muted },
  familyName: { fontSize: 18, fontWeight: '700', color: Colors.foreground, marginTop: 2 },
  bellBtn: { padding: 8, backgroundColor: Colors.surface, borderRadius: 20 },
  bellDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  membersScroll: { flexGrow: 0, maxHeight: 72, marginTop: 8 },
  membersRow: { paddingHorizontal: 16, gap: 12, paddingBottom: 4, alignItems: 'center' },
  memberItem: { alignItems: 'center', gap: 4 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  memberName: { fontSize: 10, color: Colors.muted },
  inviteAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.mutedLight, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  invitePlus: { fontSize: 16, color: Colors.muted },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginTop: 16 },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: Colors.border },
  statNumber: { fontSize: 22, fontWeight: '700', color: Colors.foreground, marginTop: 4 },
  statLabel: { fontSize: 10, color: Colors.muted },
  wordCard: { marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: '#2a2218', borderWidth: 1, borderColor: Colors.primaryBorder },
  wordHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  wordLabel: { fontSize: 10, color: Colors.primary, letterSpacing: 2, fontWeight: '600' },
  wordText: { fontSize: 20, fontWeight: '700', color: Colors.foreground },
  wordLang: { fontSize: 10, color: Colors.primaryDark, marginTop: 2 },
  wordMeaning: { fontSize: 14, color: Colors.muted, marginTop: 4, lineHeight: 20 },
  quickNav: { paddingHorizontal: 16, marginTop: 16, gap: 8 },
  navCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  navIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navText: { flex: 1 },
  navLabel: { fontSize: 14, fontWeight: '600', color: Colors.foreground },
  navSub: { fontSize: 11, color: Colors.muted, marginTop: 1 },
});
