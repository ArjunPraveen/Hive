// Supabase Edge Function: send-daily-digest
// Triggered by pg_cron daily at 01:30 UTC (07:00 IST).
// Queries each opted-in user's todos + habits and emails them via Resend.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';
import { buildDigestHtml, buildDigestPlainText, type DigestTodo, type DigestHabit } from './_template.ts';

// Inline the habit-schedule helpers (Deno can't import from project paths cleanly,
// so we duplicate the logic here. Keep in sync with C:\Project\Hive\lib\habitSchedule.ts).
type Habit = {
  id: string;
  family_id: string;
  title: string;
  category: string;
  frequency_type: 'daily' | 'weekly' | 'custom';
  frequency_count: number;
  custom_days: number[] | null;
};

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function todayKey(now: Date = new Date()): string {
  // Use local date components — avoids UTC/IST date mismatches
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function isScheduledToday(habit: Habit, userCheckinDates: string[], now: Date = new Date()): boolean {
  const today = todayKey(now);
  if (habit.frequency_type === 'daily') return !userCheckinDates.includes(today);
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

function frequencyLabel(habit: Habit): string {
  if (habit.frequency_type === 'daily') return 'Daily';
  if (habit.frequency_type === 'weekly') return `${habit.frequency_count}x/week`;
  if (habit.frequency_type === 'custom' && habit.custom_days) {
    return habit.custom_days.map((d: number) => DAY_LABELS[d]).join('·');
  }
  return '';
}

// ---- Main handler ----

Deno.serve(async (_req: Request) => {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const GMAIL_USER = Deno.env.get('GMAIL_USER');
  const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD');
  const SENDER_NAME = Deno.env.get('SENDER_NAME') || 'Hive';

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    return new Response(JSON.stringify({ error: 'GMAIL_USER and GMAIL_APP_PASSWORD must be set' }), { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Gmail SMTP client (TLS, port 465)
  const smtp = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username: GMAIL_USER, password: GMAIL_APP_PASSWORD },
    },
  });

  // 1. Fetch opted-in users with a family + their auth.user email
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, display_name, family_id, email_digest_enabled')
    .eq('email_digest_enabled', true)
    .not('family_id', 'is', null);

  if (profErr) {
    return new Response(JSON.stringify({ error: profErr.message }), { status: 500 });
  }
  if (!profiles || profiles.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'No opted-in users' }), { status: 200 });
  }

  // Fetch families for names
  const familyIds = [...new Set(profiles.map((p: any) => p.family_id))];
  const { data: families } = await supabase.from('families').select('id, name').in('id', familyIds);
  const famNameById = new Map((families || []).map((f: any) => [f.id, f.name]));

  // Fetch auth.users for emails (via admin API)
  const { data: usersRes, error: usersErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (usersErr) {
    return new Response(JSON.stringify({ error: usersErr.message }), { status: 500 });
  }
  const emailById = new Map(usersRes.users.map((u: any) => [u.id, u.email]));

  // Date ranges
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const next3Days = new Date(todayStart);
  next3Days.setDate(next3Days.getDate() + 4); // exclusive

  const results: { user: string; status: 'sent' | 'skipped' | 'error'; reason?: string }[] = [];

  for (const profile of profiles as any[]) {
    const email = emailById.get(profile.id);
    if (!email) {
      results.push({ user: profile.id, status: 'skipped', reason: 'no email' });
      continue;
    }

    // 2a. Fetch user's open todos
    const { data: todos } = await supabase
      .from('todos')
      .select('id, title, priority, deadline, location, label, status')
      .eq('assigned_to', profile.id)
      .neq('status', 'done');

    const overdue: DigestTodo[] = [];
    const today: DigestTodo[] = [];
    const upcoming: DigestTodo[] = [];

    (todos || []).forEach((t: any) => {
      if (!t.deadline) return; // no-deadline todos skipped from email
      const d = new Date(t.deadline);
      const dt: DigestTodo = {
        id: t.id,
        title: t.title,
        priority: t.priority,
        deadline: t.deadline,
        location: t.location,
        label: t.label,
      };
      if (d < todayStart) overdue.push(dt);
      else if (d < todayEnd) today.push(dt);
      else if (d < next3Days) upcoming.push(dt);
    });

    // Sort by priority within each bucket
    [overdue, today, upcoming].forEach((arr) => arr.sort((a, b) => a.priority - b.priority));

    // 2b. Fetch user's habits + checkins
    const { data: assignees } = await supabase
      .from('habit_assignees')
      .select('habit_id')
      .eq('user_id', profile.id);
    const habitIds = (assignees || []).map((a: any) => a.habit_id);

    const habitsToday: DigestHabit[] = [];
    if (habitIds.length > 0) {
      const { data: habits } = await supabase.from('habits').select('*').in('id', habitIds);
      const { data: checkins } = await supabase
        .from('habit_checkins')
        .select('habit_id, checked_date')
        .eq('user_id', profile.id);
      const checkinsByHabit = new Map<string, string[]>();
      (checkins || []).forEach((c: any) => {
        const arr = checkinsByHabit.get(c.habit_id) || [];
        arr.push(c.checked_date);
        checkinsByHabit.set(c.habit_id, arr);
      });

      (habits || []).forEach((h: any) => {
        const userDates = checkinsByHabit.get(h.id) || [];
        if (isScheduledToday(h, userDates, now)) {
          habitsToday.push({
            id: h.id,
            title: h.title,
            category: h.category,
            frequencyLabel: frequencyLabel(h),
          });
        }
      });
    }

    // 3. Skip empty digests
    if (overdue.length === 0 && today.length === 0 && upcoming.length === 0 && habitsToday.length === 0) {
      results.push({ user: profile.id, status: 'skipped', reason: 'empty' });
      continue;
    }

    // 4. Build + send
    const payload = {
      userName: profile.display_name || 'there',
      familyName: famNameById.get(profile.family_id) || 'Hive',
      overdue,
      today,
      upcoming,
      habits: habitsToday,
    };
    // Minify HTML to avoid quoted-printable encoding artifacts (=20 etc.)
    const html = buildDigestHtml(payload).replace(/\n\s+/g, '').replace(/>\s+</g, '><');
    const text = buildDigestPlainText(payload);

    const subjectParts: string[] = [];
    if (overdue.length) subjectParts.push(`${overdue.length} overdue`);
    if (today.length) subjectParts.push(`${today.length} today`);
    if (habitsToday.length) subjectParts.push(`${habitsToday.length} habits`);
    const subject = `🐝 Hive: ${subjectParts.join(' · ') || 'your daily digest'}`;

    try {
      await smtp.send({
        from: `${SENDER_NAME} <${GMAIL_USER}>`,
        to: email,
        subject,
        html,
        content: text, // explicit plain-text fallback
      });
      results.push({ user: profile.id, status: 'sent' });
    } catch (e: any) {
      results.push({ user: profile.id, status: 'error', reason: String(e?.message || e) });
    }
  }

  await smtp.close();

  const sent = results.filter((r) => r.status === 'sent').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const errors = results.filter((r) => r.status === 'error').length;

  return new Response(
    JSON.stringify({ sent, skipped, errors, results }, null, 2),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
