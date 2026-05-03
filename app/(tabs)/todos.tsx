import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Linking, Platform, Animated,
} from 'react-native';
import { ArrowLeft, Plus, Check, MessageCircle, Trash2, Pencil, X, CalendarDays, Share2, ChevronDown, ChevronRight } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';

import Colors, { TOP_PADDING, USE_NATIVE_DRIVER } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { showAlert, confirm } from '@/lib/alert';
import { HexIcon } from '@/components/ui/HexIcon';

function PulsingHex({ onPress, bg, label }: { onPress: () => void; bg: string; label: string }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 1200, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(scale, { toValue: 1, duration: 1200, useNativeDriver: USE_NATIVE_DRIVER }),
      ])
    ).start();
  }, []);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <HexIcon size={32} bg={bg}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{label}</Text>
        </HexIcon>
      </Animated.View>
    </TouchableOpacity>
  );
}

function DatePickerField({ value, onChange, placeholder = 'Pick a date' }: {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const dateValue = value ? new Date(value + 'T00:00:00') : new Date();
  const displayText = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  if (Platform.OS === 'web') {
    return (
      <View style={dpStyles.row}>
        <CalendarDays size={16} color={Colors.muted} />
        <input
          type="date"
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            fontSize: 14,
            color: Colors.foreground,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity style={dpStyles.row} onPress={() => setShowPicker(true)}>
        <CalendarDays size={16} color={Colors.muted} />
        <Text style={[dpStyles.text, !value && { color: Colors.muted }]}>
          {displayText || placeholder}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(_, selectedDate) => {
            setShowPicker(false);
            if (selectedDate) {
              const y = selectedDate.getFullYear();
              const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
              const d = String(selectedDate.getDate()).padStart(2, '0');
              onChange(`${y}-${m}-${d}`);
            }
          }}
        />
      )}
    </View>
  );
}

const dpStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surfaceLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  webInput: { flex: 1, fontSize: 14, color: Colors.foreground, backgroundColor: 'transparent' },
  text: { fontSize: 14, color: Colors.foreground },
});

