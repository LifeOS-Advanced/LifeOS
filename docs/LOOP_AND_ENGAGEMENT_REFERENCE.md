# LifeOS — Daily Loop & Engagement Reference

Complete inventory of the **daily loop**, **reward/XP system**, and **retention mechanics** as implemented in code. For strategy, gaps, and backlog priorities, see [ENGAGEMENT_AND_RETENTION.md](./ENGAGEMENT_AND_RETENTION.md).

---

## North star

- **Every visit:** *“What’s the one thing I do next?”*
- **Every closed day:** *“Did I show up?”*

**Honest assessment:** The loop exists but reward density is low; bookends are optional; first visit can feel confusing without Daily Start.

---

## 1. Core loop diagram

```text
Open app → Daily Start → Work (tasks / habits / focus) → Quest progress → Evening Shutdown → XP + streak
         ↑___________________________________________________________________________|
                              (next day: loss aversion + Life Momentum)
```

| Stage | Product surface | Psychological hook |
|--------|-----------------|-------------------|
| **Cue** | Morning banner, hero “Next action”, evening modal | Reduces “what do I do?” friction |
| **Routine** | Daily Start, quests, modules | Repeatable script — habit formation |
| **Reward** | XP, level-up, quest +5, all-quests +25, streak | Variable reward on real work |
| **Investment** | Streak, level, life areas, linked goals | Sunk cost — harder to abandon |
| **Coach** | Life Momentum, neglected areas | Meaning — “this app understands my life” |

---

## 2. Loop engine (code)

### 2.1 Hero phases (`buildDailyLoopHero`)

| Phase | Condition | CTA route |
|--------|-----------|-----------|
| `start_day` | Daily Start not done | `/app/daily-start` |
| `next_quest` | Start done, incomplete quest | Per quest (see below) |
| `close_day` | Shutdown not done | `/app/evening-shutdown` |
| `complete` | Start + shutdown done | `/app/progress` |

**Quest → route mapping** (`frontend/src/lib/daily-loop.ts`):

| Quest ID | Route |
|----------|--------|
| `daily_start_1` | `/app/daily-start` |
| `tasks_3` | `/app/tasks` |
| `focus_1` | `/app/focus` |
| `habits_2` | `/app/habits` |
| `area_1` | `/app/tasks` |
| `shutdown_1` | `/app/evening-shutdown` |

**State hook:** `useDailyLoopState()` (`frontend/src/lib/useDailyLoopState.ts`)

- **Daily Start done:** `confirmedAt` or `mainPriority` on today’s record
- **Evening Shutdown done:** evening record has `id`
- **`dailyLoopComplete`:** both true

### 2.2 Loop progress % (dashboard bar)

`getDailyLoopProgress()` — separate from quest XP:

| Piece | Weight |
|--------|--------|
| Daily Start | 20% |
| Quests completed (of 6) | up to 60% |
| Evening Shutdown | 20% |

**Labels:** *Just getting started* → *Building momentum* → *Almost there* → *Day complete* (100%).

**UI:** `DailyLoopHeroCard` + `MotivationalQuoteBar`.

### 2.3 Life Momentum `dailyLoop` (30-day coach)

- **Today’s loop component:** 50% Daily Start + 50% Evening Shutdown (for today only)
- **Blended into overall score at 10%:**

| Component | Weight |
|-----------|--------|
| tasks | 20% |
| habits | 22% |
| focus | 14% |
| goals | 16% |
| checkIns | 10% |
| reviews | 8% |
| **dailyLoop** | **10%** |

**Backend:** `GET /api/momentum` — `backend/src/routes/momentum.ts`  
**Frontend (offline):** `computeLifeMomentum()` — `frontend/src/lib/insights.ts`

**Gap:** High momentum does not boost XP.

---

## 3. Daily bookends

### Daily Start (`/app/daily-start`)

**Fields:** mood (1–5), energy, main priority, up to 3 top tasks, habits, focus duration (5–180 min).

**On save:**

- `POST /api/daily-flows/start` (with API auth)
- Event `daily_start` → **+25 XP**
- `emitRewardMoment(..., { eventType: 'daily_start' })`

**Onboarding:** `markFirstWeekStarted()` then navigate to Daily Start.

### Evening Shutdown (`/app/evening-shutdown`)

**Fields:** completed/delayed tasks, mood, energy, reflection, tomorrow’s first task.

**On save:**

- `POST /api/daily-flows/shutdown`
- Upserts legacy `DailyCheckIn` (feeds check-in streak in insights)
- Event `evening_shutdown` → **+30 XP**
- **“Day closed”** toast when `dailyStartDone` + shutdown (via `emitRewardMoment`)

### Global engagement prompts (`AppLayout`)

