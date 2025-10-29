# Whop Integration Checklist

End-to-end steps to wire the Expo app, Supabase, and Whop together. Start from the repository root (`Fitkofer_Srpski_20.10`), follow the sections in order, and keep the same values everywhere.

---

## 1. Expo client environment

```powershell
cd fitkofer-app
Copy-Item .env.example .env -Force    # or .env.local if you prefer
```

Fill the `.env` file with values from Supabase and Whop:

| Variable                        | Source                                                     | Notes                                            |
| ------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `EXPO_PUBLIC_SUPABASE_URL`      | Supabase - Settings - Configuration - Project URL          | Format `https://<project-ref>.supabase.co`.      |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase - Settings - API - Project API keys - anon public | Required for the mobile client.                  |
| `EXPO_PUBLIC_WHOP_CHECKOUT_URL` | Whop - Products - Checkout link                            | Opens when a user needs to activate membership.  |
| `EXPO_PUBLIC_SUPPORT_EMAIL`     | Fitkofer support mailbox                                   | Displayed in the "Treba ti pomoc?" link.         |
| Optional (`Sentry`, `PostHog`)  | Sentry and PostHog dashboards                              | Leave blank to disable each integration locally. |

> Keep the service role key out of `.env`; store it in an untracked `.env.local` for local scripts only.

---

## 2. Supabase project secrets

```powershell
cd ..\supabase
supabase login                         # once per machine
supabase link --project-ref mfxbbntyyubyixymugfi
```

Set the secrets required by the Edge Function (`whop-webhook`):

```powershell
supabase secrets set `
  SUPABASE_URL=https://mfxbbntyyubyixymugfi.supabase.co `
  SUPABASE_SERVICE_ROLE_KEY=<service-role-key> `
  WHOP_WEBHOOK_SECRET=<shared-webhook-secret>
```

Use the same `WHOP_WEBHOOK_SECRET` in Whop (see Section 3).

Deploy or redeploy the webhook handler:

```powershell
supabase functions deploy whop-webhook --project-ref mfxbbntyyubyixymugfi
```

After deployment the function URL is `https://mfxbbntyyubyixymugfi.functions.supabase.co/whop-webhook`.

---

## 3. Whop dashboard setup

1. Open **Whop Admin > Developers > Webhooks**.
2. Add a webhook with:
   - URL: `https://mfxbbntyyubyixymugfi.functions.supabase.co/whop-webhook`
   - Secret: the same value used for `WHOP_WEBHOOK_SECRET`
   - Events: include membership created, updated, canceled, and any other lifecycle events you depend on.
3. Save the webhook and note the webhook identifier (helpful when checking logs).

---

## 4. Optional: local script access

To run `npm run seed:content` locally, create `fitkofer-app\.env.local` (ignored by git) and add:

```
SUPABASE_SERVICE_URL=https://mfxbbntyyubyixymugfi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Do not expose this file in Expo or EAS builds.

---

## 5. Verify the webhook end-to-end

After Whop sends an event, confirm it reaches Supabase:

```powershell
supabase functions logs whop-webhook --project-ref mfxbbntyyubyixymugfi
```

To manually replay a payload, craft `sample-whop-event.json`, calculate the signature, and send it:

```powershell
$Body = Get-Content .\sample-whop-event.json -Raw
$Secret = "<shared-webhook-secret>"
$Signature = $(echo -n $Body | openssl dgst -sha256 -hmac $Secret | ForEach-Object { $_.Split("= ")[1] })
Invoke-WebRequest `
  -Uri "https://mfxbbntyyubyixymugfi.functions.supabase.co/whop-webhook" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json"; "Whop-Signature" = "sha256=$Signature" } `
  -Body $Body
```

Finally, check that the membership was recorded:

```sql
select whop_membership_id, email, status, current_period_end, updated_at
from public.whop_memberships
order by updated_at desc
limit 20;
```

---

Following this checklist keeps the Expo app, Supabase Edge Function, and Whop in sync so memberships unlock content correctly.
