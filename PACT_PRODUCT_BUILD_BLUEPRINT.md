---
title: "Pact — Product & Build Blueprint"
version: "0.2"
status: "Active build"
owner: "Daniel"
platform: "Installable Web App / PWA"
last_updated: "2026-07-21"
---

# Pact — Product & Build Blueprint

> **Working name:** Pact  
> **Product type:** Personal task and accountability app  
> **Initial platform:** Mobile-first Progressive Web App  
> **Initial budget:** Free-tier infrastructure (Vercel + Convex + Neon + Better Auth)  
> **Primary stack:** Next.js, TypeScript, Convex (app data), Better Auth + Neon Postgres (auth), Web Push (planned), IndexedDB (planned)

---

## 1. Document purpose

This document is the single source of truth for planning, designing, building, testing, and launching the first version of Pact.

It combines:

- Product brief
- Product requirements document
- MVP scope
- User roles and user flows
- Technical architecture
- Data model
- Notification specification
- PWA requirements
- Design system
- Analytics plan
- Validation plan
- Development roadmap
- QA checklist
- Landing-page outline
- Pitch-deck outline
- Team responsibilities
- Risk register

Update this document whenever a major product or technical decision changes.

---

# PART A — PRODUCT STRATEGY

## 2. Product summary

### 2.1 One-sentence description

Pact helps people make commitments, involve trusted accountability partners, track progress, respond to blockers, and recover together when plans fail.

### 2.2 Product promise

> Make commitments. Show your progress. Recover together.

### 2.3 Positioning statement

For students, professionals, creators, and goal-oriented friends who struggle to follow through consistently, Pact is an accountability and commitment app that turns personal goals into structured agreements with people they trust.

Unlike ordinary task managers, Pact does not stop at organising tasks. It creates clear accountability expectations, shared check-ins, partner responses, recovery plans, and measurable progress.

### 2.4 Core insight

The main problem is not that people do not know what to do. The problem is that:

- Important goals are easy to postpone when nobody is aware of them.
- Informal accountability partnerships often lose momentum.
- Most task apps organise work but do not manage accountability relationships.
- Many habit apps focus on streaks instead of complex goals and recovery.
- Missing one or two commitments can create guilt and abandonment.

Pact should make it easier to continue after a setback than to quit.

---

## 3. Problem statement

People frequently create goals, tasks, and plans but fail to complete them because motivation changes, blockers appear, and no reliable accountability structure exists.

Existing alternatives have gaps:

- Task managers organise work but may not provide meaningful accountability.
- Habit trackers often focus on repetitive habits rather than multi-step goals.
- Messaging apps provide communication but not structured progress tracking.
- Accountability partners may stop responding or may not understand what support is expected.
- Streak-based systems can punish imperfect progress and encourage users to leave after a setback.

Pact will address these gaps with a structured accountability loop.

---

## 4. Target users

### 4.1 Primary audience

Young professionals and students aged approximately 18–35 who are working toward meaningful personal goals and already know someone they trust enough to invite as an accountability partner.

### 4.2 Initial user segments

1. **Career builders**
   - Completing certifications
   - Building portfolios
   - Applying for jobs
   - Learning technical skills

2. **Students**
   - Exam preparation
   - Assignment completion
   - Thesis or project work
   - Group study goals

3. **Creators and freelancers**
   - Publishing consistently
   - Completing client work
   - Launching side projects
   - Building content series

4. **Friends and couples**
   - Savings goals
   - Fitness goals
   - Household projects
   - Relocation or travel preparation

### 4.3 Initial market focus

The first private beta should focus on:

> Friends, students, and young professionals who already have someone they want to work with or be accountable to.

Stranger matching should not be part of the first release.

---

## 5. Jobs to be done

### 5.1 Functional jobs

Users need to:

- Capture personal tasks quickly.
- Turn an important goal into a structured Pact.
- Invite someone to participate or supervise progress.
- Define deadlines, milestones, check-in times, and evidence requirements.
- Send fast progress updates.
- Receive useful partner responses.
- Ask for help when blocked.
- Recover after missing a task.
- Review progress weekly.

### 5.2 Emotional jobs

Users want to:

- Feel supported without feeling judged.
- Avoid disappointing someone they trust.
- Feel progress is visible and meaningful.
- Return after a setback without shame.
- Trust that their private goals are protected.

### 5.3 Social jobs

Users want to:

- Show that they are serious about a goal.
- Be dependable to another person.
- Encourage someone they care about.
- Work toward a shared outcome.

---

## 6. Product principles

All product decisions should follow these principles.

### 6.1 Execution over organisation

The app should help users act, not force them to spend excessive time organising tasks.

### 6.2 Relationships over screen time

The goal is not to maximise app addiction. The goal is to strengthen meaningful accountability and increase completed commitments.

### 6.3 Recovery over perfection

Missed commitments should trigger a recovery flow, not only a red overdue state.

### 6.4 Low friction

Creating a task, checking in, or responding to a partner should take only a few seconds.

### 6.5 Privacy by default

Users should decide what partners can see.

### 6.6 Clear expectations

Each Pact should define the type of accountability expected from every participant.

### 6.7 No unnecessary complexity

Do not add features simply because competitors have them.

---

## 7. Product differentiators

### 7.1 Accountability Agreements

Before a Pact begins, participants agree on:

- Goal
- Deadline
- Check-in schedule
- Evidence requirements
- Privacy level
- Accountability style
- What happens after a missed commitment
- How the Pact can be paused or ended

### 7.2 Five-second progress signals

Users can update progress using:

- Done
- On track
- Slipping
- Blocked
- Need help

### 7.3 Pact Health

The app evaluates whether a Pact is healthy based on:

- Check-in consistency
- Partner response rate
- Missed commitments
- Unanswered help requests
- Inactivity

Possible health states:

- Healthy
- Needs attention
- At risk
- Paused
- Completed

### 7.4 Rescue Mode

When a commitment is missed, users can:

- Reduce the task
- Reschedule it
- Split it into smaller steps
- Ask for help
- Remove it
- Create a recovery plan

### 7.5 Structured partner responses

Instead of building full chat immediately, partners can respond with focused actions:

- Well done
- Proof accepted
- What is blocking you?
- How can I help?
- Let us adjust the plan
- I am available to work with you
- Please send an update

### 7.6 Weekly reviews

Each active Pact receives a weekly review containing:

- Commitments completed
- Commitments missed
- Commitments recovered
- Major blockers
- Partner participation
- Next priorities

---

# PART B — PRODUCT REQUIREMENTS