| Component | Trigger |
|-----------|---------|
| `MorningEntryBanner` | No Daily Start today; dismiss per day (`sessionStorage`) |
| `EveningShutdownPrompt` | Start done, shutdown not, hour ≥ `windDownHour` (default 20) |
| `StreakAtRiskBanner` | After 18:00 (user TZ), streak ≥1, active yesterday, nothing today |
| `FirstVisitGuide` | First dashboard visit (`lifeos_first_visit_guide_seen`) |
| `WeeklyReviewPrompt` | Weekly loop (separate from daily) |
| `RewardMomentProvider` | Level-up dialog |

**Preference:** `UserPreferences.windDownHour` (0–23) for evening modal.

---

## 4. Daily quests

Six quests per day (`buildQuestDefs` in `backend/src/services/progress.ts` and `frontend/src/lib/progress.ts`):

| ID | Label | Target |
|----|--------|--------|
| `daily_start_1` | Start your day | 1 |
| `tasks_3` | Complete 3 tasks | 3 |
| `focus_1` | Finish 1 focus sprint | 1 |
| `habits_2` | Check 2 habits | 2 |
| `area_1` | Move one life area forward | 1 (`metadata.lifeArea` on any event) |
| `shutdown_1` | Close the day | 1 |

**Bonuses (auto, once per day per quest / all):**

| Trigger | XP | Event type |
|---------|-----|------------|
| Each quest completed | +5 | `quest_bonus` |
| All six complete | +25 | `daily_quests_complete` |

**UI:** `TodayProgressCard`, `/app/progress`.

---

## 5. XP, levels, streaks, achievements

### XP by action

| Event | XP |
|--------|-----|
| `task_completed` | 20 |
| `habit_checked` | 15 |
| `focus_completed` | 20–120 (from `metadata.duration`, default 25) |
| `daily_start` | 25 |
| `evening_shutdown` | 30 |
| `weekly_review` | 75 |
| `quest_bonus` | 5 (per quest) |
| `daily_quests_complete` | 25 |

**Level:** `level = floor(sqrt(totalXp / 100)) + 1`  
**Level XP band:** `(level-1)² × 100` to `level² × 100`.

### Global day streak (canonical for retention UI)

- Any non-duplicate rewarded activity on a calendar day counts
- Gap 1 day → streak +1
- Gap > 1 day → consume **streak freeze** if available, else reset to 1
- `weekly_review` → +1 freeze (max 3)

### Other streak metrics (can feel inconsistent)

| Metric | Source |
|--------|--------|
| `dailyStreak` | `UserProgress` / progress service |
| Habit `streak` | Per-habit on toggle (`habits` route / data-layer) |
| `checkInStreak` | `DailyCheckIn` dates via `computeConsistency()` |
| `focusStreak` | Consecutive days with focus sessions |

`ConsistencyCard` uses `dayStreak` from progress when provided; else falls back to `checkInStreak`.

### Achievements

| ID | Condition |
|----|-----------|
| `first_focus` | First focus session |
| `habit_7_day_streak` | Habit checked with streak ≥ 7 |
| `weekly_reset` | Weekly review completed |
| `balanced_week` | 3+ life areas active in ISO week |
| `deep_work_day` | 90+ focus minutes in one day |
| `goal_mover` | Event with `metadata.goalId` |

---

## 6. Reward feedback (`emitRewardMoment`)

**File:** `frontend/src/lib/reward-moments.ts`  
**Called from:** Tasks, Habits, Focus, Daily Start, Evening Shutdown, Review (after progress returns `awarded`).

| Feedback | When |
|----------|------|
| Streak freeze used | Gap bridged with freeze |
| Streak milestones | 3, 7, 14, 30 days (once each, localStorage) |
| Level-up dialog | `RewardMomentProvider` |
| +XP toast | Non-duplicate XP; ~35% includes motivational quote |
| Quest complete | Each `questBonuses` entry |
| All quests | `allQuestsComplete` |
| Day closed | `evening_shutdown` + `dailyStartDone` |
| Achievements | New unlocks in response |

**Not rewarded:** Opening the app without a qualifying action.

---

## 7. Motivational quotes

**File:** `frontend/src/lib/motivational-quotes.ts`

- Contexts: `morning`, `afternoon`, `evening`, `loop`, `reward`, `first_visit`
- Same quote all day per seed (`hashDay`)
- `improvementFocus` from onboarding adds focus-specific lines
- Hero phase maps: `start_day` → morning pool, `close_day` → evening, `complete` → loop

---

## 8. First-time & retention scaffolding

