# Environment Configuration

All runtime credentials are injected via environment variables. Use `.env.local` for local development and Expo/EAS secret stores for remote builds.

## Variables by environment

| Variable                        | Development (.env.local)            | Staging (EAS)                  | Production (EAS)                | Notes                                                    |
| ------------------------------- | ----------------------------------- | ------------------------------ | ------------------------------- | -------------------------------------------------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Supabase project URL (dev)          | Supabase project URL (staging) | Supabase project URL (prod)     | Must match the Supabase instance the client should hit.  |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Dev anon key                        | Staging anon key               | Prod anon key                   | Regenerate via Supabase dashboard if rotated.            |
| `EXPO_PUBLIC_SENTRY_DSN`        | Optional                            | Sentry DSN (staging project)   | Sentry DSN (production project) | Leave blank to disable remote crash capture.             |
| `SENTRY_ORG`                    | (optional) Sentry org slug          | Sentry org slug                | Sentry org slug                 | Required for bundler symbol upload when DSN enabled.     |
| `SENTRY_PROJECT`                | (optional) Sentry project key       | Staging project key            | Production project key          | Matches DSN project.                                     |
| `SENTRY_URL`                    | Default (`https://sentry.io/`)      | Custom URL if self-hosted      | Custom URL if self-hosted       | Only override when using self-hosted Sentry.             |
| `EXPO_PUBLIC_POSTHOG_KEY`       | Optional                            | PostHog project API key        | PostHog project API key         | Enables analytics capture; leave blank to disable.       |
| `EXPO_PUBLIC_POSTHOG_HOST`      | Default (`https://app.posthog.com`) | Custom PostHog host            | Custom PostHog host             | Only set when using a self-hosted PostHog instance.      |
| `EXPO_PUBLIC_WHOP_CHECKOUT_URL` | Whop checkout URL for testing       | Whop checkout URL              | Production Whop checkout URL    | Opened when users need to activate membership.           |
| `EXPO_PUBLIC_SUPPORT_EMAIL`     | Optional support email              | Support email                  | Support email                   | Shown in membership help links (fallback text if empty). |

> Tip: keep `.env.local` out of source control. The repo already ignores `.env*`.

### Server-side / tooling secrets

These are not consumed by the Expo client, but you will need them when configuring webhooks or running scripts:

- `WHOP_WEBHOOK_SECRET` – set in Supabase Edge Function (`whop-webhook`) environment to verify incoming Whop events.
- `SUPABASE_SERVICE_ROLE_KEY` – required locally when running `npm run seed:content`; never embed this in the client.
- `SUPABASE_SERVICE_URL` – same as `EXPO_PUBLIC_SUPABASE_URL`, used alongside the service key for scripts.

## Fetching secrets from the vault

Secrets are stored in the team password manager under `Vault / Fitkofer / Environment`. Each entry is named `fitkofer-{env}` with the environment suffix (`dev`, `staging`, `prod`).

### 1Password desktop / web

1. Open the **Fitkofer** vault.
2. Select the item for the environment you need (for example `fitkofer-dev`).
3. Copy each field and paste it into your `.env.local`, or add it as an EAS secret using:
   ```bash
   eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "<value>"
   ```
4. Repeat for every variable in the table above.

### 1Password CLI (optional)

```bash
op read "op://Fitkofer/fitkofer-dev/EXPO_PUBLIC_SUPABASE_URL"
```

Swap `fitkofer-dev` with `fitkofer-staging` or `fitkofer-prod` as needed. Use the CLI when scripting CI jobs or refreshing local configs.

## Applying changes

1. Update your local `.env.local` (or `.env`) file.
2. Restart the Expo dev server so `app.config.ts` picks up the new values.
3. For EAS builds, update the secrets via `eas secret:create --scope <project>` or the Expo dashboard before triggering a new build.

Document any rotations in the vault entry notes to keep the rest of the team in sync.
