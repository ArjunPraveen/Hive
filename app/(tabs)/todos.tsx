import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Linking,
} from 'react-native';
import { ArrowLeft, Plus, Check, MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';

import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { showAlert } from '@/lib/alert';

export default function TodosScreen() {
  const { user, familyMembers } = useAuth();
  const { todos, toggleTodoStatus, addTodo } = useData();
  const [filter, setFilter] = useState('All');
  const [newTodoText, setNewTodoText] = useState('');

  const members = ['All', ...familyMembers.map((m) => m.display_name)];
  const getMember = (id: string) => familyMembers.find((m) => m.id === id);
  const getMemberEmoji = (m: any) => m?.role_label === 'Mom' ? '👩' : m?.role_label === 'Dad' ? '👨' : m?.role_label === 'Son' ? '🧑' : m?.role_label === 'Daughter' ? '👧' : '😊';
  const getMemberColor = (id: string) => {
    const idx = familyMembers.findIndex((m) => m.id === id);
    return Colors.memberColors[idx % Colors.memberColors.length] || Colors.primary;
  };

  const filteredTodos = filter === 'All'
    ? todos
    : todos.filter((t) => getMember(t.assigned_to)?.display_name === filter);

  const activeTodos = filteredTodos.filter((t) => t.status !== 'done');
  const doneTodos = filteredTodos.filter((t) => t.status === 'done');
  const remaining = todos.filter((t) => t.status !== 'done').length;
  const total = todos.length;
  const progress = total > 0 ? ((total - remaining) / total) * 100 : 0;

  const handleAdd = async () => {
    if (!newTodoText.trim() || !user) return;
    await addTodo({
      title: newTodoText.trim(),
      description: null,
      deadline: null,
      priority: 2,
      status: 'open',
      created_by: user.id,
      assigned_to: user.id,
    });
    setNewTodoText('');
  };

  const handleNudge = (todoId: string) => {
    const todo = todos.find((t) => t.id === todoId);
    if (!todo) return;
    const assignee = getMember(todo.assigned_to);
    if (!assignee?.phone) {
      showAlert('No phone number', `${assignee?.display_name || 'This person'} hasn't set their phone number yet.`);
      return;
    }
    const msg = encodeURIComponent(`Hey ${assignee.display_name}! Don't forget: "${todo.title}" 🐝`);
    Linking.openURL(`https://wa.me/${assignee.phone.replace(/[^0-9]/g, '')}?text=${msg}`);
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.foreground} />
          </TouchableOpacity>
          <Text style={s.title}>Todos</Text>
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
      <View style={s.addRow}>
        <TextInput
          value={newTodoText}
          onChangeText={setNewTodoText}
          onSubmitEditing={handleAdd}
          placeholder="Add a new todo..."
          placeholderTextColor={Colors.muted}
          style={s.addInput}
          returnKeyType="done"
        />
        <TouchableOpacity style={s.addBtn} onPress={handleAdd} activeOpacity={0.8}>
          <Plus size={18} color={Colors.background} />
        </TouchableOpacity>
      </View>

      {/* Todo list */}
      <ScrollView contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
        {activeTodos.map((todo) => {
          const member = getMember(todo.assigned_to);
          const color = getMemberColor(todo.assigned_to);
          return (
            <View key={todo.id} style={s.todoCard}>
              <TouchableOpacity style={s.checkbox} onPress={() => toggleTodoStatus(todo.id)}>
                <View style={s.checkboxInner} />
              </TouchableOpacity>
              <View style={[s.todoEmoji, { backgroundColor: color + '25' }]}>
                <Text style={{ fontSize: 12 }}>{getMemberEmoji(member)}</Text>
              </View>
              <View style={s.todoText}>
                <Text style={s.todoTitle} numberOfLines={1}>{todo.title}</Text>
                <Text style={s.todoAssignee}>{member?.display_name || 'Unknown'}</Text>
              </View>
              {todo.assigned_to !== user?.id && (
                <TouchableOpacity style={s.nudgeBtn} onPress={() => handleNudge(todo.id)}>
                  <MessageCircle size={15} color="#25D366" />
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {doneTodos.length > 0 && (
          <>
            <Text style={s.doneLabel}>Completed ({doneTodos.length})</Text>
            {doneTodos.map((todo) => (
              <View key={todo.id} style={[s.todoCard, { opacity: 0.4 }]}>
                <TouchableOpacity style={s.checkboxDone} onPress={() => toggleTodoStatus(todo.id)}>
                  <Check size={12} color={Colors.background} />
                </TouchableOpacity>
                <View style={s.todoText}>
                  <Text style={[s.todoTitle, s.todoTitleDone]} numberOfLines={1}>{todo.title}</Text>
                  <Text style={s.todoAssignee}>{getMember(todo.assigned_to)?.display_name || 'Unknown'}</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.foreground },
  headerRight: { alignItems: 'flex-end' },
  remainingNum: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  remainingLabel: { fontSize: 10, color: Colors.muted, marginTop: -2 },
  progressBar: { height: 6, backgroundColor: Colors.surface, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  filterScroll: { flexGrow: 0 },
  filterRow: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 8, alignItems: 'center' },
  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.surface },
  filterPillActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.muted },
  filterTextActive: { color: Colors.background },
  addRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginTop: 4, marginBottom: 12 },
  addInput: { flex: 1, backgroundColor: Colors.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: Colors.foreground, borderWidth: 1, borderColor: Colors.border },
  addBtn: { backgroundColor: Colors.primary, padding: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100, gap: 8 },
  todoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: Colors.muted, alignItems: 'center', justifyContent: 'center' },
  checkboxInner: {},
  checkboxDone: { width: 20, height: 20, borderRadius: 6, backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  todoEmoji: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  todoText: { flex: 1 },
  todoTitle: { fontSize: 14, color: Colors.foreground },
  todoTitleDone: { textDecorationLine: 'line-through' },
  todoAssignee: { fontSize: 10, color: Colors.muted, marginTop: 1 },
  nudgeBtn: { padding: 8, borderRadius: 10, backgroundColor: Colors.successBg },
  doneLabel: { fontSize: 11, color: Colors.muted, marginTop: 8, marginBottom: 4 },
});
