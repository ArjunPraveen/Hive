import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

interface WordOfDay {
  word: string;
  phonetic?: string;
  definition: string;
  example?: string;
  partOfSpeech?: string;
}

export default function DashboardScreen() {
  const colors = useThemeColors();
  const { user, family, familyMembers } = useAuth();
  const { todos, events, getLeaderboard } = useData();
  const [wordOfDay, setWordOfDay] = useState<WordOfDay | null>(null);
  const [wordLoading, setWordLoading] = useState(true);

  const myTodos = todos.filter(
    (t) => t.assigned_to === user?.id && t.status !== 'done'
  );
  const upcomingEvents = events
    .filter((e) => new Date(e.event_date) > new Date())
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 3);
  const leaderboard = getLeaderboard().slice(0, 3);

  const totalTodos = todos.filter((t) => t.status !== 'done').length;
  const doneTodos = todos.filter((t) => t.status === 'done').length;

  useEffect(() => {
    fetchWordOfDay();
  }, []);

  async function fetchWordOfDay() {
    try {
      // Use a curated set of interesting words as fallback
      const words = [
        'serendipity', 'ephemeral', 'luminous', 'resilient', 'quintessential',
        'mellifluous', 'eloquent', 'vivacious', 'ineffable', 'petrichor',
      ];
      const today = new Date();
      const dayIndex = today.getDate() % words.length;
      const word = words[dayIndex];

      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (res.ok) {
        const data = await res.json();
        const entry = data[0];
        const meaning = entry.meanings?.[0];
        const def = meaning?.definitions?.[0];
        setWordOfDay({
          word: entry.word,
          phonetic: entry.phonetic,
          definition: def?.definition || 'No definition available',
          example: def?.example,
          partOfSpeech: meaning?.partOfSpeech,
        });
      }
    } catch {
      setWordOfDay({
        word: 'serendipity',
        definition: 'The occurrence of events by chance in a happy way.',
        example: 'A fortunate stroke of serendipity brought them together.',
        partOfSpeech: 'noun',
      });
    } finally {
      setWordLoading(false);
    }
  }

  const priorityColor = (p: number) => {
    const map = [colors.p0, colors.p1, colors.p2, colors.p3];
    return map[p] || colors.p3;
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 0) return 'Overdue';
    if (diffHours < 24) return `${diffHours}h left`;
    if (diffDays < 7) return `${diffDays}d left`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatEventDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Greeting */}
      <View style={styles.greeting}>
        <View>
          <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.display_name}</Text>
        </View>
        <View style={styles.familyAvatars}>
          {familyMembers.slice(0, 4).map((m) => (
            <Avatar key={m.id} name={m.display_name} size={32} style={{ marginLeft: -8 }} />
          ))}
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Card style={[styles.statCard, { flex: 1, marginRight: 8 }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{myTodos.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>My Tasks</Text>
        </Card>
        <Card style={[styles.statCard, { flex: 1, marginHorizontal: 4 }]}>
          <Text style={[styles.statNumber, { color: colors.success }]}>{doneTodos}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Done</Text>
        </Card>
        <Card style={[styles.statCard, { flex: 1, marginLeft: 8 }]}>
          <Text style={[styles.statNumber, { color: colors.info }]}>{upcomingEvents.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Events</Text>
        </Card>
      </View>

      {/* Word of the Day */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Word of the Day</Text>
        <Card>
          {wordLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : wordOfDay ? (
            <View>
              <View style={styles.wordHeader}>
                <Text style={[styles.word, { color: colors.primary }]}>{wordOfDay.word}</Text>
                {wordOfDay.partOfSpeech && (
                  <Badge label={wordOfDay.partOfSpeech} />
                )}
              </View>
              {wordOfDay.phonetic && (
                <Text style={[styles.phonetic, { color: colors.textTertiary }]}>
                  {wordOfDay.phonetic}
                </Text>
              )}
              <Text style={[styles.definition, { color: colors.text }]}>
                {wordOfDay.definition}
              </Text>
              {wordOfDay.example && (
                <View style={[styles.exampleBox, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.exampleText, { color: colors.primaryDark }]}>
                    "{wordOfDay.example}"
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </Card>
      </View>

      {/* My Todos */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Tasks</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/todos')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        {myTodos.length === 0 ? (
          <Card>
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              All caught up! No pending tasks.
            </Text>
          </Card>
        ) : (
          myTodos.slice(0, 3).map((todo) => (
            <Card key={todo.id} style={styles.todoCard}>
              <View style={styles.todoRow}>
                <View style={[styles.priorityDot, { backgroundColor: priorityColor(todo.priority) }]} />
                <View style={styles.todoContent}>
                  <Text style={[styles.todoTitle, { color: colors.text }]}>{todo.title}</Text>
                  {todo.deadline && (
                    <Text
                      style={[
                        styles.todoDeadline,
                        {
                          color:
                            new Date(todo.deadline) < new Date()
                              ? colors.danger
                              : colors.textSecondary,
                        },
                      ]}>
                      {formatDate(todo.deadline)}
                    </Text>
                  )}
                </View>
                <Badge
                  label={todo.status === 'in_progress' ? 'In Progress' : 'Open'}
                  color={todo.status === 'in_progress' ? colors.warning + '30' : colors.info + '20'}
                  textColor={todo.status === 'in_progress' ? colors.warning : colors.info}
                />
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Events</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        {upcomingEvents.map((event) => {
          const creator = familyMembers.find((m) => m.id === event.created_by);
          return (
            <Card key={event.id} style={styles.eventCard}>
              <View style={styles.eventRow}>
                <View style={[styles.eventDateBox, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.eventDateText, { color: colors.primaryDark }]}>
                    {new Date(event.event_date).getDate()}
                  </Text>
                  <Text style={[styles.eventMonthText, { color: colors.primaryDark }]}>
                    {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
                  </Text>
                </View>
                <View style={styles.eventContent}>
                  <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
                  <Text style={[styles.eventMeta, { color: colors.textSecondary }]}>
                    {formatEventDate(event.event_date)}
                    {event.location ? ` \u00b7 ${event.location}` : ''}
                  </Text>
                </View>
                {creator && <Avatar name={creator.display_name} size={28} />}
              </View>
            </Card>
          );
        })}
      </View>

      {/* Mini Leaderboard */}
      <View style={[styles.section, { marginBottom: 32 }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Leaderboard</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/leaderboard')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
          </TouchableOpacity>
        </View>
        <Card>
          {leaderboard.map((entry, index) => (
            <View
              key={entry.userId}
              style={[
                styles.leaderRow,
                index < leaderboard.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.borderLight,
                },
              ]}>
              <Text style={[styles.leaderRank, { color: index === 0 ? colors.primary : colors.textTertiary }]}>
                {index === 0 ? '\ud83e\uddc1' : index === 1 ? '\ud83e\udd48' : '\ud83e\udd49'}
              </Text>
              <Avatar name={entry.name} size={32} />
              <View style={styles.leaderInfo}>
                <Text style={[styles.leaderName, { color: colors.text }]}>{entry.name}</Text>
                <Text style={[styles.leaderMeta, { color: colors.textSecondary }]}>
                  {entry.todosCompleted} completed
                </Text>
              </View>
              <Text style={[styles.leaderScore, { color: colors.primary }]}>{entry.score} pts</Text>
            </View>
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingTop: 8 },
  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greetingText: { fontSize: 14, fontWeight: '500' },
  userName: { fontSize: 26, fontWeight: '800', marginTop: 2 },
  familyAvatars: { flexDirection: 'row', paddingLeft: 8 },
  statsRow: { flexDirection: 'row', marginBottom: 24 },
  statCard: { alignItems: 'center', paddingVertical: 14 },
  statNumber: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  seeAll: { fontSize: 14, fontWeight: '600' },
  // Word of the Day
  wordHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  word: { fontSize: 22, fontWeight: '800' },
  phonetic: { fontSize: 13, marginTop: 2, fontStyle: 'italic' },
  definition: { fontSize: 15, lineHeight: 22, marginTop: 8 },
  exampleBox: { marginTop: 10, padding: 12, borderRadius: 10 },
  exampleText: { fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  // Todos
  todoCard: { marginBottom: 8 },
  todoRow: { flexDirection: 'row', alignItems: 'center' },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  todoContent: { flex: 1, marginRight: 8 },
  todoTitle: { fontSize: 15, fontWeight: '600' },
  todoDeadline: { fontSize: 12, marginTop: 2 },
  emptyText: { textAlign: 'center', fontSize: 14 },
  // Events
  eventCard: { marginBottom: 8 },
  eventRow: { flexDirection: 'row', alignItems: 'center' },
  eventDateBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  eventDateText: { fontSize: 18, fontWeight: '800' },
  eventMonthText: { fontSize: 10, fontWeight: '600', marginTop: -2 },
  eventContent: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: '600' },
  eventMeta: { fontSize: 12, marginTop: 2 },
  // Leaderboard
  leaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  leaderRank: { fontSize: 20, width: 32, textAlign: 'center' },
  leaderInfo: { flex: 1, marginLeft: 10 },
  leaderName: { fontSize: 15, fontWeight: '600' },
  leaderMeta: { fontSize: 12, marginTop: 1 },
  leaderScore: { fontSize: 16, fontWeight: '700' },
});