## 8. User roles

### 8.1 Owner

The person who creates a personal goal or Pact.

Permissions may include:

- Edit Pact details
- Add or remove commitments
- Invite participants
- Set privacy rules
- Pause or end the Pact

### 8.2 Collaborator

A person actively working toward the same goal.

Permissions may include:

- Create and update assigned commitments
- Submit check-ins
- Upload evidence
- Participate in weekly reviews

### 8.3 Accountability Partner

A person who monitors, encourages, and responds but may not complete tasks directly.

Permissions may include:

- View permitted progress information
- Respond to check-ins
- Approve evidence when required
- Review recovery plans
- Flag inactivity

### 8.4 Personal user

A user managing private tasks without involving another person.

---

## 9. Core product objects

### 9.1 Task

A basic personal action.

Example:

> Update LinkedIn profile.

### 9.2 Commitment

A specific promise with measurable completion criteria.

Example:

> Submit five job applications by Friday at 6:00 PM.

### 9.3 Goal

A broader outcome made up of commitments.

Example:

> Secure a data analyst role.

### 9.4 Pact

A structured accountability agreement between two or more users.

### 9.5 Check-in

A progress update attached to a commitment or Pact.

### 9.6 Evidence

Optional proof such as:

- Image
- Screenshot
- Link
- File
- Short note

### 9.7 Partner response

A structured response to a user’s update.

### 9.8 Recovery plan

A revised plan created after a commitment becomes blocked or overdue.

### 9.9 Weekly review

A generated summary of progress and participation.

---

## 10. MVP scope

### 10.1 Must-have features

- [x] Account creation and login — Better Auth (email/password; Google optional)
- [x] Profile setup — basic display name / email via Convex user bridge
- [ ] Create personal task — `tasks` table exists; UI/API not wired (solo commitments used today)
- [ ] Edit and delete personal task
- [x] Create a Pact
- [x] Invite partner using a secure link
- [x] Accept or reject invitation
- [x] Select participant role
- [x] Select accountability style
- [x] Create shared commitment
- [ ] Assign commitment — currently always assigns to creator
- [x] Add due date and reminder — due dates wired; reminder scheduling / push not wired
- [x] Submit five-second progress signal
- [ ] Add optional evidence — schema/policy fields only; no uploads
- [x] Send structured partner response
- [x] View Pact progress
- [x] Trigger Rescue Mode
- [x] Create recovery plan
- [x] Generate weekly review — Insights screen + Convex weekly review data
- [x] View notifications inside the app
- [ ] Enable Web Push notifications
- [x] Install the app as a PWA — manifest, icons, service worker, `/install`, `/offline`
- [ ] Configure privacy permissions — create hardcodes invite-only; no settings UI
- [ ] Delete account

### 10.2 Should-have features

- [ ] Recurring commitments
- [ ] Pact templates
- [ ] Basic offline task drafting
- [ ] App icon badge count
- [ ] Quiet hours
- [ ] Search and filtering
- [ ] Export basic progress data
- [ ] Pact pause and restart

### 10.3 Could-have features

- [ ] Focus timer
- [ ] Audio notes
- [ ] Calendar integration
- [ ] Public beta waitlist
- [ ] Multiple accountability partners
- [ ] Accountability circles
- [ ] Premium plan

### 10.4 Not in Version 1

- Stranger matching
- Public social feed
- Full direct messaging
- Video or audio calling
- AI coaching
- Financial penalties
- Cryptocurrency rewards
- Workplace project management
- Public leaderboards
- Native iOS widgets
- Live Activities
- Dynamic Island integration

---

## 11. Core user stories

### 11.1 Account and onboarding

**As a new user, I want to create an account quickly so that I can start a personal task or invite a partner.**

Acceptance criteria:

- User can authenticate using the supported method.
- User can choose a display name.
- User can skip non-essential profile fields.
- User reaches first-value action within one minute.

### 11.2 Create a Pact

**As a user, I want to create a Pact so that another person can support or work with me.**

Acceptance criteria:

- User enters a clear goal.
- User selects Pact type.
- User selects accountability style.
- User sets check-in frequency.
- User chooses privacy settings.
- App creates a secure invitation link.

### 11.3 Accept a Pact

**As an invited partner, I want to understand the expectations before accepting.**

Acceptance criteria:

- Invitation screen shows goal, owner, role, check-in expectation, and privacy level.
- Partner can accept or decline.
- Partner cannot access Pact details before acceptance except information shown in invitation preview.

### 11.4 Submit a progress signal

**As a participant, I want to send a fast update without writing a long report.**

Acceptance criteria:

- User can choose Done, On track, Slipping, Blocked, or Need help.
- Note is optional except where the Pact requires an explanation.
- Evidence is optional unless required by the Pact.
- Partner receives an in-app update.

### 11.5 Respond as a partner

**As an accountability partner, I want to respond quickly and usefully.**

Acceptance criteria:

- Partner can select a structured response.
- Partner may add a short note.
- Owner receives the response in real time.

### 11.6 Rescue Mode

**As a user who missed a commitment, I want help recovering without abandoning the goal.**

Acceptance criteria:

- App asks why the task was missed.
- User can reduce, split, reschedule, ask for help, or remove the task.
- Revised plan is visible to relevant Pact members.
- Partner can acknowledge or approve when required.

### 11.7 Weekly review

**As a Pact member, I want a summary that shows progress and next actions.**

Acceptance criteria:

- Review shows completed, missed, recovered, and active commitments.
- Review includes top blockers.
- Users can select next-week priorities.
- Review does not shame users.

---

## 12. Accountability styles

### 12.1 Gentle

- Encouraging language
- Flexible reminders
- Missed tasks remain private unless explicitly shared

### 12.2 Supportive

- Regular check-ins
- Help requests are prioritised
- Partners are encouraged to ask questions

### 12.3 Firm

- Missed commitments are visible to permitted partners
- Explanations may be required
- Reminders are more direct

### 12.4 Competitive

- Progress comparisons are available only to Pact members
- Weekly completion scores may be shown
- No public ranking

---

## 13. Main user flows

### 13.1 New user activation

```text
Open app
  → Create account
  → Choose "Personal task" or "Create a Pact"
  → Create first commitment
  → Invite partner or continue privately
  → Enable notifications
  → See home dashboard
```

### 13.2 Pact invitation

```text
Owner creates Pact
  → App generates invite link
  → Owner shares link
  → Partner opens link
  → Partner signs in
  → Partner reviews agreement
  → Partner accepts
  → Pact becomes active
```

