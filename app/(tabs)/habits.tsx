import React, { useState, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Animated,
} from 'react-native';
import { ArrowLeft, Plus, Check, Flame, Pencil, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';

import Colors, { TOP_PADDING, USE_NATIVE_DRIVER } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { confirm, showAlert } from '@/lib/alert';
import { Habit, FrequencyType } from '@/lib/database.types';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CATEGORIES = [
  { value: 'health', label: 'Health', emoji: '💪', color: '#2ecc71' },
  { value: 'learning', label: 'Learning', emoji: '📚', color: '#3498db' },
  { value: 'chores', label: 'Chores', emoji: '🧹', color: '#f39c12' },
  { value: 'personal', label: 'Personal', emoji: '🌱', color: '#9b59b6' },
];

function getMemberEmoji(m: any) {
  if (m?.role_label === 'Mom') return '👩';
  if (m?.role_label === 'Dad') return '👨';
  if (m?.role_label === 'Son') return '🧑';
  if (m?.role_label === 'Daughter') return '👧';
  return '😊';
}

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

function startOfWeek(d: Date) {
  // Monday-start week
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Calculate streak based on frequency
function calcStreak(habit: Habit, userCheckins: string[]): number {
  const set = new Set(userCheckins); // 'YYYY-MM-DD'
  if (habit.frequency_type === 'daily') {
    let streak = 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    // If today not checked, start from yesterday
    if (!set.has(d.toISOString().split('T')[0])) d.setDate(d.getDate() - 1);
    while (set.has(d.toISOString().split('T')[0])) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }
  if (habit.frequency_type === 'weekly') {
    let streak = 0;
    const weekStart = startOfWeek(new Date());
    while (true) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const checkinsInWeek = userCheckins.filter((d) => {
        const dd = new Date(d + 'T00:00:00');
        return dd >= weekStart && dd < weekEnd;
      }).length;
      if (checkinsInWeek >= habit.frequency_count) {
        streak++;
        weekStart.setDate(weekStart.getDate() - 7);
      } else {
        break;
      }
    }
    return streak;
  }
  if (habit.frequency_type === 'custom' && habit.custom_days) {
    let streak = 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    while (true) {
      const dow = d.getDay();
      if (habit.custom_days.includes(dow)) {
        if (set.has(d.toISOString().split('T')[0])) {
          streak++;
          d.setDate(d.getDate() - 1);
        } else {
          // If today and not yet checked, skip it
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (d.getTime() === today.getTime()) {
            d.setDate(d.getDate() - 1);
          } else {
            break;
          }
        }
      } else {
        d.setDate(d.getDate() - 1);
      }
      if (streak > 365) break;
    }
    return streak;
  }
  return 0;
}

function isScheduledToday(habit: Habit, userCheckins: string[]): boolean {
  const today = todayKey();
  if (habit.frequency_type === 'daily') {
    return !userCheckins.includes(today);
  }
  if (habit.frequency_type === 'weekly') {
    const weekStart = startOfWeek(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const inWeek = userCheckins.filter((d) => {
      const dd = new Date(d + 'T00:00:00');
      return dd >= weekStart && dd < weekEnd;
    }).length;
    return inWeek < habit.frequency_count;
  }
  if (habit.frequency_type === 'custom' && habit.custom_days) {
    const dow = new Date().getDay();
    return habit.custom_days.includes(dow) && !userCheckins.includes(today);
  }
  return false;
}

function frequencyLabel(habit: Habit): string {
  if (habit.frequency_type === 'daily') return 'Daily';
  if (habit.frequency_type === 'weekly') return `${habit.frequency_count}x/week`;
  if (habit.frequency_type === 'custom' && habit.custom_days) {
    return habit.custom_days.map((d) => DAY_LABELS[d]).join('·');
  }
  return '';
}

export default function HabitsScreen() {
  const { user, familyMembers } = useAuth();
  const {
    habits, habitAssignees, habitCheckins,
    addHabit, updateHabit, deleteHabit, toggleHabitCheckin,
  } = useData();

  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New habit form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('health');
  const [newFreqType, setNewFreqType] = useState<FrequencyType>('daily');
  const [newFreqCount, setNewFreqCount] = useState(3);
  const [newCustomDays, setNewCustomDays] = useState<number[]>([]);
  const [newAssignees, setNewAssignees] = useState<string[]>(user?.id ? [user.id] : []);

  // Edit state
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('health');
  const [editFreqType, setEditFreqType] = useState<FrequencyType>('daily');
  const [editFreqCount, setEditFreqCount] = useState(3);
  const [editCustomDays, setEditCustomDays] = useState<number[]>([]);
  const [editAssignees, setEditAssignees] = useState<string[]>([]);

  const [titleError, setTitleError] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    setTitleError(true);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
    setTimeout(() => setTitleError(false), 2000);
  };

  // Helpers
  const myCheckinsFor = (habitId: string) =>
    habitCheckins.filter((c) => c.habit_id === habitId && c.user_id === user?.id).map((c) => c.checked_date);

  const assigneesFor = (habitId: string) =>
    habitAssignees.filter((a) => a.habit_id === habitId).map((a) => a.user_id);

  const getMemberColor = (id: string) => {
    const idx = familyMembers.findIndex((m) => m.id === id);
    return Colors.memberColors[idx % Colors.memberColors.length] || Colors.primary;
  };

  // Filter to habits assigned to current user
  const myHabits = useMemo(() => {
    return habits.filter((h) => assigneesFor(h.id).includes(user?.id || ''));
  }, [habits, habitAssignees, user?.id]);

  const todayHabits = useMemo(() => {
    return myHabits.filter((h) => isScheduledToday(h, myCheckinsFor(h.id)));
  }, [myHabits, habitCheckins]);

  const completedTodayHabits = useMemo(() => {
    return myHabits.filter((h) => myCheckinsFor(h.id).includes(todayKey()) && !isScheduledToday(h, myCheckinsFor(h.id).filter((d) => d !== todayKey())));
  }, [myHabits, habitCheckins]);

  const totalToday = todayHabits.length + completedTodayHabits.length;
  const doneToday = completedTodayHabits.length;
  const progress = totalToday > 0 ? (doneToday / totalToday) * 100 : 0;

  const handleAdd = async () => {
    if (!newTitle.trim()) { triggerShake(); return; }
    if (!user) return;
    if (newAssignees.length === 0) { showAlert('Pick someone', 'Select at least one assignee'); return; }
    if (newFreqType === 'custom' && newCustomDays.length === 0) { showAlert('Pick days', 'Select at least one day for a custom habit'); return; }

    const err = await addHabit({
      title: newTitle.trim(),
      category: newCategory,
      frequency_type: newFreqType,
      frequency_count: newFreqType === 'weekly' ? newFreqCount : 1,
      custom_days: newFreqType === 'custom' ? newCustomDays : null,
      created_by: user.id,
    }, newAssignees);

    if (err) {
      showAlert('Error', err);
    } else {
      setNewTitle('');
      setNewCategory('health');
      setNewFreqType('daily');
      setNewFreqCount(3);
      setNewCustomDays([]);
      setNewAssignees([user.id]);
      setShowAdd(false);
    }
  };

  const startEdit = (h: Habit) => {
    setEditingId(h.id);
    setEditTitle(h.title);
    setEditCategory(h.category);
    setEditFreqType(h.frequency_type);
    setEditFreqCount(h.frequency_count);
    setEditCustomDays(h.custom_days || []);
    setEditAssignees(assigneesFor(h.id));
    setExpandedId(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;
    await updateHabit(editingId, {
      title: editTitle.trim(),
      category: editCategory,
      frequency_type: editFreqType,
      frequency_count: editFreqType === 'weekly' ? editFreqCount : 1,
      custom_days: editFreqType === 'custom' ? editCustomDays : null,
    }, editAssignees);
    setEditingId(null);
  };

  const renderHabitCard = (habit: Habit) => {
    const isExpanded = expandedId === habit.id;
    const checkins = myCheckinsFor(habit.id);
    const checkedToday = checkins.includes(todayKey());
    const streak = calcStreak(habit, checkins);
    const cat = CATEGORIES.find((c) => c.value === habit.category) || CATEGORIES[0];
    const assignees = assigneesFor(habit.id);
    const isShared = assignees.length > 1;

    // Weekly progress
    let weekProgress = '';
    if (habit.frequency_type === 'weekly') {
      const weekStart = startOfWeek(new Date());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const inWeek = checkins.filter((d) => {
        const dd = new Date(d + 'T00:00:00');
        return dd >= weekStart && dd < weekEnd;
      }).length;
      weekProgress = `${inWeek}/${habit.frequency_count} this week`;
    }

    if (editingId === habit.id) return renderEditForm(habit);

    return (
      <TouchableOpacity
        key={habit.id}
        activeOpacity={0.85}
        onPress={() => setExpandedId(isExpanded ? null : habit.id)}
        style={[s.habitCard, checkedToday && { borderLeftWidth: 3, borderLeftColor: Colors.success }]}>
        <View style={s.habitTopRow}>
          <TouchableOpacity
            style={checkedToday ? s.checkboxDone : s.checkbox}
            onPress={() => toggleHabitCheckin(habit.id)}>
            {checkedToday && <Check size={12} color={Colors.background} />}
          </TouchableOpacity>
          <View style={[s.catEmoji, { backgroundColor: cat.color + '25' }]}>
            <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
          </View>
          <View style={s.habitText}>
            <Text style={[s.habitTitle, checkedToday && { textDecorationLine: 'line-through', opacity: 0.6 }]} numberOfLines={isExpanded ? undefined : 1}>
              {habit.title}
            </Text>
            <View style={s.habitMeta}>
              <Text style={s.habitFreq}>{frequencyLabel(habit)}</Text>
              {isShared && (
                <View style={s.assigneeRow}>
                  {assignees.slice(0, 3).map((aid, i) => {
                    const m = familyMembers.find((mm) => mm.id === aid);
                    const c = getMemberColor(aid);
                    return (
                      <View key={aid} style={[s.miniAvatar, { backgroundColor: c + '25', borderColor: c, marginLeft: i === 0 ? 0 : -8 }]}>
                        <Text style={{ fontSize: 9 }}>{getMemberEmoji(m)}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
          {streak > 0 && (
            <View style={s.streakBadge}>
              <Flame size={12} color="#f39c12" />
              <Text style={s.streakText}>{streak}</Text>
            </View>
          )}
          <TouchableOpacity style={s.editBtn} onPress={() => startEdit(habit)}>
            <Pencil size={14} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteBtn} onPress={() => confirm('Delete', `Delete "${habit.title}"?`, () => deleteHabit(habit.id), true)}>
            <Trash2 size={14} color={Colors.destructive} />
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={s.expandedDetail}>
            {weekProgress ? <Text style={s.expandedDesc}>{weekProgress}</Text> : null}
            {streak > 0 && (
              <Text style={s.expandedDesc}>
                🔥 {streak} {habit.frequency_type === 'weekly' ? 'week' : 'day'}{streak === 1 ? '' : 's'} streak
              </Text>
            )}
            {isShared && (
              <View style={s.groupStatusList}>
                {assignees.map((aid) => {
                  const m = familyMembers.find((mm) => mm.id === aid);
                  const c = getMemberColor(aid);
                  const memberCheckedToday = habitCheckins.some(
                    (ck) => ck.habit_id === habit.id && ck.user_id === aid && ck.checked_date === todayKey()
                  );
                  return (
                    <View key={aid} style={s.groupStatusRow}>
                      <View style={[s.miniAvatar, { backgroundColor: c + '25', borderColor: c }]}>
                        <Text style={{ fontSize: 11 }}>{getMemberEmoji(m)}</Text>
                      </View>
                      <Text style={s.groupStatusName}>{m?.display_name.split(' ')[0] || '?'}</Text>
                      <Text style={[s.groupStatusBadge, { color: memberCheckedToday ? Colors.success : Colors.muted }]}>
                        {memberCheckedToday ? '✓ Today' : '• Pending'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEditForm = (habit: Habit) => (
    <View key={habit.id} style={s.formCard}>
      <TextInput value={editTitle} onChangeText={setEditTitle} style={s.formTitleInput} autoFocus />
      <Text style={s.formLabel}>Category</Text>
      <View style={s.chipRow}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity key={c.value} onPress={() => setEditCategory(c.value)}
            style={[s.chip, editCategory === c.value && { backgroundColor: c.color + '25', borderColor: c.color }]}>
            <Text style={{ fontSize: 12 }}>{c.emoji}</Text>
            <Text style={[s.chipText, editCategory === c.value && { color: c.color }]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {renderFrequencyControls(editFreqType, setEditFreqType, editFreqCount, setEditFreqCount, editCustomDays, setEditCustomDays)}
      {renderAssigneeChips(editAssignees, setEditAssignees)}
      <View style={s.formActions}>
        <TouchableOpacity onPress={() => setEditingId(null)} style={s.cancelBtn}>
          <Text style={s.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={saveEdit} style={s.submitBtn}>
          <Text style={s.submitText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFrequencyControls = (
    freqType: FrequencyType, setFreqType: (v: FrequencyType) => void,
    freqCount: number, setFreqCount: (n: number) => void,
    customDays: number[], setCustomDays: (d: number[]) => void,
  ) => (
    <>
      <Text style={s.formLabel}>Frequency</Text>
      <View style={s.chipRow}>
        {(['daily', 'weekly', 'custom'] as const).map((ft) => (
          <TouchableOpacity key={ft} onPress={() => setFreqType(ft)}
            style={[s.chip, freqType === ft && { backgroundColor: Colors.primaryBg, borderColor: Colors.primary }]}>
            <Text style={[s.chipText, freqType === ft && { color: Colors.primary }]}>
              {ft === 'daily' ? 'Daily' : ft === 'weekly' ? 'Weekly' : 'Custom'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {freqType === 'weekly' && (
        <View style={s.stepperRow}>
          <TouchableOpacity onPress={() => setFreqCount(Math.max(1, freqCount - 1))} style={s.stepBtn}>
            <Text style={s.stepText}>−</Text>
          </TouchableOpacity>
          <Text style={s.stepValue}>{freqCount}× / week</Text>
          <TouchableOpacity onPress={() => setFreqCount(Math.min(7, freqCount + 1))} style={s.stepBtn}>
            <Text style={s.stepText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
      {freqType === 'custom' && (
        <View style={s.dayRow}>
          {DAY_LABELS.map((label, i) => {
            const selected = customDays.includes(i);
            return (
              <TouchableOpacity key={i} onPress={() => {
                setCustomDays(selected ? customDays.filter((d) => d !== i) : [...customDays, i].sort());
              }} style={[s.dayBtn, selected && { backgroundColor: Colors.primary }]}>
                <Text style={[s.dayBtnText, selected && { color: Colors.background }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </>
  );

  const renderAssigneeChips = (assignees: string[], setAssignees: (v: string[]) => void) => (
    <>
      <Text style={s.formLabel}>Assign to (tap to toggle)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={s.chipRow}>
        {familyMembers.map((m) => {
          const c = getMemberColor(m.id);
          const selected = assignees.includes(m.id);
          return (
            <TouchableOpacity key={m.id} onPress={() => {
              setAssignees(selected ? assignees.filter((id) => id !== m.id) : [...assignees, m.id]);
            }} style={[s.chip, selected && { backgroundColor: c + '20', borderColor: c }]}>
              <Text style={{ fontSize: 12 }}>{getMemberEmoji(m)}</Text>
              <Text style={[s.chipText, selected && { color: c }]}>{m.display_name.split(' ')[0]}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </>
  );

  return (
    <View style={s.container}>
      <View style={s.topSection}>
        <View style={s.header}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={20} color={Colors.foreground} />
            </TouchableOpacity>
            <Text style={s.title}>Habits</Text>
            <View style={s.headerRight}>
              <Text style={s.remainingNum}>{doneToday}</Text>
              <Text style={s.remainingLabel}>of {totalToday} done today</Text>
            </View>
          </View>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {!showAdd ? (
          <View style={s.addRow}>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              onFocus={() => setShowAdd(true)}
              placeholder="Add a new habit..."
              placeholderTextColor={Colors.muted}
              style={s.addInput}
            />
            <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)} activeOpacity={0.8}>
              <Plus size={18} color={Colors.background} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.formCard}>
            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <TextInput
                value={newTitle}
                onChangeText={(t) => { setNewTitle(t); if (t.trim()) setTitleError(false); }}
                placeholder="What habit?"
                placeholderTextColor={titleError ? Colors.destructive : Colors.muted}
                style={[s.formTitleInput, titleError && { borderWidth: 1, borderColor: Colors.destructive }]}
                autoFocus
              />
            </Animated.View>
            <Text style={s.formLabel}>Category</Text>
            <View style={s.chipRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity key={c.value} onPress={() => setNewCategory(c.value)}
                  style={[s.chip, newCategory === c.value && { backgroundColor: c.color + '25', borderColor: c.color }]}>
                  <Text style={{ fontSize: 12 }}>{c.emoji}</Text>
                  <Text style={[s.chipText, newCategory === c.value && { color: c.color }]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {renderFrequencyControls(newFreqType, setNewFreqType, newFreqCount, setNewFreqCount, newCustomDays, setNewCustomDays)}
            {renderAssigneeChips(newAssignees, setNewAssignees)}
            <View style={s.formActions}>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={s.cancelBtn}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAdd} style={s.submitBtn}>
                <Text style={s.submitText}>Create Habit</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <ScrollView style={s.list} contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
        {todayHabits.length > 0 && (
          <>
            <Text style={s.sectionLabel}>TODAY</Text>
            {todayHabits.map(renderHabitCard)}
          </>
        )}
        {completedTodayHabits.length > 0 && (
          <>
            <Text style={s.sectionLabel}>DONE TODAY</Text>
            {completedTodayHabits.map(renderHabitCard)}
          </>
        )}
        {myHabits.filter((h) => !todayHabits.includes(h) && !completedTodayHabits.includes(h)).length > 0 && (
          <>
            <Text style={s.sectionLabel}>OTHER HABITS</Text>
            {myHabits.filter((h) => !todayHabits.includes(h) && !completedTodayHabits.includes(h)).map(renderHabitCard)}
          </>
        )}
        {myHabits.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyText}>No habits yet. Add one above to get started!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topSection: { flexShrink: 0 },
  header: { paddingHorizontal: 16, paddingTop: TOP_PADDING, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.foreground },
  headerRight: { alignItems: 'flex-end' },
  remainingNum: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  remainingLabel: { fontSize: 10, color: Colors.muted, marginTop: -2 },
  progressBar: { height: 6, backgroundColor: Colors.surface, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  // Add row
  addRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginVertical: 8, flexShrink: 0 },
  addInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Colors.foreground, borderWidth: 1, borderColor: Colors.border },
  addBtn: { backgroundColor: Colors.primary, padding: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  // Form card
  formCard: { marginHorizontal: 16, marginVertical: 8, backgroundColor: Colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: Colors.primaryBorder, gap: 10 },
  formTitleInput: { backgroundColor: Colors.surfaceLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.foreground },
  formLabel: { fontSize: 10, fontWeight: '600', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
  chipText: { fontSize: 11, fontWeight: '600', color: Colors.muted },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 18, color: Colors.foreground, fontWeight: '700' },
  stepValue: { fontSize: 14, color: Colors.foreground, fontWeight: '600' },
  dayRow: { flexDirection: 'row', gap: 6 },
  dayBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.surfaceLight, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  dayBtnText: { fontSize: 12, fontWeight: '700', color: Colors.muted },
  formActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.surfaceLight },
  cancelText: { fontSize: 13, fontWeight: '600', color: Colors.muted },
  submitBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.primary },
  submitText: { fontSize: 13, fontWeight: '600', color: Colors.background },
  // List
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.muted, marginTop: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  // Habit card
  habitCard: { backgroundColor: Colors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  habitTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.muted, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { width: 22, height: 22, borderRadius: 6, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center' },
  catEmoji: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  habitText: { flex: 1 },
  habitTitle: { fontSize: 14, color: Colors.foreground, fontWeight: '500' },
  habitMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  habitFreq: { fontSize: 11, color: Colors.muted },
  assigneeRow: { flexDirection: 'row' },
  miniAvatar: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(243,156,18,0.15)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10 },
  streakText: { fontSize: 11, fontWeight: '700', color: '#f39c12' },
  editBtn: { padding: 8, borderRadius: 10, backgroundColor: Colors.primaryBg },
  deleteBtn: { padding: 8, borderRadius: 10, backgroundColor: Colors.destructiveBg },
  // Expanded
  expandedDetail: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border, gap: 6 },
  expandedDesc: { fontSize: 12, color: Colors.muted },
  groupStatusList: { gap: 6, marginTop: 4 },
  groupStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupStatusName: { flex: 1, fontSize: 13, color: Colors.foreground },
  groupStatusBadge: { fontSize: 11, fontWeight: '600' },
  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: Colors.muted },
});
