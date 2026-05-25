# LifeOS

**LifeOS** is a full-stack personal life management web app that helps users manage their daily life in one connected system.

It combines tasks, habits, goals, notes, focus sessions, check-ins, weekly reviews, and a personalised dashboard into a single platform backed by a real REST API and MongoDB database.

---

## Tech Stack

### Frontend
- **React 18** + **Vite**
- **TypeScript**
- **Tailwind CSS** + custom design tokens
- **shadcn/ui** component library
- **Framer Motion** for animations
- **React Router v6** for routing (with route protection)
- **TanStack Query (React Query)** for server-state management
- **React Hook Form** + **Zod** for form validation
- **TipTap** rich text editor (Notes)
- **FullCalendar** for the Calendar view
- **Recharts** for analytics charts
- **@react-oauth/google** for Google OAuth

### Backend
- **Node.js** + **Express**
- **TypeScript**
- **MongoDB** via **Mongoose**
- **JWT** (access + refresh token rotation)
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **Helmet**, **cors**, **compression**, **morgan**
- **express-rate-limit** (global + auth-specific)

---

## Architecture

```
lifeos/
├── backend/          # Express REST API
│   └── src/
│       ├── config/   # DB connection
│       ├── middleware/# auth guard, error handler
│       ├── models/   # Mongoose schemas (User, Task, Habit, Goal, Note, FocusSession, DailyCheckIn, WeeklyReview)
│       ├── routes/   # auth, tasks, habits, goals, notes, focus, checkIns, reviews, profile
│       └── utils/    # JWT helpers, response helpers
└── frontend/         # React SPA
    └── src/
        ├── components/
        │   ├── app/  # AppLayout, AppSidebar, Dashboard widgets, ProtectedRoute, …
        │   ├── landing/# Landing page sections
        │   └── ui/   # shadcn/ui primitives
        ├── context/  # AuthContext (API-backed login/logout)
        ├── hooks/    # useIsMobile, useToast, useNewParam
        ├── lib/      # api client, store (localStorage), queries, types, schemas, …
        └── pages/    # Landing, Login, Signup, Onboarding, app/* pages
```

---

## Authentication

Authentication is **JWT-based** with httpOnly refresh-cookie rotation.

| Flow | Notes |
|---|---|
| Register / Login | Email + password via `POST /api/auth/register` and `/api/auth/login` |
| Google OAuth | Access-token exchange via `POST /api/auth/google` |
| Token refresh | Silent refresh via httpOnly cookie at `POST /api/auth/refresh` |
| Logout | Revokes refresh token server-side via `POST /api/auth/logout` |

The frontend stores the short-lived **access token** in `localStorage` and uses an `AuthContext` (`src/context/AuthContext.tsx`) to expose `login`, `loginWithGoogle`, and `logout` to the rest of the app.

All `/app/**` routes are wrapped in a `ProtectedRoute` component that redirects unauthenticated users to `/login`.

---

## Data Layer

The app uses a unified `dataLayer` abstraction in `src/lib/data-layer.ts` with React Query hooks in `src/lib/queries.ts`:

- **When logged in (JWT):** tasks, habits, goals, notes, focus sessions, daily flows, weekly reviews, profile, search, momentum, and progress sync to the API.
- **Offline / demo:** the same hooks fall back to `localStorage` via `src/lib/store.ts`.

Pages should use React Query hooks only—not `store.ts` directly.

---

