import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Easing, GestureResponderEvent } from 'react-native';
import { router } from 'expo-router';
import { CheckSquare, Calendar, Flame, BookOpen, Bell, ChevronRight, Trophy } from 'lucide-react-native';

import Colors, { TOP_PADDING, USE_NATIVE_DRIVER } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { HexCard } from '@/components/ui/HexIcon';
import { HiveLoader } from '@/components/ui/HiveLoader';

interface WordOfDay {
  word: string;
  meaning: string;
  partOfSpeech?: string;
  example?: string;
}

export default function DashboardScreen() {
  const { user, family, familyMembers } = useAuth();
  const { todos, events, leaderboard } = useData();
  const [word, setWord] = useState<WordOfDay | null>(null);
  const [wordLoading, setWordLoading] = useState(true);

  useEffect(() => {
    fetch('https://wordoftheday.freeapi.me/')
      .then((res) => res.json())
      .then((data) => {
        setWord({
          word: data.word,
          meaning: data.meaning,
          partOfSpeech: data.partOfSpeech,
          example: data.example,
        });
      })
      .catch(() => {
        setWord({ word: 'Serendipity', meaning: 'The occurrence of events by chance in a happy way' });
      })
      .finally(() => setWordLoading(false));
  }, []);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const myOpenTodos = todos.filter((t) => t.status !== 'done' && t.assigned_to === user?.id);

  // Today's todos: assigned to user AND (deadline is today, or no deadline)
  const todaysTodos = myOpenTodos.filter((t) => {
    if (!t.deadline) return true; // no deadline = show today
    const d = new Date(t.deadline);
    return d >= todayStart && d < todayEnd;
  }).sort((a, b) => a.priority - b.priority);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const sortedUpcoming = events
    .filter((e) => new Date(e.event_date) >= todayStart)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  // Group by the next event date
  let nextEventDate: Date | null = null;
  let nextEventNames = '';
  if (sortedUpcoming.length > 0) {
    nextEventDate = new Date(sortedUpcoming[0].event_date);
    nextEventDate.setHours(0, 0, 0, 0);
    const sameDay = sortedUpcoming.filter((e) => {
      const d = new Date(e.event_date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === nextEventDate!.getTime();
    });
    nextEventNames = sameDay.map((e) => e.title).join(', ');
  }

  const nextEventLabel = nextEventDate
    ? nextEventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '';

  const topMember = leaderboard[0];

  const getMemberEmoji = (m: any) => m?.role_label === 'Mom' ? '👩' : m?.role_label === 'Dad' ? '👨' : m?.role_label === 'Son' ? '🧑' : m?.role_label === 'Daughter' ? '👧' : '😊';
  const getMemberColor = (id: string) => {
    const idx = familyMembers.findIndex((m) => m.id === id);
    return Colors.memberColors[idx % Colors.memberColors.length] || Colors.primary;
  };

  // Easter egg: bee flies to wherever user taps
  const beeX = useRef(new Animated.Value(0)).current;
  const beeY = useRef(new Animated.Value(0)).current;
  const beeViewRef = useRef<View>(null);
  const beeFlying = useRef(false);

  const handleScreenTap = (e: GestureResponderEvent) => {
    if (beeFlying.current) return;
    const { pageX, pageY } = e.nativeEvent;

    // Measure bee's current absolute position at tap time
    if (!beeViewRef.current) return;
    beeViewRef.current.measureInWindow((bx, by) => {
      const dx = pageX - (bx || 0) - 10;
      const dy = pageY - (by || 0) - 10;
      flyBee(dx, dy);
    });
  };

  const flyBee = (dx: number, dy: number) => {
    beeFlying.current = true;

    // Random arc height — bee flies up first then swoops down to target
    const arcHeight = -(80 + Math.random() * 120); // negative = upward
    const midX = dx * (0.3 + Math.random() * 0.4); // random midpoint along X

    Animated.sequence([
      // Arc to target: X smooth, Y goes up then down
      Animated.parallel([
        Animated.timing(beeX, { toValue: midX, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(beeY, { toValue: arcHeight, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
      Animated.parallel([
        Animated.timing(beeX, { toValue: dx, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(beeY, { toValue: dy, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
      // Pause at target
      Animated.delay(600),
      // Fly back with a different arc
      Animated.parallel([
        Animated.timing(beeX, { toValue: dx * 0.3, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(beeY, { toValue: -(40 + Math.random() * 60), duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
      Animated.parallel([
        Animated.timing(beeX, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(beeY, { toValue: 0, duration: 500, easing: Easing.in(Easing.quad), useNativeDriver: USE_NATIVE_DRIVER }),
      ]),
    ]).start(() => { beeFlying.current = false; });
  };

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      onTouchEnd={handleScreenTap}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}</Text>
          <View style={s.familyRow}>
            <Text style={s.familyName}>{family?.name || 'Hive'}</Text>
            <View ref={beeViewRef} collapsable={false}>
              <Animated.Text
                style={[s.beeEmoji, { transform: [{ translateX: beeX }, { translateY: beeY }] }]}>
                🐝
              </Animated.Text>
            </View>
          </View>
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
                <Text style={{ fontSize: 16 }}>{getMemberEmoji(m)}</Text>
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

      {/* Stats hexagons */}
      <View style={s.statsRow}>
        <HexCard onPress={() => router.push('/(tabs)/todos')} strokeColor={Colors.primary}>
          <CheckSquare size={16} color={Colors.primary} />
          <Text style={s.statNumber}>{myOpenTodos.length}</Text>
          <Text style={s.statLabel}>Tasks left</Text>
        </HexCard>
        <HexCard onPress={() => router.push('/(tabs)/calendar')} strokeColor="#e74c3c">
          <Calendar size={16} color="#e74c3c" />
          <Text style={s.statNumber}>{events.filter((e) => { const d = new Date(e.event_date); return d >= todayStart && d < weekEnd; }).length}</Text>
          <Text style={s.statLabel}>This week</Text>
        </HexCard>
        <HexCard onPress={() => router.push('/(tabs)/family')} strokeColor="#9b59b6">
          <Flame size={16} color="#9b59b6" />
          <Text style={s.statNumber}>{topMember?.todosCompleted || 0}</Text>
          <Text style={s.statLabel}>Top score</Text>
        </HexCard>
      </View>

      {/* Word of the Day */}
      <View style={s.wordCard}>
        <View style={s.wordHeader}>
          <BookOpen size={14} color={Colors.primary} />
          <Text style={s.wordLabel}>WORD OF THE DAY</Text>
        </View>
        {wordLoading ? (
          <HiveLoader size={32} showLabel={false} />
        ) : word ? (
          <>
            <View style={s.wordTitleRow}>
              <Text style={s.wordText}>{word.word}</Text>
              {word.partOfSpeech && <Text style={s.wordPos}>{word.partOfSpeech}</Text>}
            </View>
            <Text style={s.wordMeaning}>{word.meaning}</Text>
            {word.example && (
              <View style={s.wordExampleBox}>
                <Text style={s.wordExample}>
                  "{word.example?.split(new RegExp(`(${word.word})`, 'i')).map((part, i) =>
                    part.toLowerCase() === word.word?.toLowerCase()
                      ? <Text key={i} style={s.wordExampleBold}>{part}</Text>
                      : part
                  )}"
                </Text>
              </View>
            )}
          </>
        ) : null}
      </View>

      {/* Today's Todos */}
      <View style={s.section}>
        <TouchableOpacity style={s.sectionHeader} onPress={() => router.push('/(tabs)/todos')}>
          <Text style={s.sectionTitle}>Today's Todos</Text>
          <ChevronRight size={16} color={Colors.muted} />
        </TouchableOpacity>
        {todaysTodos.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>All caught up! No tasks for today.</Text>
          </View>
        ) : (
          todaysTodos.slice(0, 4).map((todo) => {
            const member = familyMembers.find((m) => m.id === todo.assigned_to);
            const color = getMemberColor(todo.assigned_to);
            return (
              <View key={todo.id} style={s.miniTodo}>
                <View style={[s.miniDot, { backgroundColor: [Colors.p0, Colors.p1, Colors.p2, Colors.p3][todo.priority] || Colors.p3 }]} />
                <View style={[s.miniEmoji, { backgroundColor: color + '25' }]}>
                  <Text style={{ fontSize: 10 }}>{getMemberEmoji(member)}</Text>
                </View>
                <Text style={s.miniTitle} numberOfLines={1}>{todo.title}</Text>
                {todo.deadline && (
                  <Text style={s.miniDeadline}>
                    {new Date(todo.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Upcoming Event */}
      <View style={s.section}>
        <TouchableOpacity style={s.sectionHeader} onPress={() => router.push('/(tabs)/calendar')}>
          <Text style={s.sectionTitle}>Upcoming Event</Text>
          <ChevronRight size={16} color={Colors.muted} />
        </TouchableOpacity>
        {nextEventDate ? (
          <View style={s.upcomingCard}>
            <View style={s.upcomingDateBox}>
              <Text style={s.upcomingDateNum}>{nextEventDate.getDate()}</Text>
              <Text style={s.upcomingDateMonth}>{nextEventDate.toLocaleDateString('en-US', { month: 'short' })}</Text>
            </View>
            <Text style={s.upcomingNames} numberOfLines={2}>{nextEventNames}</Text>
          </View>
        ) : (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>No upcoming events</Text>
          </View>
        )}
      </View>

      {/* Leaderboard */}
      <View style={s.section}>
        <TouchableOpacity style={s.sectionHeader} onPress={() => router.push('/(tabs)/family')}>
          <Text style={s.sectionTitle}>Leaderboard</Text>
          <ChevronRight size={16} color={Colors.muted} />
        </TouchableOpacity>
        {leaderboard.slice(0, 3).map((entry, i) => {
          const color = Colors.memberColors[i % Colors.memberColors.length];
          const rankEmoji = ['🥇', '🥈', '🥉'][i];
          return (
            <View key={entry.userId} style={s.leaderRow}>
              <Text style={s.leaderRank}>{rankEmoji}</Text>
              <View style={[s.leaderAvatar, { backgroundColor: color + '25', borderColor: color }]}>
                <Text style={{ fontSize: 12 }}>{getMemberEmoji(familyMembers.find((m) => m.id === entry.userId))}</Text>
              </View>
              <View style={s.leaderInfo}>
                <Text style={s.leaderName}>{entry.name}</Text>
                <Text style={s.leaderSub}>{entry.todosCompleted} completed</Text>
              </View>
              <Text style={s.leaderScore}>{entry.score} pts</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 80, maxWidth: 500, alignSelf: 'center', width: '100%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: TOP_PADDING, paddingBottom: 12 },
  greeting: { fontSize: 12, color: Colors.muted },
  familyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  familyName: { fontSize: 18, fontWeight: '700', color: Colors.foreground, marginTop: 2 },
  beeEmoji: { fontSize: 18, zIndex: 100 },
  bellBtn: { padding: 8, backgroundColor: Colors.surface, borderRadius: 20 },
  bellDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  membersScroll: { flexGrow: 0, maxHeight: 72, marginTop: 8 },
  membersRow: { paddingHorizontal: 16, gap: 12, paddingBottom: 4, alignItems: 'center' },
  memberItem: { alignItems: 'center', gap: 4 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  memberName: { fontSize: 10, color: Colors.muted },
  inviteAvatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderStyle: 'dashed', borderColor: Colors.mutedLight, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  invitePlus: { fontSize: 16, color: Colors.muted },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 4, marginTop: 16 },
  statNumber: { fontSize: 20, fontWeight: '800', color: Colors.foreground, marginTop: 2 },
  statLabel: { fontSize: 9, color: Colors.muted, marginTop: 1 },
  wordCard: { marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: '#2a2218', borderWidth: 1, borderColor: Colors.primaryBorder },
  wordHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  wordLabel: { fontSize: 10, color: Colors.primary, letterSpacing: 2, fontWeight: '600' },
  wordTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordText: { fontSize: 20, fontWeight: '700', color: Colors.foreground },
  wordPos: { fontSize: 10, color: Colors.primaryDark, backgroundColor: Colors.primaryBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  wordMeaning: { fontSize: 14, color: Colors.muted, marginTop: 4, lineHeight: 20 },
  wordExampleBox: { marginTop: 8, backgroundColor: 'rgba(245,166,35,0.08)', padding: 10, borderRadius: 8 },
  wordExample: { fontSize: 13, color: Colors.primary, fontStyle: 'italic', lineHeight: 18 },
  wordExampleBold: { fontWeight: '800', fontStyle: 'italic' },
  // Sections
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.foreground },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  emptyText: { fontSize: 13, color: Colors.muted },
  // Mini todos
  miniTodo: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 6 },
  miniDot: { width: 6, height: 6, borderRadius: 3 },
  miniEmoji: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  miniTitle: { flex: 1, fontSize: 13, color: Colors.foreground },
  miniDeadline: { fontSize: 10, color: Colors.muted },
  // Upcoming event
  upcomingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  upcomingDateBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  upcomingDateNum: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  upcomingDateMonth: { fontSize: 9, fontWeight: '600', color: Colors.primaryDark, marginTop: -2 },
  upcomingNames: { flex: 1, fontSize: 13, color: Colors.foreground, lineHeight: 18 },
  // Leaderboard
  leaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 6 },
  leaderRank: { fontSize: 16, width: 24, textAlign: 'center' },
  leaderAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  leaderInfo: { flex: 1 },
  leaderName: { fontSize: 13, fontWeight: '600', color: Colors.foreground },
  leaderSub: { fontSize: 10, color: Colors.muted },
  leaderScore: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
