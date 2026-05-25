# LifeOS — What drags users in (and what’s still weak)

This document maps **why someone stays**, **what feels addictive (ethically)**, **gaps today**, and **ideas to deepen the loop** — including first-time users who don’t know the app yet.

**Implementation reference:** [LOOP_AND_ENGAGEMENT_REFERENCE.md](./LOOP_AND_ENGAGEMENT_REFERENCE.md) — full loop, XP, quests, API, and file index.

---

## 1. The core loop (what we built)

```text
Open app → Daily Start → Do work (tasks / habits / focus) → Quest progress → Evening Shutdown → XP + streak
         ↑___________________________________________________________________________|
                              (next day: loss aversion + momentum score)
```

| Stage | Product surface | Psychological hook |
|--------|-----------------|-------------------|
| **Cue** | Morning banner, hero “Next action”, evening modal | Clear trigger — reduces “what do I do?” friction |
| **Routine** | Daily Start, quests, modules | Repeatable script — habit formation |
| **Reward** | XP, level-up, quest +5, all-quests +25, streak | Variable reward — completion feedback |
| **Investment** | Streak, level, life areas, goals linked | Sunk cost — harder to abandon |
| **Coach** | Life Momentum, neglected areas | Meaning — “this app understands my life” |

**Honest rating today:** the loop **exists** but **reward density is low** and **first visit is confusing**. Users can “complete onboarding” and land on a busy dashboard without understanding *one* path to value.

---

## 2. What drags users in (current hooks)

### 2.1 Immediate feedback (dopamine — subtle by design)

- **+XP toasts** on task, habit, focus, Daily Start, shutdown, review  
- **Quest micro-bonuses** (+5 per quest, +25 all quests)  
- **Level-up dialog**, streak milestones (3 / 7 / 14 / 30)  
- **“Day closed”** when morning + evening rituals both done  

*Strength:* tied to real actions, not vanity opens.  
*Weakness:* easy to miss; no persistent “you’re 1 action from saving your streak” except evening banner.

### 2.2 Loss aversion (don’t break the chain)

- **Global day streak** (any rewarded activity)  
- **Streak freezes** from weekly review  
- **Streak-at-risk banner** after 6pm if yesterday was active, nothing today  

*Strength:* classic retention mechanic.  
*Weakness:* streak story split across habit streak vs day streak vs check-in legacy — can feel inconsistent.

### 2.3 Daily structure (bookends)

- **Daily Start** — priority, top tasks, habits, focus block  
- **Evening Shutdown** — review, reflection, tomorrow’s first task  
- **Momentum `dailyLoop`** — 50% start + 50% shutdown in coaching score  

*Strength:* gives the day narrative arc.  
*Weakness:* optional — users can ignore both and still “use” tasks without closure.

### 2.4 Progress visibility

- **Today Progress card** — 6 quests, XP bar, level  
- **Life Momentum** — 30-day score, weak areas, suggestions  
- **First-week checklist** (7 days) — 4 setup steps  

*Strength:* always something to complete.  
*Weakness:* dashboard is **wide**, not **deep** — many widgets, one unclear “do this now.”

### 2.5 Onboarding (identity, not behavior)

- Lifestyle, improvement areas, intensity, module priority  
- Sets `lifeos_first_week` flag  

*Strength:* personalization.  
*Weakness:* **no first action** — user never experiences XP or Daily Start during onboarding.

---

## 3. Addictiveness map (ethical framing)

We are **not** building casino mechanics. The sustainable “addictive” layer is **compulsion to close open loops**:

| Mechanic | LifeOS today | Risk if overdone |
|----------|--------------|------------------|
| **Variable rewards** | Quest bonuses, achievements | Feels gamey / pointless |
| **Streaks** | Day streak + habit display | Anxiety, shame on break |
| **Progress bars** | XP level, quests 3/6 | Good if tied to real work |
| **Social proof** | None | FOMO, comparison stress |
| **Notifications** | Prefs only, Phase 2 push | Spam, uninstall |
| **Identity** | Onboarding lifestyle | Good if reinforced daily |
| **Coach voice** | Momentum suggestions | Trust = retention |

**Highest leverage for LifeOS:**  
1. **One obvious next step** (hero + first-visit guide)  
2. **Quotes / identity** (“discipline is a decision repeated”) — emotional glue  
3. **Closed day celebration** — closure dopamine  
4. **First session quick win** — habit check or 5-min focus in &lt;3 min  

