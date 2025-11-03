# Fitkofer Product Blueprint (Serbian Market)

Version: 1.2 (updated after Whop integration)
Owner: Marko (solo founder)
Audience: product, engineering, content, operations
App language: Serbian (latinica)
Platforms: Expo (iOS, Android). Responsive web planned after mobile launch.

---

## 1. Product Vision

Fitkofer helps women in Serbia achieve sustainable recomposition and wellbeing through one guided program that adapts training, nutrition, and daily habits to their context. The product must feel premium, reliable, and simple for a non-technical solo founder to operate.

**North-star metric:** percent of paying members who complete 60%+ of prescribed workouts, meals, and habits during a four-week block.

**End goal:** Launch Fitkofer as a gated membership product on Whop with automated onboarding, personalized plans, and daily accountability accessible from the app.

---

## 2. Target Users and Personas

- Women 18–45, beginners to intermediate, living in Serbia.
- Two main contexts: home workouts (minimal equipment) and gym access.
- Common constraints: limited time, metabolic conditions (IR, Hashimoto, PCOS), stress and sleep issues.

**Core personas**
1. **Busy mom (31)** – trains at home 3x per week, wants fat loss without burnout.
2. **Student (22)** – mixes gym and dorm cooking, focuses on shaping muscles.
3. **IT professional (28)** – high stress, wants structure with breathing/NSDR support.

---

## 3. Current Product Snapshot (October 2025)

### Delivered in Phase 1
- Supabase schema for profiles, plans, daily logs with row-level security.
- Onboarding flow that captures profile data and generates personalized training/nutrition plan.
- Daily log storage (workouts, meals, habits) with log_date fix applied.
- Content seeding scripts for exercises, meals, and habits.
- App UX in Serbian, including dashboard, planner, plan preview, profile management.

### Delivered in Phase 2
- Whop membership schema and RLS gating across plans/logs.
- Edge Function `whop-webhook` that verifies Whop events, writes membership rows, and links users by email.
- Client-side membership checks (redirect to membership-required screen, claim_membership RPC, status refresh button, sign-out escape).
- Manual operations guide for Supabase secrets, Whop webhook setup, and seed scripts.

### Outstanding for Phase 2 sign-off
- Confirm Whop membership row always binds to Supabase user_id (now available via claim_membership).
- End-to-end QA for multiple membership lifecycles: went_valid, canceled, expired, past_due.
- Finalize membership-required copy and support link once support email is confirmed.

---

## 4. Experience Flow (live product)

1. **Activation via Whop**
   - Prospect purchases the Fitkofer product on Whop (web checkout).
   - Whop sends membership webhook to Supabase Edge Function, setting status active/trialing.

2. **Account creation in the app**
   - User signs up with email/password (must match Whop email for instant unlock).
   - App calls `claim_membership(email)` to attach the Supabase auth user to the membership row.

3. **Onboarding questionnaire**
   - Required inputs: age, height, weight, goal, activity level, equipment location & items, training frequency, diet preference.
   - Optional inputs: allergies, disliked foods, health conditions, sleep hours, stress level, menstrual cycle info.

4. **Plan generation**
   - Training plan algorithm selects suitable split (2–5 days) with structured progression.
   - Nutrition plan generates calorie-rotation (low/mid/high days) with macronutrient targets and meal templates.
   - Habits plan surfaces daily focus items (water, sleep hygiene, NSDR, steps).

5. **Daily usage**
   - Dashboard shows today’s workouts, meals, habits, and adherence score.
   - Planner tab displays monthly calendar with scheduled workouts and habit streaks.
   - Workout/Nutrition tabs constrain access when membership status drops below active/trialing/grace.
   - Profile screen provides membership status, plan snapshots, and onboarding redo/reset.

6. **Membership lifecycle**
   - Webhook updates membership status on Whop events (went_valid, deactivated, expired, payment issues).
   - App reacts to status changes: if membership becomes inactive, access is revoked and user is routed to membership-required screen.

---

## 5. Functional Requirements

### 5.1 Authentication & Membership Gating
- Email/password auth via Supabase; magic links for recovery (pending).
- Membership status retrieved through `get_membership_status` RPC.
- App must display membership-required screen when status is not active/trialing/grace or current_period_end has passed.
- Membership screen includes checkout link, refresh, support contact, and explicit sign-out.
- Daily plan access, plan generation, and log writes are allowed only for active members (enforced by RLS).

### 5.2 Onboarding & Plan Generation
- Onboarding form validation in Serbian copy; prevents invalid ranges (13 ≤ age ≤ 100, etc.).
- Plan generator stores JSON snapshots in `user_plans` table with subscription tier, start/end dates, profile history.
- Generated plan includes:
  - Weekly workout schedule for selected frequency.
  - Daily meal structure with calorie targets and sample meals.
  - Habit checklist aligned to user constraints.

### 5.3 Daily Logs & Tracking
- `daily_logs` table stores per-day JSON payload plus extracted columns (energy, workouts_completed, etc.).
- App actions (mark workout/meal/habit, set energy level) update Supabase immediately.
- Reset plan clears user_plans and user_profiles, and removes relevant logs.

### 5.4 Content Management
- Exercises, recipes, and habits stored in Supabase tables seeded from JSON.
- Content shipping script `npm run seed:content` (requires `.env.local` with service role).
- Future roadmap: admin interface or simple Supabase dashboard updates.