### 13.3 Daily check-in

```text
Reminder arrives
  → User opens check-in
  → Selects status
  → Adds note or evidence if needed
  → Submits
  → Partner receives update
  → Partner responds
```

### 13.4 Missed commitment

```text
Commitment becomes overdue
  → App asks what happened
  → User selects blocker
  → Rescue Mode opens
  → User revises plan
  → Partner reviews when required
  → Commitment returns to active state
```

### 13.5 Weekly review

```text
Review period ends
  → App generates summary
  → User confirms blockers and wins
  → Partner adds response
  → Next priorities are selected
  → New week begins
```

---

# PART C — INFORMATION ARCHITECTURE

## 14. Main navigation

Recommended bottom navigation:

1. **Home**
2. **Today**
3. **Pacts**
4. **Insights**
5. **Profile**

A central floating action button may be used for:

- Add task
- Add commitment
- Create Pact

---

## 15. Route structure

```text
/
├── landing page
├── install
├── privacy
├── terms
├── sign-in
├── sign-up
└── app
    ├── home
    ├── today
    ├── tasks
    │   ├── new
    │   └── [taskId]
    ├── pacts
    │   ├── new
    │   └── [pactId]
    │       ├── overview
    │       ├── commitments
    │       ├── members
    │       ├── review
    │       └── settings
    ├── commitments
    │   └── [commitmentId]
    ├── check-in
    │   └── [commitmentId]
    ├── rescue
    │   └── [commitmentId]
    ├── notifications
    ├── insights
    └── profile
```

---

## 16. Key screens

### 16.1 Home dashboard

Purpose:

- Show what requires attention now.
- Show Pact progress.
- Give quick access to the next meaningful action.

Recommended content:

- Greeting
- Number of commitments needing attention
- Weekly completion summary
- Active Pact cards
- Today’s top three commitments
- Floating add button

### 16.2 Today screen

- Today’s commitments
- Overdue items
- Check-ins due
- Help requests
- Completed today

### 16.3 Pact overview

- Pact title
- Participants and roles
- Pact Health
- Progress percentage
- Active commitments
- Latest check-ins
- Blockers
- Weekly review link

### 16.4 Commitment detail

- Commitment title
- Due date
- Assignee
- Current status
- Description
- Evidence requirement
- Latest check-in
- Partner responses
- Submit check-in button
- Mark complete button

### 16.5 Rescue Mode

- Missed commitment summary
- Blocker selection
- Reduce task
- Split task
- Reschedule
- Ask for help
- Remove task
- Save recovery plan

### 16.6 Insights

- Commitments completed
- Recovery rate
- Partner response rate
- Pact health history
- Weekly consistency

---

# PART D — DESIGN SYSTEM

## 17. Visual direction

The visual direction should be inspired by the supplied references without duplicating their exact layouts or artwork.

Design characteristics:

- Bold editorial typography
- Oversized numbers
- Large rounded cards
- Dark navy or black background
- Electric yellow primary accent
- Bright blue secondary accent
- Cream and white neutral cards
- Coral for attention states
- Mint for positive states
- Circular controls
- Minimal iconography
- High contrast
- Generous spacing
- Asymmetric card arrangements

Design description:

> Bold editorial productivity with neo-utility cards.

---

## 18. Colour tokens

```css
:root {
  --ink-950: #050505;
  --ink-900: #0F1521;
  --ink-800: #101B2C;
  --paper-100: #F7F7F2;
  --cream-200: #F5EFD8;
  --volt-500: #FFF768;
  --signal-blue: #1685F8;
  --coral-400: #E78965;
  --mint-300: #C9E6B8;
  --white: #FFFFFF;
  --grey-300: #D6D6D2;
  --grey-600: #707070;
}
```

### 18.1 Semantic usage

| Token | Purpose |
|---|---|
| `ink-900` | Primary dark background |
| `ink-800` | Elevated dark surface |
| `volt-500` | Primary CTA and feature cards |
| `signal-blue` | Active states, links, progress |
| `cream-200` | Neutral cards and calm surfaces |
| `coral-400` | Blocked, at-risk, attention |
| `mint-300` | On-track and positive recovery |
| `paper-100` | Light-mode background |
| `white` | High-contrast text and cards |

### 18.2 Status colours

| Status | Colour |
|---|---|
| Done | Mint |
| On track | Blue |
| Slipping | Yellow |
| Blocked | Coral |
| Need help | Coral with stronger icon treatment |
| Paused | Grey |

Do not rely on colour alone. Always add text and an icon.

---

## 19. Typography

Implemented fonts (via `next/font`):

```text
Display / brand: Syne
Body / UI: DM Sans
```

Fallback system stack:

```css
font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
  "Segoe UI", sans-serif;
```

Suggested hierarchy:

| Style | Mobile size |
|---|---:|
| Display number | 72–96 px |
| Hero title | 48–64 px |
| Page title | 40–48 px |
| Section title | 28–34 px |
| Card title | 22–28 px |
| Body | 16–18 px |
| Supporting text | 14–15 px |
| Metadata | 12–13 px |

Rules:

- Use large type only for key information.
- Keep paragraph width narrow on mobile.
- Support browser text zoom.
- Avoid thin text on bright backgrounds.

---

## 20. Shape and spacing system

### 20.1 Border radius

```text
Chip: 14 px
Button: 20–24 px
Standard card: 24–28 px
Feature card: 32–40 px
Circular control: 52–64 px
```

### 20.2 Spacing scale

```text
4 px   — micro spacing
8 px   — icon spacing
12 px  — compact spacing
16 px  — standard spacing
24 px  — card padding
32 px  — section spacing
40 px  — major separation
```

### 20.3 Touch targets

All interactive elements should provide a minimum tappable area of approximately 44 × 44 CSS pixels.

---

## 21. Component list

Build reusable components for:

- App shell
- Top navigation
- Bottom navigation
- Floating action button
- Pact card
- Commitment card
- Progress ring or shape
- Status chip
- User avatar group
- Check-in selector
- Partner response selector
- Notification card
- Weekly insight card
- Empty state
- Error state
- Skeleton loader
- Bottom sheet
- Confirmation dialog
- Evidence uploader
- Install prompt

---

## 22. Mobile interaction rules

- Primary actions should be reachable with one hand.
- Avoid tiny text links for important actions.
- Use bottom sheets for quick actions.
- Keep forms short.
- Preserve unsaved drafts locally.
- Use subtle animations to confirm actions.
- Respect reduced-motion preferences.
- Use safe-area padding for installed iPhone PWAs.

