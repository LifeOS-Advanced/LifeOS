# LifeOS

**LifeOS** is a modern personal life management web app built to help users manage their daily life in one connected system.

It combines tasks, habits, goals, notes, focus sessions, and personalized dashboard tools into a single platform.  
Instead of using separate apps for planning, tracking, and organizing, LifeOS gives users one clean place to manage everything.

---

## Overview

LifeOS is designed as a **personal operating system for life**.

It helps users:
- manage tasks
- track habits
- set and monitor goals
- write and organize notes
- run focus sessions with a Pomodoro timer
- personalize their workflow through onboarding and settings

The app is built with a clean modern UI inspired by productivity tools like Linear and Notion, while focusing on a more personal and lifestyle-oriented experience.

---

## Core Idea

Most people manage life across multiple disconnected tools:
- tasks in one app
- notes in another
- goals in their head
- habits tracked inconsistently
- focus and time management ignored completely

LifeOS solves that by creating one connected workspace where these systems work together.

---

## Main Features

### 1. Landing Page
The landing page introduces the product and explains its value clearly.

Includes:
- hero section with gradient heading
- feature cards
- testimonials section
- FAQ section
- CTA sections
- footer

---

### 2. Authentication
Users can create an account or log in through clean, modern auth pages.

Includes:
- login page
- signup page
- social login placeholders
- card-based layout
- local persistence support

---

### 3. Onboarding
After signup, users go through a 2-step onboarding flow.

#### Step 1: Lifestyle Mode
Users choose a mode such as:
- Student
- Freelancer
- Employee
- Creator
- Personal Growth

#### Step 2: Module Selection
Users choose which modules they want enabled:
- Tasks
- Habits
- Goals
- Notes
- Focus

This makes the app feel more personalized from the start.

---

### 4. Dashboard
The dashboard acts as the central control center of the app.

Includes:
- stats cards
- today’s tasks
- active habits
- goals progress
- recent notes
- quick overview widgets

Purpose:
- help users quickly understand their current state
- reduce mental clutter
- make daily planning easier

---

### 5. Tasks
The Tasks page allows users to manage their work in a structured way.

Includes:
- create task
- edit task
- delete task
- due dates
- priority
- status
- tags
- search
- filters
- list view
- board view

Supported statuses:
- To Do
- In Progress
- Done

---

### 6. Habits
The Habits page helps users build consistency through daily and weekly tracking.

Includes:
- create habit
- mark habits complete
- streak tracking
- daily/weekly frequency
- 7-day completion history

Purpose:
- help users stay disciplined
- make progress visible over time

---

### 7. Goals
The Goals page helps users define larger targets and track progress.

Includes:
- create goal
- add description
- set target date
- track progress
- define milestones
- link habits and tasks

Purpose:
- turn abstract goals into visible progress

---

### 8. Notes
The Notes page gives users a flexible space to capture ideas and information.

Includes:
- create notes
- edit notes inline
- delete notes
- pin notes
- tag notes
- search notes
- view in grid layout

Purpose:
- store useful thoughts, plans, or reference material inside the same system

---

### 9. Focus
The Focus page helps users work with intention using a Pomodoro timer.

Includes:
- circular timer UI
- start / pause / reset
- preset durations
- distraction notes
- session-based focus workflow

Purpose:
- support deep work
- reduce distraction
- turn planning into action

---

### 10. Settings
The Settings page lets users personalize the product.

Includes:
- profile settings
- theme toggle
- module preferences
- notification placeholders

Purpose:
- let users adapt the system to their own workflow

---

## Design System

LifeOS uses a clean visual style built for calm productivity.

### Design direction
- modern SaaS dashboard style
- indigo-based palette
- inspired by Linear and Notion
- glassmorphism navbar
- gradient CTA elements
- smooth page/component animations
- semantic design tokens

### UX goals
- clean layout
- easy navigation
- minimal friction
- clear hierarchy
- responsive experience on desktop and mobile

---

## Current Tech Direction

LifeOS is built with:

- **React**
- **Vite**
- **MERN-ready architecture**
- **Framer Motion** for smooth animations
- **localStorage** for persistence in the current version

---

## Data Persistence

At the moment, data is stored in **localStorage**.

### Current behavior
- dummy data is seeded on first login
- user changes persist locally in the browser
- no backend/database is required for the current build

### Future plan
LifeOS is intended to move toward full MERN stack architecture with:
- MongoDB
- Express
- React
- Node.js

---

## Product Structure

LifeOS is currently organized into 10 main sections:

1. Landing Page  
2. Login  
3. Signup  
4. Onboarding  
5. Dashboard  
6. Tasks  
7. Habits  
8. Goals  
9. Notes  
10. Focus  
11. Settings  

---

## Who It Is For

LifeOS is built for users who want one place to manage life more clearly.

### Main target users
- students
- freelancers
- developers
- creators
- young professionals
- self-improvement users
- people rebuilding consistency and discipline

---

## Why LifeOS Exists

LifeOS is not just a to-do app.

It is meant to become a **connected life management system** where:
- tasks support goals
- habits build consistency
- notes store useful thinking
- focus sessions turn plans into action
- the dashboard keeps everything visible

The goal is to help users feel:
- more organized
- less overwhelmed
- more consistent
- more in control of their daily life

---

## Current Version

### Implemented
- landing page
- auth pages
- onboarding
- dashboard
- tasks
- habits
- goals
- notes
- focus timer
- settings
- local data persistence
- realistic seeded dummy data
- theme support
- motion and UI polish

### Planned Enhancements
- Life Areas
- linked task/habit/goal/note relationships
- command bar
- global search
- weekly review
- recurring tasks
- subtasks
- calendar/timeline view
- insights page
- backend integration
- real authentication
- database persistence

---

## Future Vision

The long-term vision of LifeOS is to become a **modular personal operating system** for everyday life.

That means:
- smarter dashboards
- stronger relationships between modules
- better analytics
- personalized onboarding
- full-stack persistence
- premium-level UX

---

## Local Development

Example development setup:

```bash
npm install
npm run dev
