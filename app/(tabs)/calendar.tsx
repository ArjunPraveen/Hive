import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { FAB } from '@/components/ui/FAB';
import { AddEventModal } from '@/components/AddEventModal';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarScreen() {
  const colors = useThemeColors();
  const { familyMembers } = useAuth();
  const { events } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);

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

  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    events.forEach((e) => {
      const d = new Date(e.event_date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        dates.add(d.getDate().toString());
      }
    });
    return dates;
  }, [events, month, year]);

  const selectedDateEvents = useMemo(() => {
    return events
      .filter((e) => {
        const d = new Date(e.event_date);
        return (
          d.getDate() === selectedDate.getDate() &&
          d.getMonth() === selectedDate.getMonth() &&
          d.getFullYear() === selectedDate.getFullYear()
        );
      })
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }, [events, selectedDate]);

  const navigateMonth = (dir: number) => {
    setCurrentMonth(new Date(year, month + dir, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Month Header */}
      <View style={[styles.monthHeader, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navBtn}>
          <FontAwesome name="chevron-left" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: colors.text }]}>{monthName}</Text>
        <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navBtn}>
          <FontAwesome name="chevron-right" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Weekday Headers */}
      <View style={[styles.weekdayRow, { backgroundColor: colors.surface }]}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={[styles.weekdayText, { color: colors.textTertiary }]}>
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={[styles.calendarGrid, { backgroundColor: colors.surface }]}>
        {calendarDays.map((day, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.dayCell,
              isSelected(day || 0) && { backgroundColor: colors.primary },
              isToday(day || 0) && !isSelected(day || 0) && { backgroundColor: colors.primaryLight },
            ]}
            onPress={() => day && setSelectedDate(new Date(year, month, day))}
            disabled={!day}>
            {day && (
              <>
                <Text
                  style={[
                    styles.dayText,
                    { color: isSelected(day) ? '#FFFFFF' : colors.text },
                    isToday(day) && !isSelected(day) && { color: colors.primaryDark },
                  ]}>
                  {day}
                </Text>
                {eventDates.has(day.toString()) && (
                  <View
                    style={[
                      styles.eventDot,
                      { backgroundColor: isSelected(day) ? '#FFFFFF' : colors.primary },
                    ]}
                  />
                )}
              </>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Events for selected date */}
      <View style={styles.eventsSection}>
        <Text style={[styles.eventsSectionTitle, { color: colors.text }]}>
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.eventsList}>
          {selectedDateEvents.length === 0 ? (
            <Card>
              <Text style={[styles.noEvents, { color: colors.textTertiary }]}>
                No events on this day
              </Text>
            </Card>
          ) : (
            selectedDateEvents.map((event) => {
              const creator = familyMembers.find((m) => m.id === event.created_by);
              return (
                <Card key={event.id} style={styles.eventCard}>
                  <View style={styles.eventRow}>
                    <View style={[styles.eventTimeLine, { backgroundColor: colors.primary }]} />
                    <View style={styles.eventContent}>
                      <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
                      <Text style={[styles.eventTime, { color: colors.textSecondary }]}>
                        {formatTime(event.event_date)}
                      </Text>
                      {event.description && (
                        <Text style={[styles.eventDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                          {event.description}
                        </Text>
                      )}
                      <View style={styles.eventFooter}>
                        {event.location && (
                          <View style={styles.locationRow}>
                            <FontAwesome name="map-marker" size={12} color={colors.textTertiary} />
                            <Text style={[styles.locationText, { color: colors.textTertiary }]}>
                              {event.location}
                            </Text>
                          </View>
                        )}
                        {creator && (
                          <View style={styles.creatorRow}>
                            <Avatar name={creator.display_name} size={18} />
                            <Text style={[styles.creatorName, { color: colors.textTertiary }]}>
                              {creator.display_name}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      </View>

      <FAB onPress={() => setShowAddModal(true)} icon="plus" />

      <AddEventModal visible={showAddModal} onClose={() => setShowAddModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  navBtn: { padding: 8 },
  monthTitle: { fontSize: 18, fontWeight: '700' },
  weekdayRow: { flexDirection: 'row', paddingHorizontal: 8, paddingBottom: 8 },
  weekdayText: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, paddingBottom: 12 },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  dayText: { fontSize: 14, fontWeight: '500' },
  eventDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 2 },
  eventsSection: { flex: 1, padding: 16 },
  eventsSectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  eventsList: { paddingBottom: 80 },
  eventCard: { marginBottom: 10, paddingLeft: 0 },
  eventRow: { flexDirection: 'row' },
  eventTimeLine: { width: 3, borderRadius: 2, marginRight: 12 },
  eventContent: { flex: 1, paddingVertical: 2 },
  eventTitle: { fontSize: 15, fontWeight: '600' },
  eventTime: { fontSize: 13, marginTop: 2 },
  eventDesc: { fontSize: 13, marginTop: 4 },
  eventFooter: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  creatorName: { fontSize: 12 },
  noEvents: { textAlign: 'center', fontSize: 14 },
});