export default function TodosScreen() {
  const { user, familyMembers } = useAuth();
  const { todos, toggleTodoStatus, addTodo, deleteTodo, updateTodo } = useData();
  const [filter, setFilter] = useState('All');
  const [labelFilter, setLabelFilter] = useState<'all' | 'personal' | 'work'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set(['completed']));
  const toggleSection = (key: string) => setCollapsedSections((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const [showAdd, setShowAdd] = useState(false);
  const [newTodoText, setNewTodoText] = useState('');
  const [newPriority, setNewPriority] = useState(2);
  const [newDeadlineDate, setNewDeadlineDate] = useState('');
  const [newAssignees, setNewAssignees] = useState<string[]>(user?.id ? [user.id] : []);
  const [newLabel, setNewLabel] = useState<'personal' | 'work'>('personal');
  const [newLocation, setNewLocation] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState(2);
  const [editDeadline, setEditDeadline] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editLabel, setEditLabel] = useState<'personal' | 'work'>('personal');
  const [editLocation, setEditLocation] = useState('');

  const startEdit = (todo: typeof todos[0]) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditPriority(todo.priority);
    setEditLabel(todo.label || 'personal');
    setEditLocation(todo.location || '');
    setEditDeadline(todo.deadline ? todo.deadline.split('T')[0] : '');
    setEditAssignee(todo.assigned_to);
  };

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim()) return;
    const original = todos.find((t) => t.id === editingId);
    if (!original) return;

    // If this todo is part of a group, update all group members (except assignee)
    const groupTodos = todos.filter((t) => {
      const createdMin = (t.created_at || '').substring(0, 16);
      const origMin = (original.created_at || '').substring(0, 16);
      return t.title === original.title
        && t.created_by === original.created_by
        && (t.deadline || '') === (original.deadline || '')
        && createdMin === origMin;
    });

    const sharedUpdates = {
      title: editTitle.trim(),
      priority: editPriority,
      deadline: editDeadline ? new Date(editDeadline + 'T23:59:59').toISOString() : null,
      label: editLabel,
      location: editLocation.trim() || null,
    };

    if (groupTodos.length > 1) {
      // Edit the whole group — share title/deadline/priority/label/location, but assignee only for the edited todo
      await Promise.all(groupTodos.map((t) =>
        updateTodo(t.id, t.id === editingId ? { ...sharedUpdates, assigned_to: editAssignee } : sharedUpdates)
      ));
    } else {
      await updateTodo(editingId, { ...sharedUpdates, assigned_to: editAssignee });
    }
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const members = ['All', ...familyMembers.map((m) => m.display_name.split(' ')[0])];
  const getMember = (id: string) => familyMembers.find((m) => m.id === id);
  const getMemberEmoji = (m: any) => m?.role_label === 'Mom' ? '👩' : m?.role_label === 'Dad' ? '👨' : m?.role_label === 'Son' ? '🧑' : m?.role_label === 'Daughter' ? '👧' : '😊';
  const getMemberColor = (id: string) => {
    const idx = familyMembers.findIndex((m) => m.id === id);
    return Colors.memberColors[idx % Colors.memberColors.length] || Colors.primary;
  };

  const filteredTodos = todos.filter((t) => {
    if (filter !== 'All' && getMember(t.assigned_to)?.display_name.split(' ')[0] !== filter) return false;
    if (labelFilter !== 'all' && (t.label || 'personal') !== labelFilter) return false;
    return true;
  });

  // Group signature: todos sharing same title + creator + deadline + created_at (minute precision)
  // are treated as one multi-assigned group when viewing "All"
  const groupKey = (t: typeof todos[0]) => {
    const createdMin = t.created_at ? t.created_at.substring(0, 16) : '';
    return `${t.title}|${t.created_by}|${t.deadline || ''}|${createdMin}`;
  };

  // Build grouped view only for "All" filter. Specific person filter shows individual todos.
  type TodoGroup = { key: string; primary: typeof todos[0]; members: typeof todos };
  const buildGroups = (list: typeof todos): TodoGroup[] => {
    const map = new Map<string, typeof todos>();
    list.forEach((t) => {
      const k = groupKey(t);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    });
    return Array.from(map.entries()).map(([key, members]) => ({ key, primary: members[0], members }));
  };

  const activeTodos = filteredTodos.filter((t) => t.status !== 'done');
  const doneTodos = filteredTodos.filter((t) => t.status === 'done');
  const remaining = activeTodos.length;
  const total = filteredTodos.length;
  const progress = total > 0 ? ((total - remaining) / total) * 100 : 0;

  const priorities = [
    { value: 0, label: 'P0', color: Colors.p0 },
    { value: 1, label: 'P1', color: Colors.p1 },
    { value: 2, label: 'P2', color: Colors.p2 },
    { value: 3, label: 'P3', color: Colors.p3 },
  ];

  const [titleError, setTitleError] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    setTitleError(true);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();
    setTimeout(() => setTitleError(false), 2000);
  };

  const handleAdd = async () => {
    if (!newTodoText.trim()) { triggerShake(); return; }
    if (!user) return;
    const assignees = newAssignees.length > 0 ? newAssignees : [user.id];
    // Create one todo per assignee — group is detected by matching title+creator+deadline+created_at
    const baseTodo = {
      title: newTodoText.trim(),
      description: null,
      deadline: newDeadlineDate ? new Date(newDeadlineDate + 'T23:59:59').toISOString() : null,
      location: newLocation.trim() || null,
      priority: newPriority,
      status: 'open' as const,
      label: newLabel,
      created_by: user.id,
    };
    const results = await Promise.all(
      assignees.map((assigneeId) => addTodo({ ...baseTodo, assigned_to: assigneeId }))
    );
    const firstErr = results.find((r) => r);
    if (firstErr) {
      showAlert('Error', firstErr);
    } else {
      setNewTodoText('');
      setNewPriority(2);
      setNewLabel('personal');
      setNewLocation('');
      setNewDeadlineDate('');
      setNewAssignees([user.id]);
      setShowAdd(false);
    }
  };

  // Group active todos by deadline
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const byPriority = (a: typeof todos[0], b: typeof todos[0]) => a.priority - b.priority;

  const overdueTodos = activeTodos.filter((t) => t.deadline && new Date(t.deadline) < todayStart).sort(byPriority);
  const noDeadlineTodos = activeTodos.filter((t) => !t.deadline).sort(byPriority);
  const withDeadlineTodos = activeTodos.filter((t) => t.deadline && new Date(t.deadline) >= todayStart);

  // Group by deadline date
  const deadlineGroups: { date: string; label: string; todos: typeof activeTodos }[] = [];
  const grouped = new Map<string, typeof activeTodos>();
  withDeadlineTodos.forEach((t) => {
    const d = new Date(t.deadline!);
    const key = d.toISOString().split('T')[0];
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(t);
  });
  // Sort by date
  [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, todos]) => {
      const d = new Date(key + 'T00:00:00');
      const label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
      deadlineGroups.push({ date: key, label: `Complete by ${label}`, todos: todos.sort(byPriority) });
    });

  const handleToggle = async (todoId: string) => {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;
    const wasOpen = todo.status !== 'done';
    await toggleTodoStatus(todoId);

    // Show share prompt only when completing (not uncompleting)
    if (wasOpen) {
      const memberName = getMember(todo.assigned_to)?.display_name || 'Someone';
      const msg = encodeURIComponent(`${memberName} just completed: "${todo.title}" ✅🐝`);
      confirm(
        'Task completed! 🎉',
        `Share this achievement with the family?`,
        () => Linking.openURL(`https://wa.me/?text=${msg}`),
      );
    }
  };

  const handleNudge = (todoId: string) => {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;
    const assignee = getMember(todo.assigned_to);
    const msg = encodeURIComponent(`Hey ${assignee?.display_name || 'there'}! Don't forget: "${todo.title}" 🐝`);
    Linking.openURL(`https://wa.me/?text=${msg}`);
  };

  const renderTodoItem = (todo: typeof todos[0], group?: typeof todos) => {
    const isGroup = !!group && group.length > 1;
    const groupAssignees = isGroup ? group.map((t) => t.assigned_to) : [];
    const member = getMember(todo.assigned_to);
    const color = getMemberColor(todo.assigned_to);
    const isOverdue = todo.deadline && new Date(todo.deadline) < todayStart;

    // Inline edit form
    if (editingId === todo.id) {
      return (
        <View key={todo.id} style={s.editForm}>
          <TextInput value={editTitle} onChangeText={setEditTitle} style={s.addFormTitle} autoFocus />
          <View style={s.addFormRow}>
            <Text style={s.addFormLabel}>Priority</Text>
            <View style={s.addFormChips}>
              {priorities.map((p) => (
                <TouchableOpacity key={p.value} onPress={() => setEditPriority(p.value)}
                  style={[s.chip, editPriority === p.value && { backgroundColor: p.color + '25', borderColor: p.color }]}>
                  <View style={[s.chipDot, { backgroundColor: p.color }]} />
                  <Text style={[s.chipText, editPriority === p.value && { color: p.color }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={s.addFormRow}>
            <Text style={s.addFormLabel}>Label</Text>
            <View style={s.addFormChips}>
              {(['personal', 'work'] as const).map((l) => (
                <TouchableOpacity key={l} onPress={() => setEditLabel(l)}
                  style={[s.chip, editLabel === l && { backgroundColor: l === 'personal' ? '#9b59b620' : '#3498db20', borderColor: l === 'personal' ? '#9b59b6' : '#3498db' }]}>
                  <Text style={[s.chipText, editLabel === l && { color: l === 'personal' ? '#9b59b6' : '#3498db' }]}>{l.charAt(0).toUpperCase() + l.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={s.addFormRow}>
            <Text style={s.addFormLabel}>Deadline</Text>
            <DatePickerField value={editDeadline} onChange={setEditDeadline} />
          </View>
          <View style={s.addFormRow}>
            <Text style={s.addFormLabel}>Location (optional)</Text>
            <TextInput
              value={editLocation}
              onChangeText={setEditLocation}
              placeholder="e.g., Office, Home, Mall..."
              placeholderTextColor={Colors.muted}
              style={s.addFormTitle}
            />
          </View>
          <View style={s.addFormRow}>
            <Text style={s.addFormLabel}>Assign to</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={s.addFormChips}>
              {familyMembers.map((m) => {
                const mc = getMemberColor(m.id);
                return (
                  <TouchableOpacity key={m.id} onPress={() => setEditAssignee(m.id)}
                    style={[s.assignChip, editAssignee === m.id && { backgroundColor: mc + '20', borderColor: mc }]}>
                    <Text style={{ fontSize: 12 }}>{getMemberEmoji(m)}</Text>
                    <Text style={[s.chipText, editAssignee === m.id && { color: mc }]}>{m.display_name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          <View style={s.addFormActions}>
            <TouchableOpacity onPress={cancelEdit} style={s.cancelBtn}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.submitBtn} onPress={saveEdit} activeOpacity={0.8}>
              <Text style={s.submitText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const isExpanded = expandedId === todo.id;
    const priorityColor = [Colors.p0, Colors.p1, Colors.p2, Colors.p3][todo.priority];

    return (
      <TouchableOpacity
        key={todo.id}
        activeOpacity={0.8}
        onPress={() => setExpandedId(isExpanded ? null : todo.id)}
        style={[s.todoCard, isOverdue && { borderLeftWidth: 3, borderLeftColor: Colors.destructive }]}>
        {/* Top row — always visible */}
        <View style={s.todoTopRow}>
          {/* Checkbox: toggles current user's own todo if in group, else the todo itself */}
          {(() => {
            const myTodo = isGroup ? group!.find((t) => t.assigned_to === user?.id) : todo;
            const isDone = myTodo?.status === 'done';
            return (
              <TouchableOpacity style={isDone ? s.checkboxDone : s.checkbox} onPress={() => myTodo && handleToggle(myTodo.id)} disabled={!myTodo}>
                {isDone ? <Check size={12} color={Colors.background} /> : <View style={s.checkboxInner} />}
              </TouchableOpacity>
            );
          })()}

          {isGroup ? (
            <View style={s.avatarStack}>
              {groupAssignees.slice(0, 3).map((aid, i) => {
                const m = getMember(aid);
                const c = getMemberColor(aid);
                const isDoneForMember = group!.find((t) => t.assigned_to === aid)?.status === 'done';
                return (
                  <View key={aid} style={[s.stackedAvatar, { backgroundColor: c + '25', borderColor: c, marginLeft: i === 0 ? 0 : -10, opacity: isDoneForMember ? 0.4 : 1 }]}>
                    <Text style={{ fontSize: 12 }}>{getMemberEmoji(m)}</Text>
                  </View>
                );
              })}
              {groupAssignees.length > 3 && (
                <View style={[s.stackedAvatar, { backgroundColor: Colors.surfaceLight, borderColor: Colors.border, marginLeft: -10 }]}>
                  <Text style={{ fontSize: 9, color: Colors.muted, fontWeight: '700' }}>+{groupAssignees.length - 3}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={[s.todoEmoji, { backgroundColor: color + '25' }]}>
              <Text style={{ fontSize: 12 }}>{getMemberEmoji(member)}</Text>
            </View>
          )}
          <View style={s.todoText}>
            <Text style={s.todoTitle} numberOfLines={isExpanded ? undefined : 1}>{todo.title}</Text>
            <View style={s.todoMeta}>
              <Text style={s.todoAssignee}>
                {isGroup
                  ? groupAssignees.map((id) => getMember(id)?.display_name.split(' ')[0] || '?').slice(0, 2).join(', ') + (groupAssignees.length > 2 ? ` +${groupAssignees.length - 2}` : '')
                  : member?.display_name.split(' ')[0] || 'Unknown'}
              </Text>
              <View style={[s.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                <Text style={[s.priorityText, { color: priorityColor }]}>P{todo.priority}</Text>
              </View>
              <View style={[s.labelBadge, { backgroundColor: todo.label === 'work' ? '#3498db20' : '#9b59b620' }]}>
                <Text style={[s.labelText, { color: todo.label === 'work' ? '#3498db' : '#9b59b6' }]}>{todo.label === 'work' ? 'Work' : 'Personal'}</Text>
              </View>
            </View>
          </View>
          {!isGroup && todo.assigned_to !== user?.id && (
            <TouchableOpacity style={s.nudgeBtn} onPress={() => handleNudge(todo.id)}>
              <MessageCircle size={14} color="#25D366" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.editBtn} onPress={() => startEdit(todo)}>
            <Pencil size={14} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteBtn} onPress={() => {
            const msg = isGroup ? `Delete this task for all ${group!.length} assignees?` : `Delete "${todo.title}"?`;
            confirm('Delete', msg, () => {
              if (isGroup) {
                group!.forEach((t) => deleteTodo(t.id));
              } else {
                deleteTodo(todo.id);
              }
            }, true);
          }}>
            <Trash2 size={14} color={Colors.destructive} />
          </TouchableOpacity>
        </View>

        {/* Expanded detail */}
        {isExpanded && (
          <View style={s.expandedDetail}>
            {todo.description && <Text style={s.expandedDesc}>{todo.description}</Text>}
            <View style={s.expandedRow}>
              {todo.deadline && (
                <View style={s.expandedChip}>
                  <Text style={[s.expandedChipText, isOverdue && { color: Colors.destructive }]}>
                    {isOverdue ? '⚠️ ' : '📅 '}
                    {new Date(todo.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
              )}
              {todo.location && (
                <View style={s.expandedChip}>
                  <Text style={s.expandedChipText}>📍 {todo.location}</Text>
                </View>
              )}
            </View>
            {isGroup && (
              <View style={s.groupStatusList}>
                {group!.map((gt) => {
                  const m = getMember(gt.assigned_to);
                  const c = getMemberColor(gt.assigned_to);
                  const isDoneForMember = gt.status === 'done';
                  return (
                    <View key={gt.id} style={s.groupStatusRow}>
                      <View style={[s.groupStatusAvatar, { backgroundColor: c + '25', borderColor: c }]}>
                        <Text style={{ fontSize: 11 }}>{getMemberEmoji(m)}</Text>
                      </View>
                      <Text style={[s.groupStatusName, isDoneForMember && { textDecorationLine: 'line-through', opacity: 0.5 }]}>
                        {m?.display_name.split(' ')[0] || 'Unknown'}
                      </Text>
                      <Text style={[s.groupStatusBadge, { color: isDoneForMember ? Colors.success : Colors.muted }]}>
                        {isDoneForMember ? '✓ Done' : '• Open'}
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

  return (
    <View style={s.container}>
      {/* Fixed top section */}
      <View style={s.topSection}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.foreground} />
          </TouchableOpacity>
          <Text style={s.title}>Todos</Text>
          <PulsingHex
            onPress={() => setLabelFilter((prev) => prev === 'all' ? 'personal' : prev === 'personal' ? 'work' : 'all')}
            bg={labelFilter === 'all' ? Colors.primaryDark : labelFilter === 'personal' ? '#9b59b6' : '#3498db'}
            label={labelFilter === 'all' ? 'All' : labelFilter === 'personal' ? 'P' : 'W'}
          />
          <View style={s.headerRight}>
            <Text style={s.remainingNum}>{remaining}</Text>
            <Text style={s.remainingLabel}>of {total} left</Text>
          </View>
        </View>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.filterScroll}
        contentContainerStyle={s.filterRow}>
        {members.map((m) => (
          <TouchableOpacity
            key={m}
            onPress={() => setFilter(m)}
            style={[s.filterPill, filter === m && s.filterPillActive]}>
            <Text style={[s.filterText, filter === m && s.filterTextActive]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Add todo */}
      {!showAdd ? (
        <View style={s.addRow}>
          <TextInput
            value={newTodoText}
            onChangeText={setNewTodoText}
            onFocus={() => setShowAdd(true)}
            placeholder="Add a new todo..."
            placeholderTextColor={Colors.muted}
            style={s.addInput}
          />
          <TouchableOpacity onPress={() => setShowAdd(true)} activeOpacity={0.8}>
            <HexIcon size={40} bg={Colors.primary}>
              <Plus size={16} color={Colors.background} />
            </HexIcon>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.addForm}>
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <TextInput
              value={newTodoText}
              onChangeText={(t) => { setNewTodoText(t); if (t.trim()) setTitleError(false); }}
              placeholder="What needs to be done?"
              placeholderTextColor={titleError ? Colors.destructive : Colors.muted}
              style={[s.addFormTitle, titleError && { borderWidth: 1, borderColor: Colors.destructive }]}
              autoFocus
            />
          </Animated.View>

          {/* Priority */}
          <View style={s.addFormRow}>
            <Text style={s.addFormLabel}>Priority</Text>
            <View style={s.addFormChips}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => setNewPriority(p.value)}
                  style={[s.chip, newPriority === p.value && { backgroundColor: p.color + '25', borderColor: p.color }]}>
                  <View style={[s.chipDot, { backgroundColor: p.color }]} />
                  <Text style={[s.chipText, newPriority === p.value && { color: p.color }]}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Label */}
          <View style={s.addFormRow}>
            <Text style={s.addFormLabel}>Label</Text>
            <View style={s.addFormChips}>
              {(['personal', 'work'] as const).map((l) => (
                <TouchableOpacity key={l} onPress={() => setNewLabel(l)}
                  style={[s.chip, newLabel === l && { backgroundColor: l === 'personal' ? '#9b59b620' : '#3498db20', borderColor: l === 'personal' ? '#9b59b6' : '#3498db' }]}>
                  <Text style={[s.chipText, newLabel === l && { color: l === 'personal' ? '#9b59b6' : '#3498db' }]}>{l.charAt(0).toUpperCase() + l.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Deadline */}
          <View style={s.addFormRow}>
            <Text style={s.addFormLabel}>Deadline</Text>
            <DatePickerField value={newDeadlineDate} onChange={setNewDeadlineDate} />
          </View>

          {/* Location */}
          <View style={s.addFormRow}>
            <Text style={s.addFormLabel}>Location (optional)</Text>
            <TextInput
              value={newLocation}
              onChangeText={setNewLocation}
              placeholder="e.g., Office, Home, Mall..."
              placeholderTextColor={Colors.muted}
              style={s.addFormTitle}
            />
          </View>

          {/* Assignees — multi-select */}
          <View style={s.addFormRow}>
            <Text style={s.addFormLabel}>Assign to (tap to toggle)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={s.addFormChips}>
              {familyMembers.map((m) => {
                const color = getMemberColor(m.id);
                const selected = newAssignees.includes(m.id);
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => {
                      setNewAssignees((prev) =>
                        prev.includes(m.id) ? prev.filter((id) => id !== m.id) : [...prev, m.id]
                      );
                    }}
                    style={[s.assignChip, selected && { backgroundColor: color + '20', borderColor: color }]}>
                    <Text style={{ fontSize: 12 }}>{getMemberEmoji(m)}</Text>
                    <Text style={[s.chipText, selected && { color }]}>{m.display_name.split(' ')[0]}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Actions */}
          <View style={s.addFormActions}>
            <TouchableOpacity onPress={() => setShowAdd(false)} style={s.cancelBtn}>
              <Text style={s.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.submitBtn} onPress={handleAdd} activeOpacity={0.8}>
              <Text style={s.submitText}>Add Todo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      </View>

      {/* Todo list */}
      <ScrollView style={s.todoList} contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
        {/* Overdue */}
        {overdueTodos.length > 0 && (() => {
          const collapsed = collapsedSections.has('overdue');
          return (
            <>
              <TouchableOpacity onPress={() => toggleSection('overdue')} style={s.sectionHeader}>
                {collapsed ? <ChevronRight size={14} color={Colors.destructive} /> : <ChevronDown size={14} color={Colors.destructive} />}
                <Text style={[s.groupLabel, { color: Colors.destructive, marginTop: 0, marginBottom: 0 }]}>Overdue ({overdueTodos.length})</Text>
              </TouchableOpacity>
              {!collapsed && (filter === 'All' ? buildGroups(overdueTodos) : overdueTodos.map((t) => ({ key: t.id, primary: t, members: [t] }))).map(({ key, primary, members }) => (
                <React.Fragment key={key}>{renderTodoItem(primary, members)}</React.Fragment>
              ))}
            </>
          );
        })()}

        {/* Grouped by deadline */}
        {deadlineGroups.map((group) => {
          const sectionKey = `deadline-${group.date}`;
          const collapsed = collapsedSections.has(sectionKey);
          return (
            <View key={group.date}>
              <TouchableOpacity onPress={() => toggleSection(sectionKey)} style={s.sectionHeader}>
                {collapsed ? <ChevronRight size={14} color={Colors.muted} /> : <ChevronDown size={14} color={Colors.muted} />}
                <Text style={[s.groupLabel, { marginTop: 0, marginBottom: 0 }]}>{group.label} ({group.todos.length})</Text>
              </TouchableOpacity>
              {!collapsed && (filter === 'All' ? buildGroups(group.todos) : group.todos.map((t) => ({ key: t.id, primary: t, members: [t] }))).map(({ key, primary, members }) => (
                <React.Fragment key={key}>{renderTodoItem(primary, members)}</React.Fragment>
              ))}
            </View>
          );
        })}

        {/* No deadline */}
        {noDeadlineTodos.length > 0 && (() => {
          const collapsed = collapsedSections.has('no-deadline');
          return (
            <>
              <TouchableOpacity onPress={() => toggleSection('no-deadline')} style={s.sectionHeader}>
                {collapsed ? <ChevronRight size={14} color={Colors.muted} /> : <ChevronDown size={14} color={Colors.muted} />}
                <Text style={[s.groupLabel, { marginTop: 0, marginBottom: 0 }]}>No deadline ({noDeadlineTodos.length})</Text>
              </TouchableOpacity>
              {!collapsed && (filter === 'All' ? buildGroups(noDeadlineTodos) : noDeadlineTodos.map((t) => ({ key: t.id, primary: t, members: [t] }))).map(({ key, primary, members }) => (
                <React.Fragment key={key}>{renderTodoItem(primary, members)}</React.Fragment>
              ))}
            </>
          );
        })()}

        {/* Completed */}
        {doneTodos.length > 0 && (() => {
          const collapsed = collapsedSections.has('completed');
          return (
            <>
              <TouchableOpacity onPress={() => toggleSection('completed')} style={s.sectionHeader}>
                {collapsed ? <ChevronRight size={14} color={Colors.muted} /> : <ChevronDown size={14} color={Colors.muted} />}
                <Text style={[s.groupLabel, { marginTop: 0, marginBottom: 0 }]}>Completed ({doneTodos.length})</Text>
              </TouchableOpacity>
              {!collapsed && doneTodos.map((todo) => (
                <View key={todo.id} style={[s.todoCard, { opacity: 0.4 }]}>
                  <View style={s.todoTopRow}>
                    <TouchableOpacity style={s.checkboxDone} onPress={() => handleToggle(todo.id)}>
                      <Check size={12} color={Colors.background} />
                    </TouchableOpacity>
                    <View style={s.todoText}>
                      <Text style={[s.todoTitle, s.todoTitleDone]} numberOfLines={1}>{todo.title}</Text>
                      <Text style={s.todoAssignee}>{getMember(todo.assigned_to)?.display_name.split(' ')[0] || 'Unknown'}</Text>
                    </View>
                    <TouchableOpacity style={s.deleteBtn} onPress={() => confirm('Delete', `Delete "${todo.title}"?`, () => deleteTodo(todo.id), true)}>
                      <Trash2 size={14} color={Colors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          );
        })()}

        {activeTodos.length === 0 && doneTodos.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyText}>No todos yet. Add one above!</Text>
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
  filterScroll: { flexGrow: 0, flexShrink: 0 },
  filterRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 8, alignItems: 'center' },
  labelHexText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.surface },
  filterPillActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.muted },
  filterTextActive: { color: Colors.background },
  addRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginTop: 4, marginBottom: 12, flexShrink: 0 },
  addInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Colors.foreground, borderWidth: 1, borderColor: Colors.border },
  addBtn: { backgroundColor: Colors.primary, padding: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addForm: { marginHorizontal: 16, marginTop: 4, marginBottom: 12, backgroundColor: Colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: Colors.primaryBorder, gap: 10, flexShrink: 0 },
  addFormTitle: { backgroundColor: Colors.surfaceLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.foreground },
  addFormRow: { gap: 6 },
  addFormLabel: { fontSize: 10, fontWeight: '600', color: Colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  addFormChips: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 11, fontWeight: '600', color: Colors.muted },
  assignChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
  addFormActions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  cancelBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.surfaceLight },
  cancelText: { fontSize: 13, fontWeight: '600', color: Colors.muted },
  submitBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: Colors.primary },
  submitText: { fontSize: 13, fontWeight: '600', color: Colors.background },
  todoList: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 8 },
  todoCard: { backgroundColor: Colors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  todoTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: Colors.muted, alignItems: 'center', justifyContent: 'center' },
  checkboxInner: {},
  checkboxDone: { width: 20, height: 20, borderRadius: 6, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  todoEmoji: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  todoText: { flex: 1 },
  todoTitle: { fontSize: 14, color: Colors.foreground },
  todoTitleDone: { textDecorationLine: 'line-through' },
  todoMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  todoAssignee: { fontSize: 10, color: Colors.muted },
  priorityBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  priorityText: { fontSize: 9, fontWeight: '700' },
  labelBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  labelText: { fontSize: 9 },
  todoDueDate: { fontSize: 10, color: Colors.muted },
  expandedDetail: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8 },
  expandedDesc: { fontSize: 13, color: Colors.muted, lineHeight: 18 },
  expandedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  expandedChip: { backgroundColor: Colors.surfaceLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  stackedAvatar: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  groupStatusList: { marginTop: 8, gap: 6 },
  groupStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  groupStatusAvatar: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  groupStatusName: { flex: 1, fontSize: 13, color: Colors.foreground },
  groupStatusBadge: { fontSize: 11, fontWeight: '600' },
  expandedChipText: { fontSize: 11, color: Colors.muted },
  nudgeBtn: { padding: 8, borderRadius: 10, backgroundColor: Colors.successBg },
  editBtn: { padding: 8, borderRadius: 10, backgroundColor: Colors.primaryBg },
  editForm: { backgroundColor: Colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: Colors.primaryBorder, gap: 10, marginBottom: 6 },
  deleteBtn: { padding: 8, borderRadius: 10, backgroundColor: Colors.destructiveBg },
  groupLabel: { fontSize: 12, fontWeight: '700', color: Colors.muted, marginTop: 12, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, marginBottom: 6, paddingVertical: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: Colors.muted },
});
