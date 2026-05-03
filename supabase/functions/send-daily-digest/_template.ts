// HTML email template for the daily digest.
// Light theme — renders consistently in light + dark mode across email clients.

export type DigestTodo = {
  id: string;
  title: string;
  priority: number;
  deadline: string | null;
  location: string | null;
  label: 'personal' | 'work' | null;
};

export type DigestHabit = {
  id: string;
  title: string;
  category: string;
  frequencyLabel: string;
};

interface DigestPayload {
  userName: string;
  familyName: string;
  overdue: DigestTodo[];
  today: DigestTodo[];
  upcoming: DigestTodo[];
  habits: DigestHabit[];
}

const C = {
  bg: '#f5f3ef',
  card: '#ffffff',
  text: '#1c1917',
  muted: '#78716c',
  border: '#e7e5e4',
  primary: '#c47a1a',
  primaryBg: '#fef3c7',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  success: '#15803d',
  successBg: '#dcfce7',
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function priorityLabel(p: number): string {
  return ['P0', 'P1', 'P2', 'P3'][p] || `P${p}`;
}

function todoItem(t: DigestTodo, isOverdue = false): string {
  const meta: string[] = [];
  if (t.deadline) meta.push(formatDate(t.deadline));
  if (t.location) meta.push(escapeHtml(t.location));
  meta.push(priorityLabel(t.priority));

  return `
    <div style="padding:14px 16px;border-bottom:1px solid ${C.border};${isOverdue ? `border-left:3px solid ${C.danger};` : ''}">
      <div style="font-size:15px;color:${C.text};font-weight:500;margin:0;">${escapeHtml(t.title)}</div>
      <div style="font-size:12px;color:${C.muted};margin-top:4px;">${meta.join(' &middot; ')}</div>
    </div>
  `;
}

function habitItem(h: DigestHabit): string {
  return `
    <div style="padding:14px 16px;border-bottom:1px solid ${C.border};">
      <div style="font-size:15px;color:${C.text};font-weight:500;">${escapeHtml(h.title)}</div>
      <div style="font-size:12px;color:${C.muted};margin-top:4px;">${escapeHtml(h.frequencyLabel)}</div>
    </div>
  `;
}

function section(title: string, accent: string, itemsHtml: string): string {
  return `
    <div style="margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;color:${accent};letter-spacing:1.2px;text-transform:uppercase;padding:0 4px 8px;">${title}</div>
      <div style="background:${C.card};border:1px solid ${C.border};border-radius:12px;overflow:hidden;">
        ${itemsHtml}
      </div>
    </div>
  `;
}

export function buildDigestHtml(p: DigestPayload): string {
  const sections: string[] = [];

  if (p.habits.length) {
    sections.push(section(
      `Habits today (${p.habits.length})`,
      C.success,
      p.habits.map(habitItem).join('')
    ));
  }
  if (p.overdue.length) {
    sections.push(section(
      `Overdue (${p.overdue.length})`,
      C.danger,
      p.overdue.map((t) => todoItem(t, true)).join('')
    ));
  }
  if (p.today.length) {
    sections.push(section(
      `Due today (${p.today.length})`,
      C.primary,
      p.today.map((t) => todoItem(t)).join('')
    ));
  }
  if (p.upcoming.length) {
    sections.push(section(
      `Next 3 days (${p.upcoming.length})`,
      C.muted,
      p.upcoming.map((t) => todoItem(t)).join('')
    ));
  }

  const empty = sections.length === 0
    ? `<div style="padding:40px 16px;text-align:center;color:${C.muted};font-size:14px;background:${C.card};border:1px solid ${C.border};border-radius:12px;">All clear &mdash; nothing pending today!</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Hive daily digest</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${C.text};">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="margin-bottom:24px;">
      <div style="font-size:14px;color:${C.primary};font-weight:600;letter-spacing:0.5px;">HIVE</div>
      <div style="font-size:22px;color:${C.text};font-weight:700;margin-top:6px;">Good morning, ${escapeHtml(p.userName)}</div>
      <div style="font-size:14px;color:${C.muted};margin-top:4px;">${escapeHtml(p.familyName)} &middot; daily digest</div>
    </div>

    ${sections.join('')}
    ${empty}

    <div style="margin-top:32px;padding-top:16px;border-top:1px solid ${C.border};text-align:center;">
      <a href="https://hive-8he.pages.dev" style="color:${C.primary};text-decoration:none;font-size:13px;font-weight:600;">Open Hive</a>
      <div style="font-size:11px;color:${C.muted};margin-top:8px;">You can turn off this digest from the Family tab settings.</div>
    </div>
  </div>
</body>
</html>`;
}

export function buildDigestPlainText(p: DigestPayload): string {
  const lines: string[] = [];
  lines.push(`Good morning, ${p.userName}`);
  lines.push(`${p.familyName} - daily digest`);
  lines.push('');

  if (p.habits.length) {
    lines.push(`HABITS TODAY (${p.habits.length})`);
    p.habits.forEach((h) => {
      lines.push(`  - ${h.title} (${h.frequencyLabel})`);
    });
    lines.push('');
  }
  if (p.overdue.length) {
    lines.push(`OVERDUE (${p.overdue.length})`);
    p.overdue.forEach((t) => {
      const meta = [t.deadline && formatDate(t.deadline), t.location, priorityLabel(t.priority)].filter(Boolean).join(' - ');
      lines.push(`  - ${t.title} (${meta})`);
    });
    lines.push('');
  }
  if (p.today.length) {
    lines.push(`DUE TODAY (${p.today.length})`);
    p.today.forEach((t) => {
      const meta = [t.location, priorityLabel(t.priority)].filter(Boolean).join(' - ');
      lines.push(`  - ${t.title}${meta ? ` (${meta})` : ''}`);
    });
    lines.push('');
  }
  if (p.upcoming.length) {
    lines.push(`NEXT 3 DAYS (${p.upcoming.length})`);
    p.upcoming.forEach((t) => {
      const meta = [t.deadline && formatDate(t.deadline), priorityLabel(t.priority)].filter(Boolean).join(' - ');
      lines.push(`  - ${t.title} (${meta})`);
    });
    lines.push('');
  }
  if (p.overdue.length + p.today.length + p.upcoming.length + p.habits.length === 0) {
    lines.push('All clear - nothing pending today.');
    lines.push('');
  }

  lines.push('Open Hive: https://hive-8he.pages.dev');
  lines.push('Turn off this digest from the Family tab settings.');
  return lines.join('\n');
}
