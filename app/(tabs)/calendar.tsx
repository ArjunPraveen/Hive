import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { ArrowLeft, Plus, X, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

import Colors from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function EventsScreen() {
  const { user, familyMembers } = useAuth();
  const { events, addEvent } = useData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [year, month, firstDay, daysInMonth]);

  const getEventsOnDay = (day: number) => events.filter((e) => {
    const d = new Date(e.event_date);
    return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
  });

  const selectedDayEvents = useMemo(() => {
    return events.filter((e) => {
      const d = new Date(e.event_date);
      return d.getDate() === selectedDate.getDate() && d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    });
  }, [events, selectedDate]);

  const isToday = (day: number) => {
    const t = new Date();
    return day === t.getDate() && month === t.getMonth() && year === t.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
  };

  const upcomingCount = events.filter((e) => new Date(e.event_date) >= new Date()).length;
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const selectedDateStr = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const handleAddEvent = async () => {
    if (!newTitle.trim() || !user) return;
    await addEvent({
      title: newTitle.trim(),
      description: newTime ? `Time: ${newTime}` : null,
      event_date: selectedDate.toISOString(),
      location: newLocation.trim() || null,
      created_by: user.id,
    });
    setNewTitle(''); setNewTime(''); setNewLocation('');
    setShowAdd(false);
  };

  const getMemberColor = (createdBy: string) => {
    const idx = familyMembers.findIndex((m) => m.id === createdBy);
    return Colors.memberColors[idx % Colors.memberColors.length] || Colors.primary;
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.foreground} />
          </TouchableOpacity>
          <Text style={s.title}>Events</Text>
          <View style={s.headerRight}>
            <Text style={s.upcomingNum}>{upcomingCount}</Text>
            <Text style={s.upcomingLabel}>upcoming</Text>
          </View>
        </View>
      </View>

      {/* Calendar */}
      <View style={s.calendarCard}>
        <View style={s.monthNav}>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month - 1, 1))}>
            <ChevronLeft size={18} color={Colors.muted} />
          </TouchableOpacity>
          <Text style={s.monthTitle}>{monthName}</Text>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(year, month + 1, 1))}>
            <ChevronRight size={18} color={Colors.muted} />
          </TouchableOpacity>
        </View>

        <View style={s.weekdayRow}>
          {WEEKDAYS.map((d) => (
            <Text key={d} style={s.weekdayText}>{d}</Text>
          ))}
        </View>

        <View style={s.daysGrid}>
          {calendarDays.map((day, i) => {
            const dayEvents = day ? getEventsOnDay(day) : [];
            return (
              <TouchableOpacity
                key={i}
                style={[
                  s.dayCell,
                  day && isSelected(day) && { backgroundColor: Colors.primary },
                  day && isToday(day) && !isSelected(day) && { backgroundColor: Colors.primaryBg },
                ]}
                onPress={() => day && setSelectedDate(new Date(year, month, day))}
                disabled={!day}>
                {day && (
                  <>
                    <Text style={[
                      s.dayText,
                      isSelected(day) && { color: Colors.background },
                      isToday(day) && !isSelected(day) && { color: Colors.primary },
                    ]}>{day}</Text>
                    {dayEvents.length > 0 && (
                      <View style={s.dotRow}>
                        {dayEvents.slice(0, 3).map((e) => (
                          <View
                            key={e.id}
                            style={[s.eventDot, {
                              backgroundColor: isSelected(day) ? Colors.background : getMemberColor(e.created_by)
                            }]}
                          />
                        ))}
                      </View>
                    )}
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Selected date events */}
      <View style={s.eventsSection}>
        <View style={s.eventsSectionHeader}>
          <Text style={s.eventsDateTitle}>{selectedDateStr}</Text>
          <TouchableOpacity
            style={s.addEventBtn}
            onPress={() => setShowAdd(!showAdd)}
            activeOpacity={0.8}>
            {showAdd ? <X size={16} color={Colors.background} /> : <Plus size={16} color={Colors.background} />}
          </TouchableOpacity>
        </View>

        {showAdd && (
          <View style={s.addForm}>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Event title"
              placeholderTextColor={Colors.muted}
              style={s.addFormInput}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput value={newTime} onChangeText={setNewTime} placeholder="Time" placeholderTextColor={Colors.muted} style={[s.addFormInput, { flex: 1 }]} />
              <TextInput value={newLocation} onChangeText={setNewLocation} placeholder="Location" placeholderTextColor={Colors.muted} style={[s.addFormInput, { flex: 1 }]} />
            </View>
            <TouchableOpacity style={s.addFormBtn} onPress={handleAddEvent}>
              <Text style={s.addFormBtnText}>Add Event</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedDayEvents.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>No events on this day</Text>
            <TouchableOpacity onPress={() => setShowAdd(true)}>
              <Text style={s.emptyAdd}>+ Add one</Text>
            </TouchableOpacity>
          </View>
        ) : (
          selectedDayEvents.map((event) => {
            const color = getMemberColor(event.created_by);
            const creator = familyMembers.find((m) => m.id === event.created_by);
            return (
              <View key={event.id} style={[s.eventCard, { borderLeftColor: color }]}>
                <Text style={s.eventTitle}>{event.title}</Text>
                <View style={s.eventMeta}>
                  {event.description && (
                    <View style={s.eventMetaItem}>
                      <Clock size={11} color={Colors.muted} />
                      <Text style={s.eventMetaText}>{event.description}</Text>
                    </View>
                  )}
                  {event.location && (
                    <View style={s.eventMetaItem}>
                      <MapPin size={11} color={Colors.muted} />
                      <Text style={s.eventMetaText}>{event.location}</Text>
                    </View>
                  )}
                </View>
                {creator && (
                  <View style={[s.eventBadge, { backgroundColor: color + '20' }]}>
                    <Text style={[s.eventBadgeText, { color }]}>{creator.display_name}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: 100, maxWidth: 500, alignSelf: 'center', width: '100%' },
  header: { paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.foreground },
  headerRight: { alignItems: 'flex-end' },
  upcomingNum: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  upcomingLabel: { fontSize: 10, color: Colors.muted, marginTop: -2 },
  calendarCard: { marginHorizontal: 16, marginTop: 8, backgroundColor: Colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: Colors.border },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  monthTitle: { fontSize: 14, fontWeight: '600', color: Colors.foreground },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekdayText: { flex: 1, textAlign: 'center', fontSize: 10, color: Colors.muted, fontWeight: '600' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', alignItems: 'center', paddingVertical: 6, borderRadius: 10 },
  dayText: { fontSize: 12, fontWeight: '500', color: Colors.foreground },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  eventDot: { width: 4, height: 4, borderRadius: 2 },
  eventsSection: { paddingHorizontal: 16, marginTop: 16 },
  eventsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  eventsDateTitle: { fontSize: 14, fontWeight: '600', color: Colors.foreground },
  addEventBtn: { backgroundColor: Colors.primary, padding: 6, borderRadius: 8 },
  addForm: { backgroundColor: Colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: Colors.primaryBorder, marginBottom: 12, gap: 8 },
  addFormInput: { backgroundColor: Colors.surfaceLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: Colors.foreground },
  addFormBtn: { backgroundColor: Colors.primary, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  addFormBtnText: { color: Colors.background, fontSize: 14, fontWeight: '600' },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.muted },
  emptyAdd: { fontSize: 14, color: Colors.primary, marginTop: 4 },
  eventCard: { backgroundColor: Colors.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 3, marginBottom: 8 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: Colors.foreground },
  eventMeta: { flexDirection: 'row', gap: 12, marginTop: 6 },
  eventMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventMetaText: { fontSize: 11, color: Colors.muted },
  eventBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 6 },
  eventBadgeText: { fontSize: 10, fontWeight: '600' },
});