## API Routes

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/google` | Google OAuth sign-in |
| POST | `/api/auth/refresh` | Rotate tokens |
| POST | `/api/auth/logout` | Revoke refresh token |
| GET  | `/api/auth/me` | Current user |
| GET/POST/PUT/DELETE | `/api/tasks` | Task CRUD + status/subtask patches |
| GET/POST/PUT/DELETE | `/api/habits` | Habit CRUD + toggle |
| GET/POST/PUT/DELETE | `/api/goals` | Goal CRUD + milestones |
| GET/POST/PUT/DELETE | `/api/notes` | Note CRUD + pin |
| GET/POST/DELETE | `/api/focus` | Focus sessions |
| GET/POST | `/api/checkins` | Daily check-ins (upsert per day) |
| GET/POST | `/api/reviews` | Weekly reviews (upsert per week) |
| GET/PUT/PATCH | `/api/profile` | Profile read/update/password change |
| GET | `/api/health` | Health check |

---

## Main Features

### 1. Landing Page
Hero section, feature cards (bento grid), testimonials, FAQ, and CTA.

### 2. Authentication
Login and signup pages with email/password and Google OAuth. Clean split-panel layout.

### 3. Onboarding
5-step onboarding: lifestyle mode → improvement focus → day intensity → dashboard priority → module selection.

### 4. Dashboard
Personalised control centre with:
- **Today Engine** — AI-style planning panel surfacing overdue tasks, the most important task, habits due, and a suggested focus session.
- **Stat cards** — Tasks done, active habits, goals in progress, focus sessions (widget-configurable).
- **Connected Goal** — shows tasks, habits, and notes linked to your most-linked goal.
- **Consistency card** — check-in streak, weekly score, habit streak, focus streak, goal momentum.
- **Insights teaser** — link to the full analytics page.
- **Pinned Notes** strip.

All widgets are individually toggleable and reorderable in Settings.

### 5. Tasks
Full task management: priority, status, due date, tags, life area, goal link, subtasks, and recurrence (daily/weekly/monthly). Board view and list view. Animated `TaskCheckbox` with pathLength draw-in.

### 6. Habits
Daily/weekly habits with 7-day history grid, streak tracking, "at risk" badge, and goal linking.

### 7. Goals
Goals with milestones, progress bar, target date, life area, and linked task/habit/note columns. **GoalIntelligence** panel shows time remaining, pace (on track vs behind), momentum, and habit consistency.

### 8. Notes
Rich-text editor (TipTap) with templates (blank, meeting, daily journal, project brief), folders, tags, pinning, life area tagging, task/goal linking, and `[[backlink]]` detection.

### 9. Focus
Circular Pomodoro timer with preset durations, session goal, task linking, distraction logging, interruption counter, and fullscreen mode. Sessions list with analytics (today's minutes, best hour, top task).

### 10. Calendar
FullCalendar month/week view with tasks (drag-to-reschedule), goals (target dates), and habit completions overlaid. Filter chips per type.

### 11. Insights
Full analytics page with:
- Task velocity, focus time, completion rate, productivity trend (line/area charts)
- Per-goal progress (horizontal bar)
- Habit consistency dial (radial)
- Life-area distribution (pie)
- Goals on track vs behind
- Range picker: this week / this month / all time

### 12. Weekly Review
Structured Sunday reflection with auto-detected most-productive and neglected life areas, a week-at-a-glance bar chart, and three reflection prompts (went well / got ignored / improve next).

### 13. Settings
Profile, theme (light/dark), accent colour (indigo/emerald/slate/amber), timezone, week start day, default focus duration, dashboard widget visibility + order, module enable/disable + sidebar pin, notification toggles.

---

## Design System

- **Palette:** indigo-primary, emerald-accent, warm semantic tokens (success, warning, info, destructive).
- **Typography:** DM Sans (body) + Instrument Serif (display/italic accents).
- **Sidebar:** dark-panelled sidebar (`hsl(224 28% 7%)`) with collapsible icon mode.
- **Glassmorphism** navbar on the landing page.
- **Animations:** Framer Motion page transitions, count-up stat cards, milestone toggles, burst rings on task completion, habit-pulse on check-in.

---

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend

```bash
cd backend
cp .env.example .env   # fill in MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET
npm install
npm run dev            # ts-node-dev, port 5000
```

### Frontend

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:5000 (optional, defaults to that)
npm install
npm run dev            # Vite dev server, port 5173
```

### Environment Variables

**Backend `.env`**
```
MONGODB_URI=mongodb://localhost:27017/lifeos
PORT=5000
NODE_ENV=development
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173
```

**Frontend `.env`**
```
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id   # optional
VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id   # optional
```

---

## Engagement & retention

See **[docs/ENGAGEMENT_AND_RETENTION.md](../docs/ENGAGEMENT_AND_RETENTION.md)** for strategy, gaps, and backlog, and **[docs/LOOP_AND_ENGAGEMENT_REFERENCE.md](../docs/LOOP_AND_ENGAGEMENT_REFERENCE.md)** for the full loop/XP/quest implementation reference.

---

## Known Limitations / Planned Work

- No email verification or password-reset flow yet.
- Native mobile app planned.
- Push/browser notifications are UI-only (no delivery mechanism yet).