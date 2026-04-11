import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useData } from '@/context/DataContext';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';

const RANK_EMOJIS = ['\ud83e\uddc1', '\ud83e\udd48', '\ud83e\udd49'];
const BADGES_MAP: Record<string, { label: string; color: string }> = {
  taskmaster: { label: 'Taskmaster', color: '#F59E0B' },
  speedster: { label: 'Speedster', color: '#3B82F6' },
  buzzyBee: { label: 'Buzzy Bee', color: '#10B981' },
  rookie: { label: 'Rookie', color: '#8B5CF6' },
};

export default function LeaderboardScreen() {
  const colors = useThemeColors();
  const { leaderboard } = useData();

  const getBadge = (entry: typeof leaderboard[0], rank: number) => {
    if (entry.todosCompleted >= 5) return BADGES_MAP.taskmaster;
    if (entry.avgCompletionHours !== null && entry.avgCompletionHours < 24) return BADGES_MAP.speedster;
    if (rank === 0 && entry.score > 0) return BADGES_MAP.buzzyBee;
    return BADGES_MAP.rookie;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      {/* Podium — reorder to show 2nd, 1st, 3rd visually */}
      {leaderboard.length >= 3 ? (
      <View style={styles.podium}>
        {[leaderboard[1], leaderboard[0], leaderboard[2]].map((entry, visualIndex) => {
          const isFirst = visualIndex === 1; // center = 1st place
          const rankIndex = [1, 0, 2][visualIndex]; // map back to actual rank

          return (
            <View
              key={entry.userId}
              style={[
                styles.podiumItem,
                isFirst && styles.podiumFirst,
              ]}>
              <Text style={styles.rankEmoji}>{RANK_EMOJIS[rankIndex]}</Text>
              <Avatar
                name={entry.name}
                size={isFirst ? 64 : 48}
                style={[
                  styles.podiumAvatar,
                  isFirst && { borderWidth: 3, borderColor: colors.primary },
                ]}
              />
              <Text
                style={[
                  styles.podiumName,
                  { color: colors.text },
                  isFirst && styles.podiumNameFirst,
                ]}>
                {entry.name}
              </Text>
              <Text style={[styles.podiumScore, { color: colors.primary }]}>
                {entry.score} pts
              </Text>
              {entry.roleLabel && (
                <Text style={[styles.podiumRole, { color: colors.textTertiary }]}>
                  {entry.roleLabel}
                </Text>
              )}
            </View>
          );
        })}
      </View>
      ) : null}

      {/* Detailed List */}
      <View style={styles.listSection}>
        <Text style={[styles.listTitle, { color: colors.text }]}>Full Standings</Text>
        {leaderboard.map((entry, index) => {
          const badge = getBadge(entry, index);
          const completionRate =
            entry.todosTotal > 0
              ? Math.round((entry.todosCompleted / entry.todosTotal) * 100)
              : 0;

          return (
            <Card key={entry.userId} style={styles.entryCard}>
              <View style={styles.entryRow}>
                <Text style={[styles.rank, { color: index < 3 ? colors.primary : colors.textTertiary }]}>
                  {index < 3 ? RANK_EMOJIS[index] : `#${index + 1}`}
                </Text>
                <Avatar name={entry.name} size={44} />
                <View style={styles.entryInfo}>
                  <View style={styles.entryNameRow}>
                    <Text style={[styles.entryName, { color: colors.text }]}>{entry.name}</Text>
                    <Badge label={badge.label} color={badge.color + '20'} textColor={badge.color} />
                  </View>
                  {entry.roleLabel && (
                    <Text style={[styles.entryRole, { color: colors.textTertiary }]}>
                      {entry.roleLabel}
                    </Text>
                  )}

                  {/* Stats */}
                  <View style={styles.statsRow}>
                    <View style={styles.stat}>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {entry.todosCompleted}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Done</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.stat}>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {completionRate}%
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Rate</Text>
                    </View>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.stat}>
                      <Text style={[styles.statValue, { color: colors.text }]}>
                        {entry.avgCompletionHours !== null
                          ? `${Math.round(entry.avgCompletionHours)}h`
                          : '-'}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textTertiary }]}>Avg Time</Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: colors.primary,
                          width: `${completionRate}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
                <Text style={[styles.entryScore, { color: colors.primary }]}>{entry.score}</Text>
              </View>
            </Card>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  // Podium
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: 32, paddingTop: 16 },
  podiumItem: { alignItems: 'center', flex: 1 },
  podiumFirst: { marginTop: -16 },
  rankEmoji: { fontSize: 24, marginBottom: 8 },
  podiumAvatar: {},
  podiumName: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  podiumNameFirst: { fontSize: 16, fontWeight: '700' },
  podiumScore: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  podiumRole: { fontSize: 11, marginTop: 2 },
  // List
  listSection: { marginTop: 8 },
  listTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  entryCard: { marginBottom: 10 },
  entryRow: { flexDirection: 'row', alignItems: 'flex-start' },
  rank: { width: 32, fontSize: 18, textAlign: 'center', fontWeight: '700', marginRight: 4, paddingTop: 8 },
  entryInfo: { flex: 1, marginLeft: 12 },
  entryNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  entryName: { fontSize: 16, fontWeight: '700' },
  entryRole: { fontSize: 12, marginTop: 1 },
  entryScore: { fontSize: 22, fontWeight: '800', paddingTop: 4 },
  // Stats
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 14, fontWeight: '700' },
  statLabel: { fontSize: 10, marginTop: 1 },
  statDivider: { width: 1, height: 24 },
  // Progress
  progressBar: { height: 4, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
});