---

# PART E — TECHNICAL PLAN

## 23. Approved MVP technology stack

### 23.1 Frontend

| Area | Technology |
|---|---|
| Framework | Next.js 16 (App Router, `src/`) |
| Language | TypeScript |
| UI library | React 19 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animation | Motion |
| Forms | React Hook Form |
| Validation | Zod |
| Icons | Lucide |
| Dates | date-fns |
| Fonts | Syne (display) + DM Sans (body) |
| Client state | React state / Convex subscriptions (no Zustand yet) |
| Server data | Convex React client |
| Auth client | Better Auth React client + `@better-auth/infra` (dash, sentinel) |
| Offline drafts | IndexedDB / Dexie — **planned, not shipped** |
| PWA | Web App Manifest + Service Worker + branded icons |

### 23.2 Backend and data

| Area | Technology |
|---|---|
| Product database | **Convex** (commitments, pacts, check-ins, notifications, etc.) |
| Backend functions | Convex queries, mutations, and actions |
| Real-time updates | Convex reactive subscriptions |
| Scheduled work | Convex scheduled functions / cron jobs — **partial / planned** |
| File storage | Convex file storage — **planned for evidence** |
| Authentication | **Better Auth** on Next.js (`/api/auth/[...all]`) |
| Auth database | **Neon Postgres** (`DATABASE_URL` + `pg` Pool) — sessions/users for Better Auth only |
| Auth infrastructure | Better Auth Infrastructure: `dash()` + `sentinel()` |
| App user bridge | Better Auth session → Convex `users.ensureAppUser({ authUserId, ... })` |
| Push subscriptions | Stored in Convex — **planned** |
| Push delivery | Standards-based Web Push — **planned** |

### 23.3 Why two databases

| Store | Owns |
|---|---|
| **Neon Postgres** | Better Auth identity: users, sessions, accounts, rate limits |
| **Convex** | Pact product data and real-time collaboration |

SQLite is **not** used in production (incompatible with Vercel serverless). Local Better Auth may still use env-driven Postgres (Neon) for parity.

### 23.4 Development and delivery

| Area | Technology |
|---|---|
| Repository | GitHub (`Ashnagdarc/Pact`) |
| Project tracking | GitHub Projects and Issues |
| Design | Figma free plan |
| App hosting | **Vercel** (`pact-two-ashy.vercel.app`) |
| Convex | Convex Cloud (`grateful-crow-558`) |
| Auth DB hosting | Neon via Vercel Marketplace |
| Error tracking | Console logging first; add a free monitoring tier later if needed |
| Analytics | Internal Convex `activityEvents` first; Better Auth Infrastructure dashboard for auth |

### 23.5 Cost-control rule

Before adding any third-party service:

1. Confirm it has a usable free tier.
2. Confirm the free tier permits the intended use.
3. Document its limits.
4. Add a migration plan.
5. Avoid services that require payment details during the MVP unless essential.

Current free-tier stack: Vercel Hobby, Convex free tier, Neon free tier, Better Auth + Infrastructure.

---

## 24. Architecture overview

```text
Mobile browser / Installed PWA
        │
        ├── Next.js + React UI (Vercel)
        ├── Service worker + manifest
        ├── Better Auth client (session cookies)
        └── Convex client subscriptions
               │                    │
               │                    ▼
               │         Better Auth API (/api/auth/*)
               │                    │
               │                    ▼
               │              Neon Postgres
               │           (auth users/sessions)
               │
               ▼
         Convex backend
        ├── App users (bridged via authUserId)
        ├── Pacts / members / invitations
        ├── Commitments / check-ins / responses
        ├── Recovery plans / weekly reviews
        ├── In-app notifications
        ├── File storage (planned)
        └── Web Push delivery (planned)
```

**Security note (open work):** Convex mutations currently receive client-supplied `userId`. Next priority is verifying the Better Auth session server-side so Convex does not trust the client for authorization.

---

## 25. Suggested project structure

```text
src/app/
├── page.tsx                    # Today
├── layout.tsx
├── globals.css
├── manifest.ts
├── favicon.ico
├── install/page.tsx
├── offline/page.tsx
├── sign-in/page.tsx
├── api/auth/[...all]/route.ts  # Better Auth
├── pacts/
├── commitments/
├── rescue/
├── invite/
├── insights/
├── notifications/
├── profile/
└── new/

src/lib/
├── auth.ts                     # Better Auth + dash + sentinel
├── auth-client.ts
├── auth-server.ts
└── ...

src/components/
├── navigation/
├── cards/
├── screens/
├── pwa/
├── providers/
└── ui/

convex/
├── schema.ts
├── users.ts                    # ensureAppUser bridge
├── pacts.ts / pactMembers / invitations
├── commitments.ts
├── checkIns.ts / responses
├── recoveryPlans.ts
├── weeklyReviews.ts / insights
├── notifications.ts
├── health.ts
└── seed.ts

public/
├── icons/                      # PWA icons (branded)
└── sw.js
```

---

## 26. Initial data model

### 26.1 Users

```text
users
- _id
- authUserId
- displayName
- email
- avatarUrl
- timezone
- onboardingCompleted
- createdAt
- updatedAt
```

### 26.2 Tasks

```text
tasks
- _id
- ownerId
- title
- description
- status
- priority
- dueAt
- reminderAt
- isRecurring
- recurrenceRule
- createdAt
- updatedAt
```

### 26.3 Pacts

```text
pacts
- _id
- ownerId
- title
- description
- goalType
- accountabilityStyle
- checkInFrequency
- evidencePolicy
- privacyLevel
- healthStatus
- startAt
- targetEndAt
- status
- createdAt
- updatedAt
```

### 26.4 Pact members

```text
pactMembers
- _id
- pactId
- userId
- role
- invitationStatus
- joinedAt
- permissions
- lastActiveAt
```

### 26.5 Commitments

```text
commitments
- _id
- pactId
- creatorId
- assigneeId
- title
- description
- completionCriteria
- status
- dueAt
- reminderAt
- evidenceRequired
- createdAt
- updatedAt
- completedAt
```

### 26.6 Check-ins

```text
checkIns
- _id
- commitmentId
- userId
- signal
- note
- blockerType
- createdAt
```

### 26.7 Evidence

```text
evidence
- _id
- commitmentId
- checkInId
- uploadedBy
- storageId
- fileType
- caption
- createdAt
```

### 26.8 Partner responses

```text
partnerResponses
- _id
- checkInId
- responderId
- responseType
- note
- createdAt
```