| Mechanism | Storage / rule | Behavior |
|-----------|----------------|----------|
| First week card | `lifeos_first_week_started`, ≤7 days, not dismissed | 4 setup steps with deep links |
| “New here” badge | ≤3 days since first week start | On `DailyLoopHeroCard` |
| First Visit Guide | `lifeos_first_visit_guide_seen` | 3-step modal on first `/app` |
| Onboarding | Profile + `markFirstWeekStarted()` | Ends at Daily Start; no XP in flow |

### Partially implemented (not wired to UI)

**File:** `frontend/src/lib/first-win.ts`

- `recordFirstXpIfNeeded()` — time-to-first-XP tracking
- `buildNewUserHeroOverride()` — steer to habit/focus after Daily Start
- `setPendingFirstHabit()` / `consumePendingFirstHabit()`

---

## 9. Dashboard surfaces

**Page:** `frontend/src/pages/app/Dashboard.tsx`

1. Greeting + today’s priority (if Daily Start done)
2. `MorningEntryBanner` + `StreakAtRiskBanner`
3. `DailyLoopHeroCard` (next action, loop %, quote)
4. `FirstWeekCard` (if applicable)
5. `TodayProgressCard` (XP, quests, streak, freezes)
6. `LifeMomentumCard` (30-day score, suggestions)
7. Daily Start / Evening Shutdown tiles
8. Widgets: Today Engine, stats, Consistency, etc. (Settings-toggleable)

**Progress page:** `/app/progress` — full XP, achievements, recent wins, quest board.

---

## 10. Ethical “addictiveness” map

Sustainable compulsion = **close open loops**, not vanity engagement.

| Mechanic | LifeOS today | Overuse risk |
|----------|--------------|--------------|
| Variable rewards | Quest +5, all-quests +25, achievements | Feels gamey |
| Streaks | Day + habit + check-in | Anxiety on break |
| Progress bars | XP, loop %, quests, momentum | OK if tied to work |
| Social proof | None | — |
| Notifications | Settings toggles only | Spam if pushed blindly |
| Identity | Onboarding + quotes | Good if reinforced daily |
| Coach voice | Momentum warnings/suggestions | Trust = retention |

---

## 11. Known gaps

1. No forced first-run path after empty onboarding
2. Quest labels don’t teach where to tap (no deep links yet)
3. Low celebration density between actions
4. Momentum score doesn’t affect XP
5. Push/notifications scaffolded only (no delivery)
6. Same dashboard for day 1 vs day 100
7. Split streak models (day vs habit vs check-in)
8. `first-win.ts` helpers not connected to hero/UI

---

## 12. API reference

| Method | Path | Role |
|--------|------|------|
| GET | `/api/daily-flows/today?date=` | Start + shutdown for date |
| GET/POST | `/api/daily-flows/start` | Daily Start + XP |
| GET/POST | `/api/daily-flows/shutdown` | Evening Shutdown + XP + check-in |
| GET | `/api/progress/today` | Progress snapshot + quests |
| POST | `/api/progress/event` | Record reward event |
| GET | `/api/momentum?periodDays=` | Life Momentum coaching |

Tasks, habits, focus routes also emit progress events server-side when using the API.

**Local fallback:** `frontend/src/lib/progress.ts` → `localStorage` key `lifeos_progress` when no API token (`data-layer.ts`).

---

## 13. Source file index

| Area | Path |
|------|------|
| Loop logic | `frontend/src/lib/daily-loop.ts` |
| Loop state | `frontend/src/lib/useDailyLoopState.ts` |
| Reward UI | `frontend/src/lib/reward-moments.ts`, `frontend/src/components/app/RewardMoment.tsx` |
| Progress rules | `backend/src/services/progress.ts`, `frontend/src/lib/progress.ts` |
| Daily flows API | `backend/src/routes/dailyFlows.ts` |
| Momentum API | `backend/src/routes/momentum.ts` |
| Momentum (client) | `frontend/src/lib/insights.ts` |
| Hero UI | `frontend/src/components/app/DailyLoopHero.tsx` |
| Quotes | `frontend/src/lib/motivational-quotes.ts`, `MotivationalQuoteBar.tsx` |
| Prompts | `MorningEntryBanner`, `EveningShutdownPrompt`, `StreakAtRiskBanner`, `FirstVisitGuide` |
| First week | `FirstWeekCard.tsx` |
| Today progress | `TodayProgressCard.tsx` |
| Strategy doc | `docs/ENGAGEMENT_AND_RETENTION.md` |

---

## 14. Metrics to watch

| Metric | Healthy signal |
|--------|----------------|
| Daily Start completion | ↑ % of DAU |
| Daily loop closure (start + shutdown) | ↑ median |
| `daily_quests_complete` events | ↑ |
| D1 / D7 retention | ↑ after first-visit guide |
| Time to first XP | ↓ (target &lt; 3 min) |
| First-week checklist completion | ↑ |

---

*Reference generated from codebase audit. Update when loop or progress rules change.*