---

## 6. Technical Architecture

- **Client:** Expo React Native (TypeScript), using expo-router navigation and AsyncStorage for local flags.
- **State:** Custom AppState context wrapping Supabase client, handles hydration, membership refresh, logging actions.
- **Backend:** Supabase Postgres with Row Level Security, edge functions for webhooks, SQL for plan/membership logic.
- **Integrations:**
  - Supabase Edge Function `whop-webhook` (no JWT verification, uses HMAC signature).
  - Whop membership product (checkout URL stored in env, webhook secret stored as Supabase secret).
  - Planned: Expo Notifications, HealthKit/Google Fit read-only (Phase 3).
- **Analytics:** Placeholder analytics module; actual provider (PostHog/Firebase) to be wired in Phase 3.

---

## 7. Environment & Operations

### 7.1 Environment Variables (client)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_WHOP_CHECKOUT_URL`
- `EXPO_PUBLIC_SUPPORT_EMAIL`
- (Optional) analytics/crash reporting keys

### 7.2 Supabase Secrets (edge runtime)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WHOP_WEBHOOK_SECRET`

### 7.3 Deploying the webhook
```powershell
cd C:\PythonProjects\Fitkofer_Srpski_20.10\supabase
supabase functions deploy whop-webhook --project-ref mfxbbntyyubyixymugfi
```

### 7.4 Manual QA checklist after each deployment
- Fire a real Whop checkout (or resend event) → status should become active in `whop_memberships`.
- Log into app with same email → tap “Osvezi status” → membership_required screen disappears.
- Complete onboarding → `user_profiles`, `user_plans`, `daily_logs` rows appear.
- Sign out and back in → dashboard loads with today’s plan.
- Cancel membership on Whop → webhook sets status canceled → app routes to membership-required screen.

---

## 8. Roadmap and Phases

### Phase 1 (Complete)
- App onboarding, plan generation, daily tracker, Supabase schema, RLS for core tables.
- Content seed and log_date fix.

### Phase 2 (In progress; targeted for Whop launch readiness)
1. Whop membership wiring (DONE)
2. Membership QA & error handling (ongoing)
3. Support/operational docs (in project wiki)
4. Pre-launch checklist: seed production content, finalize copy, smoke tests on iOS/Android builds

### Phase 3 (Product completion)
- Analytics & crash reporting (decide provider, add minimal events already listed in Section 10).
- Notifications (daily reminders, onboarding nudges).
- Health data import (optional read-only step count/energy).
- Lightweight CMS option for editing recipes/exercises.

### Phase 4 (Quality & Launch Ops)
- Beta with 5–10 early members, gather adherence data.
- Marketing site & checkout funnel optimization (Whop landing, email automation).
- Prepare ASO for App Store/Play Store if moving beyond Whop distribution.

---

## 9. Analytics & Telemetry (planned)

Events to capture once analytics provider is selected:
- `onboarding_started`, `onboarding_completed`
- `plan_generated` (days_per_week, location)
- `membership_refresh` (status, source=webhook|app)
- `workout_completed`, `meal_logged`, `habit_checked`
- `energy_logged`
- `membership_status_change` (old_status, new_status)
- `plan_reset`

Crash reporting: prefer Sentry or Expo Crash Reporting; scope to be defined before Phase 3.

---

## 10. Success Metrics

- D7 activation: ≥40% of new members complete at least 1 workout + 3 habits + 1 day of meal logging.
- Four-week adherence: ≥60% tasks completed for paying members.
- Monthly retention: ≥25% of members remain active after month one.
- Webhook reliability: ≥99% of Whop events processed within 30 seconds (monitored via Supabase function logs).

---

## 11. Open Questions & Decisions Needed

1. **Checkout positioning:** confirm Whop product copy and ensure app CTA matches.
2. **Support operations:** finalize support email SLA and escalation flow.
3. **Analytics provider:** choose PostHog vs Firebase vs Mixpanel before Phase 3.
4. **Plan adjustments:** decide whether members can regenerate plan mid-cycle or require manual approval.
5. **Distribution roadmap:** clarify timing for native app store launch vs staying Whop-only initially.

---

## 12. Appendix: Quick Recovery Procedures

- **Webhook 401 errors:** usually secret mismatch. Update `WHOP_WEBHOOK_SECRET` in Supabase, paste same value in Whop, redeploy function.
- **Membership stuck in unknown:** check Supabase Invocations; if only payment events arrived, wait for `membership.went_valid` or rerun from Whop → Recent deliveries.
- **Manual override:** to unblock a member, run `update public.whop_memberships set status='active', current_period_end=now()+interval '30 days' where email ilike 'user@email.com';` and then `select claim_membership('user@email.com');`.
- **Plan reset:** from Profile tab tap “Reset plan”; Supabase deletes plan/profile/logs. Use only once membership status is healthy.

---

## 13. Contact & Ownership

- Product + Operations: Marko
- Engineering support (current cycle): Codex assistant + external collaborators
- Design/copy: existing brand kit with warm terracotta palette (see original assets)
- Content: founder-curated exercises/recipes in Supabase tables

This document reflects the state of the product after completing Whop membership integration. Update it at the end of each major phase to keep stakeholders aligned.