### 26.9 Recovery plans

```text
recoveryPlans
- _id
- commitmentId
- createdBy
- blockerType
- recoveryAction
- revisedTitle
- revisedDueAt
- note
- approvalStatus
- approvedBy
- createdAt
```

### 26.10 Weekly reviews

```text
weeklyReviews
- _id
- pactId
- weekStart
- weekEnd
- completedCount
- missedCount
- recoveredCount
- topBlockers
- partnerResponseRate
- summary
- createdAt
```

### 26.11 Push subscriptions

```text
pushSubscriptions
- _id
- userId
- endpoint
- p256dh
- auth
- userAgent
- createdAt
- lastUsedAt
- revokedAt
```

### 26.12 Activity events

```text
activityEvents
- _id
- userId
- pactId
- eventName
- metadata
- createdAt
```

---

## 27. Permissions model

### 27.1 General rules

- Users can access their own profile.
- Users can access Pacts where they are active members.
- Personal tasks are private unless explicitly shared.
- Private notes are never shared by default.
- Evidence visibility follows Pact settings.
- Removed members immediately lose access.
- Invite links must expire or be revocable.
- All backend permission checks must be enforced server-side.

### 27.2 Example permission matrix

| Data | Owner | Collaborator | Accountability partner |
|---|---:|---:|---:|
| Pact title | View/Edit | View | View |
| Pact settings | View/Edit | Limited | No |
| Shared commitments | View/Edit | Assigned access | View |
| Personal private notes | View | No | No |
| Check-ins | View/Create | View/Create | View |
| Evidence | Configurable | Configurable | Configurable |
| Partner responses | View | View/Create | View/Create |
| Recovery plan | Create/Edit | Assigned access | Review |
| Member management | Yes | No | No |

---

## 28. Authentication plan

### 28.1 Status — selected and running

| Item | Decision |
|---|---|
| Provider | **Better Auth** (Next.js) |
| Auth storage | **Neon Postgres** |
| Methods live | Email + password |
| Methods optional | Google OAuth when `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` set |
| Infra plugins | `dash()` (dashboard) + `sentinel()` (abuse / PoW) |
| App identity | Convex `users` row keyed by `authUserId` |
| Production URL | `BETTER_AUTH_URL` / `NEXT_PUBLIC_SITE_URL` = deployed Vercel origin |

### 28.2 MVP requirements

- [x] Secure login
- [x] Session persistence
- [x] Logout
- [ ] Account deletion
- [x] Invite-link continuation after login (`/sign-in?next=/invite/...`)
- [ ] Convex authorization from verified Better Auth session (not client-trusted `userId`)
- [ ] Next.js middleware route protection

### 28.3 Authentication decision checklist

- [x] Provider works with Next.js.
- [x] Works alongside Convex for product data (bridge pattern).
- [x] Usable free tier (Better Auth self-hosted + Neon + Vercel).
- [x] Supports production deployment.
- [ ] Account deletion end-to-end (auth DB + Convex data).
- [x] Does not require paid SMS for MVP.
- [ ] Email delivery (verification / reset) — deferred; verification currently off.

### 28.4 Recommended next auth work

1. Stop trusting client-passed `userId` in Convex mutations.
2. Add route middleware for authenticated app pages.
3. Account deletion (Better Auth + Convex cleanup).
4. Optional: enable email verification / password reset once transactional email is configured.

---

## 29. PWA requirements

### 29.1 Installability

- [x] Valid Web App Manifest
- [x] App name and short name
- [x] 192 × 192 icon — branded handshake “P”
- [x] 512 × 512 icon
- [x] Maskable icon
- [x] Standalone display mode
- [x] Theme colour
- [x] Background colour
- [x] Start URL
- [x] Mobile viewport configuration
- [x] HTTPS deployment — Vercel

### 29.2 Service worker

Current support:

- [x] App-shell caching (basic)
- [x] Offline fallback page (`/offline`)
- [ ] Push notification handling
- [ ] Notification click handling
- [x] Controlled update behaviour (basic register)

### 29.3 Offline behaviour

Version 1 should support:

- [ ] Viewing recently loaded data where practical
- [ ] Creating task drafts offline
- [ ] Creating check-in drafts offline
- [ ] Retrying failed submissions

Shared server data remains authoritative. Online-first is acceptable until auth is secured.

### 29.4 Installation education

Provide an `/install` page that explains:

1. Open the app in Safari.
2. Tap Share.
3. Tap Add to Home Screen.
4. Open the installed app.
5. Enable notifications when prompted.

Do not show repeated installation prompts after the user dismisses them.

---

## 30. Notification specification

### 30.1 Notification principles

Notifications must be:

- Relevant
- Actionable
- Based on real commitments or partner activity
- Respectful of quiet hours
- Easy to disable
- Free from guilt-inducing language

### 30.2 Notification types

| Type | Trigger | Recipient |
|---|---|---|
| Check-in reminder | Check-in due soon | Assignee |
| Missed check-in | Check-in overdue | Assignee |
| Partner update | User submits signal | Relevant partner |
| Help request | User selects Need help | Relevant partner |
| Partner response | Partner responds | Original user |
| Evidence submitted | Evidence uploaded | Reviewer |
| Commitment due | Due date approaching | Assignee |
| Rescue prompt | Commitment becomes overdue | Assignee |
| Pact at risk | Participation falls below threshold | Pact members |
| Weekly review | Review generated | Pact members |

### 30.3 Example copy

Good:

> Frank marked “Finish portfolio homepage” as blocked. Can you help?

> Your check-in with Linda is due at 7:00 PM.

> Daniel submitted proof for today’s commitment.

> Your Pact needs attention. Two check-ins are overdue.

Avoid:

> You are failing.

> You have disappointed your partner.

> Open the app now!

### 30.4 Notification actions

Where supported:

- Mark done
- On track
- Blocked
- Ask for help
- Open commitment
- Snooze

### 30.5 Quiet hours

Users should be able to define:

- Start time
- End time
- Weekend preference
- Urgent help-request exception

---

## 31. Pact Health logic

Initial health calculation may use:

- Check-ins completed in the last seven days
- Partner responses in the last seven days
- Number of overdue commitments
- Number of unanswered help requests
- Days since last activity

Example rule-based model:

```text
Healthy
- Both sides active
- No unresolved help request
- Less than 20% overdue

Needs attention
- One missed check-in
- Response rate below target

At risk
- No activity for several days
- Multiple overdue commitments
- Unanswered help request

Paused
- Paused by owner or agreement

Completed
- Goal marked complete
```

