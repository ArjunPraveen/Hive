# Hive

A family productivity app where everyone stays in sync — shared todos, leaderboard, calendar, and more. Built with Expo (React Native) + Supabase.

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
