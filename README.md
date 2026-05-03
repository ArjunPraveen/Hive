# Hive

A family productivity app where everyone stays in sync — shared todos, leaderboard, calendar, and more. Built with Expo (React Native) + Supabase.

**Live:** [hive-8he.pages.dev](https://hive-8he.pages.dev/)

## Iterations

| # | Date | Summary |
|---|------|---------|
| 1 | 2026-04-08 | Initial scaffold — Expo project with 5 tabs, mock data, warm amber theme, Add Todo/Event modals, WhatsApp nudge, Word of the Day API |
| 2 | 2026-04-11 | Supabase integration — real auth, RLS policies, DB migration, 25-bug audit fix |
| 3 | 2026-04-12 | Cloudflare Pages deployment — font MIME headers, SPA redirects, icon loading fix |
| 4 | 2026-04-12 | Full design revamp from Figma — dark theme, Lucide icons, HexIcon bee branding, 4-tab layout, inline forms, emoji avatars, podium leaderboard |
| 5 | 2026-04-12 | Expanded todo form (priority/deadline/assignee), todos grouped by deadline, edit/delete on todos and events, hex stat cards, Word of the Day via freeapi.me, Kerala holidays seed |
| 6 | 2026-04-12 | Native date picker (iOS/Android/Web), event emoji icons (birthday/festival/etc), WhatsApp share on task completion, responsive platform-aware padding |
| 7 | 2026-04-13 | Personal/Work labels on todos, label hex toggle, edit/delete inline, first-name filters, todo validation shake, bee easter egg, bold word in example sentence, WhatsApp group share |
| 8 | 2026-04-14 | Priority sorting (P0 first), expandable todo detail view, location field on todos, homepage shows today's todos only, completed todos layout fix |
| 9 | 2026-04-15 | HiveLoader (hex spinner with bee), parabolic bee flight path, accurate bee positioning via measureInWindow |
| 10 | 2026-04-16 | Multi-assign todos — tap multiple assignees, each gets an independent copy. In "All" view, shared todos group into one card with stacked avatars and per-member completion status. Group edit updates all copies. |
| 11 | 2026-05-03 | Habits feature — new 5th tab (between Todos and Events). Daily/weekly/custom-day frequencies, multi-assign support, streak tracking, weekly progress, leaderboard +5 pts per check-in. Collapsible todo sections. |
| 12 | 2026-05-04 | Daily email digest worker — Supabase Edge Function + pg_cron at 10 AM IST. Sends Habits/Overdue/Today/Next 3 days via Gmail SMTP. Email digest opt-out toggle in Family settings. |

## Tech Stack

- **Framework**: Expo (React Native) — iOS, Android, Web
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Icons**: Lucide React Native
- **Database**: Supabase (Postgres + Auth + Realtime)
- **Hosting**: Cloudflare Pages
- **State**: React Context

## Features

- Shared family todos with assignment, priorities, and deadlines
- WhatsApp nudge to remind family members
- WhatsApp share when completing a task
- Leaderboard with scoring and podium
- Word of the day with example sentences
- Shared family calendar with emoji event icons
- Family accounts with invite codes
- Native date picker on all platforms
- Hex card stat widgets on dashboard

## Getting Started

```bash
npm install
npx expo start
```