Do not expose an unexplained score. Show the reasons behind the status.

---

## 32. Rescue Mode logic

When a commitment becomes overdue:

1. Ask what happened.
2. Capture blocker type.
3. Suggest appropriate recovery options.
4. Allow the user to revise the commitment.
5. Notify the partner when required.
6. Track whether the recovered commitment is later completed.

Blocker options:

- Ran out of time
- Task was too large
- Waiting for someone
- Priority changed
- Lost motivation
- Technical problem
- Personal emergency
- Other

Recovery actions:

- Reduce scope
- Split into smaller steps
- Reschedule
- Ask partner for help
- Pause
- Remove

---

# PART F — ANALYTICS AND VALIDATION

## 33. North Star metric

> Number of mutually active Pacts producing completed commitments each week.

A Pact is mutually active when at least two relevant participants perform a meaningful action during the week.

Meaningful actions include:

- Submit check-in
- Complete commitment
- Respond to partner
- Approve recovery plan
- Complete weekly review

---

## 34. Core metrics

### 34.1 Acquisition

- Landing-page visitors
- Waitlist sign-ups
- Invitation-link opens

### 34.2 Activation

- Account creation rate
- First task created
- First Pact created
- Partner invited
- Partner invitation accepted
- First check-in submitted

### 34.3 Engagement

- Weekly active users
- Weekly active Pacts
- Check-in completion rate
- Partner response rate
- Weekly review completion rate

### 34.4 Retention

- Day 7 user retention
- Day 30 user retention
- Seven-day Pact survival
- Thirty-day Pact survival
- Percentage of Pacts with both sides active

### 34.5 Outcome

- Commitment completion rate
- Goal completion rate
- Recovery rate
- Average time to recover after a missed commitment

### 34.6 Risk indicators

- Unanswered help requests
- Repeated notification dismissal
- Pacts with one inactive member
- Account deletion rate
- Notification opt-out rate

---

## 35. Analytics events

```text
account_created
onboarding_completed
personal_task_created
partner_invited
invitation_opened
invitation_accepted
invitation_declined
pact_created
pact_paused
pact_completed
pact_ended
commitment_created
commitment_updated
commitment_completed
commitment_missed
check_in_submitted
proof_uploaded
partner_response_sent
help_requested
rescue_mode_started
recovery_plan_created
recovery_plan_approved
weekly_review_opened
weekly_review_completed
notification_permission_requested
notification_permission_granted
notification_permission_denied
pwa_install_guide_opened
pwa_installed_signal
account_deleted
```

Only collect information needed to answer a defined product question.

---

## 36. Research plan

### 36.1 Interview participants

Target at least 15–20 early interviews across:

- Students
- Young professionals
- Freelancers or creators
- People who currently use task apps
- People who have tried accountability partnerships

### 36.2 Interview questions

Ask about actual behaviour:

1. Tell me about the last important goal you failed to complete.
2. What made it difficult?
3. What tools did you use?
4. Have you ever asked someone to hold you accountable?
5. What worked?
6. What failed?
7. What happens when your partner stops responding?
8. How do you feel when tasks become overdue?
9. What kind of reminder helps you act?
10. What would you never want an accountability partner to see?
11. Would you upload proof of progress? Under what conditions?
12. What would make you stop using an accountability app?

Avoid asking only:

> Would you use this app?

Ask users to describe past actions instead.

### 36.3 Prototype tests

Ask testers to complete:

- Create a Pact
- Invite a partner
- Accept an invitation
- Add a commitment
- Submit a check-in
- Respond to a partner
- Enter Rescue Mode
- Complete a weekly review
- Install the PWA
- Enable notifications

Measure:

- Completion success
- Time taken
- Confusion points
- Drop-off point
- Emotional reaction

---

# PART G — ROADMAP

## 37. Phase 0: Validation

- [ ] Finalise working name
- [ ] Interview 15–20 target users
- [ ] Create competitor comparison
- [ ] Validate top three problems
- [ ] Test accountability agreement concept
- [ ] Test Rescue Mode concept
- [ ] Test willingness to invite a real partner

Exit criteria:

- At least five users agree to test with a real accountability partner.
- The same core problems appear repeatedly.
- Users understand the difference between a task and a Pact.

---

## 38. Phase 1: Product and design foundation

- [ ] Finalise PRD
- [ ] Create user flows
- [ ] Create low-fidelity wireframes
- [ ] Create design tokens
- [ ] Design key mobile screens
- [ ] Build clickable prototype
- [ ] Test prototype with target users

Key screens:

- Onboarding
- Home
- Create Pact
- Invitation
- Pact overview
- Commitment detail
- Check-in
- Rescue Mode
- Weekly review

---

## 39. Phase 2: Technical foundation

- [x] Create GitHub repository
- [x] Configure Next.js and TypeScript
- [x] Configure Tailwind CSS
- [x] Configure Convex
- [x] Select authentication provider — Better Auth + Neon
- [x] Define schema — core Convex tables live
- [ ] Implement permissions — Convex still trusts client `userId`
- [x] Create app shell
- [x] Add reusable UI components

---

## 40. Phase 3: Core MVP

- [x] Authentication
- [x] User profile — basic
- [ ] Personal tasks — deferred / use solo commitments
- [x] Pact creation
- [x] Invitation links
- [x] Pact acceptance
- [x] Commitments
- [x] Check-ins
- [x] Partner responses
- [x] Real-time updates — Convex

Exit criteria:

Two users can create, accept, and use a Pact from separate devices. — **Ready to validate in private beta once Convex auth is secured.**

---

## 41. Phase 4: Retention system

- [x] Rescue Mode
- [x] Pact Health
- [x] Weekly reviews — Insights
- [x] Notification centre — in-app
- [ ] Web Push
- [ ] Quiet hours
- [ ] Evidence uploads

Exit criteria:

A Pact can survive a missed commitment and return to active progress. — **In-app loop exists; push/evidence still open.**

---

## 42. Phase 5: PWA and beta

- [x] Web App Manifest
- [x] Icons — branded
- [x] Service worker — basic
- [x] Offline fallback
- [x] Install guide
- [x] Mobile safe-area support
- [ ] Privacy policy
- [ ] Terms
- [ ] Account deletion
- [ ] Beta feedback form
- [x] Private beta deployment — Vercel production URL live

---

## 43. Phase 6: Post-beta decisions

Use actual user evidence to decide whether to build:

