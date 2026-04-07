import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { FAB } from '@/components/ui/FAB';
import { AddTodoModal } from '@/components/AddTodoModal';

type FilterType = 'all' | 'mine' | 'open' | 'done';

export default function TodosScreen() {
  const colors = useThemeColors();
  const { user, familyMembers } = useAuth();
  const { todos, toggleTodoStatus, deleteTodo } = useData();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredTodos = todos.filter((t) => {
    switch (filter) {
      case 'mine': return t.assigned_to === user?.id;
      case 'open': return t.status !== 'done';
      case 'done': return t.status === 'done';
      default: return true;
    }
  });

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'mine', label: 'Mine' },
    { key: 'open', label: 'Open' },
    { key: 'done', label: 'Done' },
  ];

  const priorityLabel = (p: number) => ['P0', 'P1', 'P2', 'P3'][p] || 'P3';
  const priorityColor = (p: number) => [colors.p0, colors.p1, colors.p2, colors.p3][p] || colors.p3;

  const statusIcon = (status: string) => {
    if (status === 'done') return 'check-circle';
    if (status === 'in_progress') return 'clock-o';
    return 'circle-o';
  };

  const statusColor = (status: string) => {
    if (status === 'done') return colors.success;
    if (status === 'in_progress') return colors.warning;
    return colors.textTertiary;
  };

  const formatDeadline = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 0) return 'Overdue';
    if (hours < 24) return `${hours}h left`;
    return `${days}d left`;
  };

  const handleNudge = (todoId: string) => {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;
    const assignee = familyMembers.find((m) => m.id === todo.assigned_to);
    if (!assignee?.phone) {
      Alert.alert('No phone number', `${assignee?.display_name || 'This person'} hasn't set their phone number yet.`);
      return;
    }
    const message = encodeURIComponent(
      `Hey ${assignee.display_name}! Friendly nudge about your task: "${todo.title}" \ud83d\udc1d`
    );
    Linking.openURL(`https://wa.me/${assignee.phone.replace(/[^0-9]/g, '')}?text=${message}`);
  };

  const getMemberName = (id: string) => familyMembers.find((m) => m.id === id)?.display_name || 'Unknown';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterPill,
              {
                backgroundColor: filter === f.key ? colors.primary : colors.surface,
                borderColor: filter === f.key ? colors.primary : colors.border,
              },
            ]}>
            <Text
              style={[
                styles.filterText,
                { color: filter === f.key ? '#FFFFFF' : colors.textSecondary },
              ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Todo List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredTodos.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome name="check-circle" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              {filter === 'done' ? 'No completed tasks yet' : 'No tasks here!'}
            </Text>
          </View>
        ) : (
          filteredTodos.map((todo) => {
            const assignee = familyMembers.find((m) => m.id === todo.assigned_to);
            const isOverdue = todo.deadline && new Date(todo.deadline) < new Date() && todo.status !== 'done';

            return (
              <Card key={todo.id} style={[styles.todoCard, isOverdue && { borderLeftWidth: 3, borderLeftColor: colors.danger }]}>
                <View style={styles.todoHeader}>
                  <TouchableOpacity onPress={() => toggleTodoStatus(todo.id)} style={styles.checkBtn}>
                    <FontAwesome
                      name={statusIcon(todo.status)}
                      size={22}
                      color={statusColor(todo.status)}
                    />
                  </TouchableOpacity>
                  <View style={styles.todoContent}>
                    <Text
                      style={[
                        styles.todoTitle,
                        { color: colors.text },
                        todo.status === 'done' && styles.todoDone,
                      ]}>
                      {todo.title}
                    </Text>
                    {todo.description && (
                      <Text style={[styles.todoDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                        {todo.description}
                      </Text>
                    )}
                  </View>
                  <Badge
                    label={priorityLabel(todo.priority)}
                    color={priorityColor(todo.priority) + '20'}
                    textColor={priorityColor(todo.priority)}
                  />
                </View>

                <View style={styles.todoFooter}>
                  <View style={styles.todoMeta}>
                    {assignee && (
                      <View style={styles.assigneeRow}>
                        <Avatar name={assignee.display_name} size={20} />
                        <Text style={[styles.assigneeName, { color: colors.textSecondary }]}>
                          {assignee.display_name}
                        </Text>
                      </View>
                    )}
                    {todo.deadline && (
                      <Text
                        style={[
                          styles.deadline,
                          { color: isOverdue ? colors.danger : colors.textSecondary },
                        ]}>
                        {isOverdue ? '\u23f0 ' : '\ud83d\udcc5 '}
                        {formatDeadline(todo.deadline)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.actions}>
                    {todo.status !== 'done' && todo.assigned_to !== user?.id && (
                      <TouchableOpacity
                        onPress={() => handleNudge(todo.id)}
                        style={[styles.actionBtn, { backgroundColor: colors.success + '15' }]}>
                        <FontAwesome name="whatsapp" size={16} color={colors.success} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert('Delete Todo', 'Are you sure?', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deleteTodo(todo.id) },
                        ]);
                      }}
                      style={[styles.actionBtn, { backgroundColor: colors.danger + '15' }]}>
                      <FontAwesome name="trash-o" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      <FAB onPress={() => setShowAddModal(true)} />

      <AddTodoModal visible={showAddModal} onClose={() => setShowAddModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterScroll: { flexGrow: 0 },
  filterRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 13, fontWeight: '600' },
  listContent: { padding: 16, paddingTop: 0, paddingBottom: 100 },
  todoCard: { marginBottom: 10 },
  todoHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  checkBtn: { marginRight: 12, paddingTop: 2 },
  todoContent: { flex: 1, marginRight: 8 },
  todoTitle: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  todoDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  todoDesc: { fontSize: 13, marginTop: 2 },
  todoFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  todoMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  assigneeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  assigneeName: { fontSize: 12, fontWeight: '500' },
  deadline: { fontSize: 12, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 12 },
});