---

## 4. Why it feels weak (gaps)

1. **No first-run script** — After onboarding, empty tasks/habits → “useless app.”  
2. **Quotes / voice missing** — Product feels mechanical, not human.  
3. **Quests don’t teach** — Labels don’t explain *where* to tap.  
4. **Low celebration density** — One toast per action; no “you’re 80% through today.”  
5. **Momentum disconnected from XP** — High momentum doesn’t boost rewards.  
6. **No outbound cues** — Push is scaffolded only; forgetful users churn.  
7. **Returning user ≠ new user** — Same dashboard for day 1 and day 100.

---

## 5. First-time user journey (what should happen)

```text
Signup/Onboarding (who you are)
    → First Visit Guide (how LifeOS works in 60s)
    → Forced path: Daily Start OR “Quick start” checklist
    → First quick win (create 1 habit + check it OR 5-min focus)
    → See +XP immediately
    → Evening: prompt shutdown
    → Day 2: hero + quote + streak = 2
```

| Moment | User thought | Product response |
|--------|--------------|------------------|
| Lands on dashboard | “What is this?” | First Visit Guide + single hero CTA |
| Empty tasks | “Nothing to do” | Checklist: “Create one habit” with deep link |
| First XP | “Oh, it notices” | Toast + short quote |
| End of day | “Did I win?” | Loop progress % + shutdown CTA |

---

## 6. Recommended improvements (priority)

### P0 — Implemented in this pass

- [x] **Motivational quotes** — time-of-day + loop phase + improvement focus from profile  
- [x] **Loop progress %** — percent + label on hero progress bar  
- [x] **First Visit Guide** — modal once on first dashboard visit  
- [x] **Stronger first-week / new-user hero** — “New here” badge, onboarding → Daily Start  
- [x] **Reward toasts** — ~35% include a motivational line  

### P1 — Implemented (first-time path)

- [x] **First Visit Guide** — one-time modal after onboarding; “Start my first win” → Daily Start  
- [x] **Onboarding first habit** — name one habit; created on first app load  
- [x] **Time to first XP** — `lifeos_first_xp_at` + celebration toast (under-3-min target)  
- [x] **First-user flow** — Onboarding → Guide → Daily Start → Habits (`?firstWin=1`) → XP → Dashboard  
- [x] **Loop hero** — “Today’s loop: X/Y complete” + % + “Next: …” (quote below action)  
- [x] **Today’s win** — dashboard greeting when ≥1 quest done  
- [x] **New-user next action** — habits / focus before “3 tasks” quests  

### P1 — Still open

- Quest tooltips with deep links  
- Tie quote to reward toast (20% chance) after actions  
- Phase 2 push: morning start, streak-at-risk, Sunday review  

### P2 — Depth

- Weekly “story” recap (tasks + focus + habits narrative)  
- Momentum-tier badges (Bronze / Silver week)  
- Habit streak calendar fix (consecutive days)  
- A/B: quest count 4 vs 6 for new users  

---

## 7. Metrics to watch

| Metric | Healthy signal |
|--------|----------------|
| Daily Start completion | ↑ % of DAU |
| Daily loop closure (start + shutdown) | ↑ median |
| `daily_quests_complete` events | ↑ |
| D1 / D7 retention | ↑ after first-visit guide |
| Time to first XP | ↓ (target &lt; 3 min) |
| First-week checklist completion | ↑ |

---

## 8. Quote strategy (product voice)

Quotes should:

- Match **time of day** (morning = intention, evening = reflection)  
- Match **improvement focus** from onboarding (discipline, focus, health, …)  
- Rotate **daily** (same quote all day, new tomorrow) — familiarity without noise  
- Never replace **clear CTAs** — subtitle only  

---

## 9. Summary

**What drags users today:** streaks, XP, quests, daily bookends, momentum coaching, and a single “next action” hero.  

**What’s weak:** emotional voice, first-session guidance, visible “% of day complete,” and teaching empty-state users how to get their first win.  

**North star:** *Every visit answers “What’s the one thing I do next?” and every closed day answers “Did I show up?”*

---

*Last updated: P1 first-time path (guide, habit, time-to-first-XP, loop hero).*