- Recurring commitments
- Focus timer
- Accountability circles
- Calendar integration
- Premium plan
- Native iOS or Android app

Do not commit to a native app before validating retention and willingness to pay.

---

# PART H — QA AND SECURITY

## 44. Functional QA checklist

### Authentication

- [ ] User can sign in.
- [ ] User can sign out.
- [ ] Session persists correctly.
- [ ] Invite link continues after login.
- [ ] Deleted users lose access.

### Pacts

- [ ] Pact can be created.
- [ ] Invite link works.
- [ ] Expired or revoked link fails safely.
- [ ] Partner can accept or reject.
- [ ] Removed partner loses access.

### Commitments

- [ ] Commitment can be created.
- [ ] Commitment can be edited.
- [ ] Commitment can be completed.
- [ ] Due times respect timezone.
- [ ] Overdue state is correct.

### Check-ins

- [ ] All signal types work.
- [ ] Evidence uploads correctly.
- [ ] Partner sees update in real time.
- [ ] Response reaches original user.

### Rescue Mode

- [ ] Overdue commitment can enter Rescue Mode.
- [ ] Revised plan saves correctly.
- [ ] Partner approval works when required.

### Notifications

- [ ] Permission request is contextual.
- [ ] Push subscription is saved securely.
- [ ] Notification click opens the correct screen.
- [ ] Quiet hours are respected.
- [ ] Duplicate notifications are prevented.

### PWA

- [ ] App is installable.
- [ ] App icon displays correctly.
- [ ] Standalone mode works.
- [ ] Offline fallback works.
- [ ] Service worker updates safely.

---

## 45. Accessibility checklist

- [ ] Text has sufficient contrast.
- [ ] Status is not communicated by colour alone.
- [ ] Touch targets are large enough.
- [ ] Forms have labels.
- [ ] Errors are announced clearly.
- [ ] Keyboard navigation works where relevant.
- [ ] Reduced motion is respected.
- [ ] Text zoom does not break layouts.
- [ ] Icons have accessible names.

---

## 46. Security checklist

- [ ] Server-side permission checks exist for every protected action.
- [ ] Invite tokens are random and revocable.
- [ ] Private notes are never returned to unauthorised users.
- [ ] File upload types and sizes are restricted.
- [ ] Sensitive secrets are never exposed in client code.
- [ ] Push subscriptions are protected.
- [ ] Rate limits exist for invitations and notifications.
- [ ] Account deletion removes or anonymises data according to policy.
- [ ] Logs do not expose private task content unnecessarily.

---

## 47. Privacy requirements

The privacy policy must explain:

- Data collected
- Why it is collected
- Who can see it
- How long it is retained
- How users can delete it
- How evidence uploads are handled
- How notifications work
- Whether analytics are used
- Whether data is sold

Product requirements:

- Privacy settings must be understandable.
- Personal tasks remain private by default.
- Evidence visibility must be configurable.
- Users can leave a Pact.
- Users can delete their account.

---

# PART I — LANDING PAGE

## 48. Landing-page objective

Primary objective:

> Get suitable users to join the private beta with a real accountability partner.

Primary CTA:

> Join the private beta

Secondary CTA:

> See how Pact works

---

## 49. Suggested landing-page copy

### Hero

# Finish what you promise.

Pact helps you and the people you trust make commitments, track progress, and recover together when plans change.

**Primary button:** Join the private beta  
**Secondary button:** See how it works

### Problem section

## A task list cannot hold you accountable.

You can organise every task perfectly and still postpone the work. Pact adds the missing layer: a clear commitment, a trusted person, and a plan for what happens when progress stops.

### How it works

#### Make a Pact

Agree on the goal, deadline, check-in schedule, and type of support you need.

#### Show your progress

Send a quick status, attach proof when necessary, and tell your partner when you are blocked.

#### Recover together

Turn missed commitments into realistic recovery plans instead of abandoned goals.

### Differentiators

- Accountability Agreements
- Five-second check-ins
- Pact Health
- Rescue Mode
- Weekly reviews
- Privacy controls

### Use cases

- Career growth
- Studying
- Fitness
- Savings
- Creative work
- Side projects

### Final CTA

## Important goals are easier to abandon when nobody knows about them.

Join the private beta and test Pact with someone you trust.

---

# PART J — PITCH DECK

## 50. Pitch-deck outline

### Slide 1 — Title

Pact  
Make commitments. Show your progress. Recover together.

### Slide 2 — Problem

People create plans but fail to follow through because accountability is informal, inconsistent, and poorly structured.

### Slide 3 — Current alternatives

- Task managers
- Habit trackers
- Messaging apps
- Live focus tools
- Human coaches

Explain what each alternative does not solve.

### Slide 4 — Solution

A commitment-management platform for structured accountability relationships.

### Slide 5 — Product

Show:

- Create Pact
- Check-in
- Partner response
- Rescue Mode
- Weekly review

### Slide 6 — Unique insight

Accountability partnerships fail when expectations are unclear, participation becomes one-sided, and missed commitments have no recovery process.

### Slide 7 — Target audience

Start with students, young professionals, creators, and ambitious friends.

### Slide 8 — Business model

Possible future model:

- Free personal tasks
- One free active Pact
- Premium unlimited Pacts and advanced insights

Do not finalise pricing before user validation.

### Slide 9 — Competition

Compare Pact against task managers, habit apps, accountability apps, and coaching services.

### Slide 10 — Go-to-market

Possible channels:

- University communities
- Career-transition communities
- Online learning communities
- Creator communities
- Referral loops through partner invitations

### Slide 11 — Validation

Include only real evidence:

- Interviews completed
- Beta sign-ups
- Active Pacts
- Retention
- Commitment completion

### Slide 12 — Team and ask

State:

- Who is building it
- Current capabilities
- Missing roles
- What support is needed

---

# PART K — TEAM DOCUMENT

## 51. Initial team roles

Even if one person holds several roles, responsibilities should be explicit.

| Role | Responsibility |
|---|---|
| Product owner | Vision, scope, priorities, decisions |
| UX/UI designer | Research, flows, interface, design system |
| Frontend developer | Next.js application and PWA |
| Backend developer | Convex schema, functions, permissions |
| QA owner | Test cases, regression, release sign-off |
| Growth owner | Landing page, waitlist, beta recruitment |

---

## 52. Working agreement

- Use GitHub Issues for work items.
- Every feature must reference a user story.
- Every pull request must include testing notes.
- Major technical decisions require an ADR.
- Design changes must update the design system.
- No feature is complete without empty, loading, and error states.
- No protected feature is complete without permission tests.

