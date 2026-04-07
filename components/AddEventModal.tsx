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

import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AddEventModal({ visible, onClose }: Props) {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { addEvent } = useData();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [daysFromNow, setDaysFromNow] = useState(0);

  const dateOptions = [
    { days: 0, label: 'Today' },
    { days: 1, label: 'Tomorrow' },
    { days: 3, label: 'In 3 days' },
    { days: 7, label: 'In a week' },
  ];

  const handleSubmit = () => {
    if (!title.trim()) return;
    addEvent({
      title: title.trim(),
      description: description.trim() || null,
      event_date: new Date(Date.now() + daysFromNow * 86400000).toISOString(),
      location: location.trim() || null,
      created_by: user?.id || 'user-1',
    });
    setTitle('');
    setDescription('');
    setLocation('');
    setDaysFromNow(0);
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
            <Text style={[styles.sheetTitle, { color: colors.text }]}>New Event</Text>
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
            <TextInput
              style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }]}
              placeholder="Event title"
              placeholderTextColor={colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              autoFocus
            />

            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />

            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, minHeight: 44 }]}
              placeholder="Location (optional)"
              placeholderTextColor={colors.textTertiary}
              value={location}
              onChangeText={setLocation}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>When</Text>
            <View style={styles.optionRow}>
              {dateOptions.map((d) => (
                <TouchableOpacity
                  key={d.label}
                  onPress={() => setDaysFromNow(d.days)}
                  style={[
                    styles.optionPill,
                    {
                      backgroundColor: daysFromNow === d.days ? colors.primaryLight : colors.background,
                      borderColor: daysFromNow === d.days ? colors.primary : colors.border,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.optionText,
                      { color: daysFromNow === d.days ? colors.primaryDark : colors.textSecondary },
                    ]}>
                    {d.label}
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
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%', paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  cancelBtn: { fontSize: 15, fontWeight: '500' },
  sheetTitle: { fontSize: 17, fontWeight: '700' },
  saveBtn: { fontSize: 15, fontWeight: '700' },
  form: { padding: 16, paddingTop: 8 },
  titleInput: { fontSize: 18, fontWeight: '600', paddingVertical: 12, borderBottomWidth: 1, marginBottom: 16 },
  input: { fontSize: 14, padding: 12, borderRadius: 12, borderWidth: 1, minHeight: 60, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  optionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  optionPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  optionText: { fontSize: 13, fontWeight: '600' },
});
