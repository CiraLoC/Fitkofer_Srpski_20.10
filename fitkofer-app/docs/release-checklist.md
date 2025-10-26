# Fitkofer Release Checklist

Use this checklist for every mobile release (staging and production). Duplicate the list in your release issue and check items off as you go.

## Pre-flight

- [ ] Confirm feature branch merged into `main` and CI (lint + format) is green.
- [ ] Update `CHANGELOG.md` / release notes draft.
- [ ] Verify Supabase migrations are applied to staging.
- [ ] Ensure environment secrets (Supabase, Sentry) match target environment.
- [ ] Run `npm install` to ensure lockfile is current.

## Quality gate

- [ ] `npm run lint`
- [ ] `npm run format:check`
- [ ] `npm test` (add relevant suites when available)
- [ ] Smoke test app locally:
  - [ ] Onboarding → Plan preview → Dashboard
  - [ ] Nutrition tab (meal toggles + swaps)
  - [ ] Planner reminders
- [ ] Manually review recent crash logs in Sentry (staging/production as appropriate).

## Build

- [ ] Ensure Expo/EAS credentials are up-to-date (build profiles).
- [ ] Trigger staging build: `eas build --profile staging --platform all`
- [ ] Validate staging build on physical devices (iOS + Android).
- [ ] For production, bump version (`app.json` / config) and tag release (`git tag vX.Y.Z`).
- [ ] Trigger production build: `eas build --profile production --platform all`
- [ ] Submit to stores (when applicable); update Whop binary if distributing via sideload.

## Deploy & Post-release

- [ ] Flip feature flags or config toggles to production values.
- [ ] Announce release (Slack/Email/Whop post).
- [ ] Monitor analytics & crash reports for 24h.
- [ ] Archive release artifacts (build IDs, changelog link, Supabase migration hash).
- [ ] Retro: note follow-ups or process improvements.