---

## 53. Definition of Done

A feature is complete only when:

- [ ] Requirement is documented.
- [ ] Design is approved.
- [ ] Mobile layout is implemented.
- [ ] Loading state exists.
- [ ] Empty state exists.
- [ ] Error state exists.
- [ ] Accessibility has been checked.
- [ ] Permissions are enforced server-side.
- [ ] Analytics event is added when required.
- [ ] Tests pass.
- [ ] Documentation is updated.
- [ ] Feature works in installed PWA mode.

---

# PART L — RISKS AND OPEN QUESTIONS

## 54. Main risks

| Risk | Impact | Mitigation |
|---|---|---|
| Partners stop responding | Core value weakens | Pact Health, pause, backup partner later |
| Users feel judged | Users leave | Supportive language, privacy controls, Rescue Mode |
| Too much setup | Low activation | Templates, defaults, progressive setup |
| Notification fatigue | Opt-outs | Event-based notifications, quiet hours |
| Free-tier limits | Service interruption | Usage monitoring and migration plan |
| PWA installation confusion | Lower adoption | Clear Safari installation guide |
| iOS PWA limitations | Missing native features | Design within web limits; native version later |
| Evidence privacy concerns | Trust loss | Clear permissions and deletion controls |
| Product becomes another task manager | Weak differentiation | Prioritise accountability loop over task features |

---

## 55. Open product questions

- What final product name should replace Pact, if any?
- Which first user segment has the strongest problem?
- Should one user be able to create multiple free Pacts?
- Is evidence required often enough to justify storage complexity?
- Which accountability style is most attractive?
- Should weekly reviews be generated automatically or confirmed manually?
- How quickly should Pact Health change to At risk?
- Should collaborators and accountability partners have different dashboards?
- What information should remain visible after a Pact ends?

---

## 56. Open technical questions

- [x] Which authentication provider will be used for the MVP? → **Better Auth + Neon Postgres**
- [x] Will the Next.js deployment use Vercel or another compatible host? → **Vercel**
- [ ] Which service-worker implementation will be used? → custom `/public/sw.js` today; revisit if push complexity grows
- [ ] What file-size limits will apply to evidence?
- [ ] What is the offline conflict-resolution policy?
- [ ] How will scheduled notifications be deduplicated?
- [ ] How will expired push subscriptions be cleaned up?
- [ ] How will Better Auth sessions be verified inside Convex (JWT / HTTP actions / custom provider)?

---

# PART M — DECISION LOG

## 57. Current decisions

| Decision | Status | Reason |
|---|---|---|
| Build a PWA first | Approved | Avoid Apple Developer fee and validate product first |
| Use Next.js and TypeScript | Approved | Suitable for web app, landing page, and future growth |
| Use Convex for product data | Approved | Real-time collaboration and integrated backend functions |
| Use Better Auth for authentication | Approved | Standard Next.js auth; Infrastructure dash + sentinel |
| Use Neon Postgres for auth data only | Approved | Better Auth needs SQL; SQLite fails on Vercel serverless |
| Keep Convex separate from auth DB | Approved | Clear ownership: identity vs product collaboration |
| Avoid React Native for MVP | Approved | Native distribution still creates platform costs |
| Avoid full chat in Version 1 | Approved | Reduce scope, moderation, and infrastructure needs |
| Avoid stranger matching | Approved | Start with trusted existing relationships |
| Prioritise Rescue Mode | Approved | Core differentiation and retention mechanism |
| Use bold editorial card design | Approved | Matches selected visual direction |
| Brand PWA icon (handshake P) | Approved | Distinct install identity |

---

## 58. Architecture Decision Record template

Create a separate ADR when a major technical decision is made.

```markdown
# ADR-XXX: Decision title

## Status
Proposed / Accepted / Rejected / Superseded

## Context
What problem or constraint led to this decision?

## Options considered
1. Option A
2. Option B
3. Option C

## Decision
What was selected?

## Reasons
Why was it selected?

## Consequences
What becomes easier, harder, or more limited?

## Date
YYYY-MM-DD

## Owner
Name
```

---

# PART N — IMMEDIATE NEXT ACTIONS

## 59. Build status snapshot (2026-07-21)

**Shipped:** Auth (Better Auth + Neon), Convex product core (pacts, invites, commitments, check-ins, partner responses, rescue, health, weekly insights, in-app notifications), PWA shell + branded icons, Vercel production deploy.

**Not secure yet:** Convex trusts client-supplied `userId` — must fix before real beta pairs.

## 59.1 Next ten actions (build order)

1. [ ] **Secure Convex bridge** — verify Better Auth identity in Convex; remove trust of client `userId`.
2. [ ] **Route middleware** — protect app routes; keep `/sign-in`, `/invite`, `/install` public.
3. [ ] **Two-device beta smoke test** — create pact, invite, accept, check-in, rescue on separate accounts.
4. [ ] **Partner assignment** — assign commitments to pact members (not only creator).
5. [ ] **Web Push** — `pushSubscriptions` table, SW push handler, permission UX.
6. [ ] **Reminders** — schedule/store `reminderAt` and deliver via push or in-app.
7. [ ] **Evidence uploads** — Convex file storage attached to check-ins when required.
8. [ ] **Account deletion + privacy/terms pages** — required for serious beta.
9. [ ] **Personal tasks decision** — wire `tasks` CRUD **or** formally treat solo commitments as tasks.
10. [ ] **Recruit first five beta pairs** after 1–3 are done.

## 59.2 Suggested “this week” focus

```text
Secure auth → Convex
  → Middleware
  → Two-user smoke test on production
  → Then Web Push OR partner assignment (pick based on beta feedback)
```

---

## 60. First beta success criteria

The first beta is successful when:

- At least five pairs create a Pact.
- At least 60% of accepted Pacts remain active for seven days.
- At least half of invited partners submit or respond to a check-in.
- At least one missed commitment is successfully recovered through Rescue Mode.
- Testers understand the product without a live explanation.
- Users report that Pact provides value beyond a shared to-do list.
- Authorization cannot be bypassed by spoofing another user’s Convex id.

These thresholds are initial hypotheses and should be revised after real testing.

---

# END OF DOCUMENT

## Change log

| Version | Date | Change | Owner |
|---|---|---|---|
| 0.1 | 2026-07-21 | Initial product and build blueprint | Daniel |
| 0.2 | 2026-07-21 | Stack update: Better Auth + Neon + Vercel; MVP/phase progress; next build priorities | Daniel |

