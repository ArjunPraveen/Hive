import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Avatar } from '@/components/ui/Avatar';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AddTodoModal({ visible, onClose }: Props) {
  const colors = useThemeColors();
  const { user, familyMembers } = useAuth();
  const { addTodo } = useData();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(2);
  const [assignedTo, setAssignedTo] = useState(user?.id || '');
  const [deadlineDays, setDeadlineDays] = useState<number | null>(null);

  const priorities = [
    { value: 0, label: 'P0', color: colors.p0 },
    { value: 1, label: 'P1', color: colors.p1 },
    { value: 2, label: 'P2', color: colors.p2 },
    { value: 3, label: 'P3', color: colors.p3 },
  ];

  const deadlineOptions = [
    { days: null, label: 'None' },
    { days: 1, label: '1 day' },
    { days: 3, label: '3 days' },
    { days: 7, label: '1 week' },
  ];

  const handleSubmit = () => {
    if (!title.trim()) return;
    addTodo({
      title: title.trim(),
      description: description.trim() || null,
      deadline: deadlineDays ? new Date(Date.now() + deadlineDays * 86400000).toISOString() : null,
      priority,
      status: 'open',
      created_by: user?.id || 'user-1',
      assigned_to: assignedTo || user?.id || 'user-1',
    });
    // Reset
    setTitle('');
    setDescription('');
    setPriority(2);
    setAssignedTo(user?.id || '');
    setDeadlineDays(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.cancelBtn, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.sheetTitle, { color: colors.text }]}>New Task</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={!title.trim()}>
              <Text
                style={[
                  styles.saveBtn,
                  { color: title.trim() ? colors.primary : colors.textTertiary },
                ]}>
                Add
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <TextInput
              style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }]}
              placeholder="What needs to be done?"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              autoFocus
              returnKeyType="next"
            />

            {/* Description */}
            <TextInput
              style={[styles.descInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="Add a description (optional)"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Priority */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Priority</Text>
            <View style={styles.optionRow}>
              {priorities.map((p) => (
                <TouchableOpacity
                  key={p.value}
                  onPress={() => setPriority(p.value)}
                  style={[
                    styles.optionPill,
                    {
                      backgroundColor: priority === p.value ? p.color + '20' : colors.background,
                      borderColor: priority === p.value ? p.color : colors.border,
                    },
                  ]}>
                  <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                  <Text
                    style={[
                      styles.optionText,
                      { color: priority === p.value ? p.color : colors.textSecondary },
                    ]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Deadline */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Deadline</Text>
            <View style={styles.optionRow}>
              {deadlineOptions.map((d) => (
                <TouchableOpacity
                  key={d.label}
                  onPress={() => setDeadlineDays(d.days)}
                  style={[
                    styles.optionPill,
                    {
                      backgroundColor: deadlineDays === d.days ? colors.primaryLight : colors.background,
                      borderColor: deadlineDays === d.days ? colors.primary : colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.optionText,
                      { color: deadlineDays === d.days ? colors.primaryDark : colors.textSecondary },
                    ]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Assign To */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Assign to</Text>
            <View style={styles.memberList}>
              {familyMembers.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setAssignedTo(m.id)}
                  style={[
                    styles.memberPill,
                    {
                      backgroundColor: assignedTo === m.id ? colors.primaryLight : colors.background,
                      borderColor: assignedTo === m.id ? colors.primary : colors.border,
                    },
                  ]}>
                  <Avatar name={m.display_name} size={24} />
                  <Text
                    style={[
                      styles.memberPillText,
                      { color: assignedTo === m.id ? colors.primaryDark : colors.textSecondary },
                    ]}>
                    {m.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  cancelBtn: { fontSize: 15, fontWeight: '500' },
  sheetTitle: { fontSize: 17, fontWeight: '700' },
  saveBtn: { fontSize: 15, fontWeight: '700' },
  form: { padding: 16, paddingTop: 8 },
  titleInput: { fontSize: 18, fontWeight: '600', paddingVertical: 12, borderBottomWidth: 1, marginBottom: 16 },
  descInput: { fontSize: 14, padding: 12, borderRadius: 12, borderWidth: 1, minHeight: 80, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  optionRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  optionPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 6 },
  optionText: { fontSize: 13, fontWeight: '600' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  memberList: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  memberPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 8 },
  memberPillText: { fontSize: 13, fontWeight: '600' },
});
