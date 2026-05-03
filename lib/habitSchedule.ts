// Shared utilities for habit scheduling — used by both client (habits.tsx)
// and the daily-digest edge function. Pure functions with no React/RN deps.

export type Habit = {
  id: string;
  family_id: string;
  title: string;
  category: string;
  frequency_type: 'daily' | 'weekly' | 'custom';
  frequency_count: number;
  custom_days: number[] | null;
  created_by: string;
  created_at: string;
};

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function todayKey(now: Date = new Date()): string {
  return now.toISOString().split('T')[0];
}

export function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday-start
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function isScheduledToday(
  habit: Habit,
  userCheckinDates: string[],
  now: Date = new Date()
): boolean {
  const today = todayKey(now);
  if (habit.frequency_type === 'daily') {
    return !userCheckinDates.includes(today);
  }
  if (habit.frequency_type === 'weekly') {
    const weekStart = startOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const inWeek = userCheckinDates.filter((d) => {
      const dd = new Date(d + 'T00:00:00');
      return dd >= weekStart && dd < weekEnd;
    }).length;
    return inWeek < habit.frequency_count;
  }
  if (habit.frequency_type === 'custom' && habit.custom_days) {
    const dow = now.getDay();
    return habit.custom_days.includes(dow) && !userCheckinDates.includes(today);
  }
  return false;
}

export function frequencyLabel(habit: Habit): string {
  if (habit.frequency_type === 'daily') return 'Daily';
  if (habit.frequency_type === 'weekly') return `${habit.frequency_count}x/week`;
  if (habit.frequency_type === 'custom' && habit.custom_days) {
    return habit.custom_days.map((d) => DAY_LABELS[d]).join('·');
  }
  return '';
}

export { DAY_LABELS };
