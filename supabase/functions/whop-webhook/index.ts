// Supabase Edge Function: Whop membership webhook handler
import { serve } from "https://deno.land/std@0.207.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.3";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey =
  Deno.env.get("SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "";
const webhookSecret = Deno.env.get("WHOP_WEBHOOK_SECRET") ?? "";

if (!serviceRoleKey) {
  console.error(
    "[whop-webhook] Missing SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY secret.",
  );
  throw new Error("Service role key not configured");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type MembershipStatus =
  | "active"
  | "trialing"
  | "grace"
  | "past_due"
  | "canceled"
  | "expired"
  | "unknown";

function normalizeStatus(input: string | null | undefined): MembershipStatus {
  if (!input) return "unknown";
  const value = input.toLowerCase();
  if (["active", "fulfilled"].includes(value)) return "active";
  if (["trialing", "trial"].includes(value)) return "trialing";
  if (["grace", "grace_period"].includes(value)) return "grace";
  if (["past_due", "overdue"].includes(value)) return "past_due";
  if (["cancelled", "canceled"].includes(value)) return "canceled";
  if (["expired"].includes(value)) return "expired";
  return "unknown";
}

function parseIso(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

async function findUserIdByEmail(email: string | null | undefined) {
  if (!email) return null;
  const { data, error } = await supabase.auth.admin.listUsers({
    email,
  });
  if (error) {
    console.error("[whop-webhook] Failed to list users", error);
    return null;
  }
  const user = data?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  return user?.id ?? null;
}

function getHeaderInsensitive(req: Request, name: string) {
  for (const [k, v] of req.headers.entries()) {
    if (k.toLowerCase() === name.toLowerCase()) return v;
  }
  return null;
}

async function verifySignature(body: string, req: Request) {
  if (!webhookSecret) {
    console.warn("[whop-webhook] WHOP_WEBHOOK_SECRET not set, skipping signature verification.");
    return true;
  }

  const possible = [
    getHeaderInsensitive(req, "Whop-Signature"),
    getHeaderInsensitive(req, "X-Whop-Signature"),
    getHeaderInsensitive(req, "Webhook-Secret"),
    getHeaderInsensitive(req, "Whop-Webhook-Secret"),
    getHeaderInsensitive(req, "Whop-Secret"),
    (() => {
      const auth = getHeaderInsensitive(req, "Authorization");
      if (!auth) return null;
      const m = auth.match(/^Bearer\s+(.+)$/i);
      return m ? m[1] : null;
    })(),
  ].filter(Boolean) as string[];

  const signature = possible[0] ?? null;
  if (!signature) {
    console.error("[whop-webhook] Missing signature header");
    return false;
  }

  if (signature === webhookSecret) {
    return true;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const signatureBytes = Uint8Array.from(
    signature.replace(/^sha256=/, "").match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? [],
  );
  if (signatureBytes.length === 0) return false;

  return await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(body));
}

function extractMembership(payload: Record<string, unknown>) {
  if (!payload) return null;
  if (payload["membership"]) return payload["membership"] as Record<string, unknown>;
  if (payload["data"]) {
    const data = payload["data"] as Record<string, unknown>;
    if (data?.["membership"]) return data["membership"] as Record<string, unknown>;
    if (data?.["app_membership"]) return data["app_membership"] as Record<string, unknown>;
    if (data?.["resource"]) return data["resource"] as Record<string, unknown>;
    if (data?.["object"]) return data["object"] as Record<string, unknown>;
    return data;
  }
  return payload;
}

function getString(record: Record<string, unknown>, ...keys: string[]) {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return null;
}

serve(async (request) => {
  try {
    const rawBody = await request.text();
    if (!(await verifySignature(rawBody, request))) {
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const membership = extractMembership(event) ?? {};

    const whopMembershipId =
      getString(membership, "id", "membership_id", "resource_id") ?? "";
    if (!whopMembershipId) {
      console.warn("[whop-webhook] Missing membership id; skipping upsert", {
        action: getString(event as Record<string, unknown>, "action", "event"),
      });
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const email =
      getString(
        membership,
        "user_email",
        "email",
        "customer_email",
        "member_email",
      ) ??
      getString(
        (membership["user"] as Record<string, unknown>) ?? {},
        "email",
      );

    const actionName = getString(
      event as Record<string, unknown>,
      "action",
      "event",
      "type",
      "event_type",
      "topic",
      "name",
    );
    let status = normalizeStatus(
      getString(
        membership,
        "status",
        "state",
        "access_status",
        "accessState",
        "access_state",
        "access",
      ),
    );
    if (status === "unknown") {
      const action = actionName?.toLowerCase() ?? "";
      // Map common Whop v2 actions to internal statuses
      if (
        [
          "membership.went_valid",
          "app_membership.went_valid",
          "membership_activated",
          "membership.valid",
          "app_membership.valid",
          "payment.succeeded",
          "payment_successful",
          "invoice.paid",
        ].includes(action)
      ) {
        status = "active";
      } else if (
        [
          "membership.deactivated",
          "app_membership.deactivated",
          "membership_cancelled",
          "membership.canceled",
          "membership.invalid",
          "app_membership.invalid",
        ].includes(action)
      ) {
        status = "canceled";
      } else if (
        ["membership.expired", "app_membership.expired"].includes(action)
      ) {
        status = "expired";
      } else if (
        [
          "membership.past_due",
          "app_membership.past_due",
          "payment_overdue",
        ].includes(action)
      ) {
        status = "past_due";
      }
    }

    const { data: existingMembership, error: existingFetchError } = await supabase
      .from("whop_memberships")
      .select(
        "status,email,plan_id,plan_name,entitlement_id,entitlement_name,current_period_start,current_period_end,cancelled_at,user_id",
      )
      .eq("whop_membership_id", whopMembershipId)
      .maybeSingle();

    if (existingFetchError) {
      console.error(
        "[whop-webhook] Failed to fetch existing membership",
        existingFetchError,
      );
    }

    if (status === "unknown" && existingMembership?.status) {
      status = existingMembership.status as MembershipStatus;
    }

    const resolvedEmail = email ?? existingMembership?.email ?? "";

    let userId: string | null = null;
    if (resolvedEmail) {
      userId = await findUserIdByEmail(resolvedEmail);
    }
    if (!userId && existingMembership?.user_id) {
      userId = existingMembership.user_id;
    }

    const planId = getString(membership, "plan_id");
    const planName = getString(membership, "plan_name", "plan_title");
    const entitlementId = getString(membership, "entitlement_id");
    const entitlementName = getString(
      membership,
      "entitlement_name",
      "entitlement_title",
    );

    const currentPeriodStartRaw = getString(
      membership,
      "current_period_start",
      "period_start",
      "access_start",
    );
    let currentPeriodStart = existingMembership?.current_period_start ?? null;
    if (currentPeriodStartRaw !== null) {
      currentPeriodStart = parseIso(currentPeriodStartRaw);
    }

    const currentPeriodEndRaw = getString(
      membership,
      "current_period_end",
      "period_end",
      "access_end",
    );
    let currentPeriodEnd = existingMembership?.current_period_end ?? null;
    if (currentPeriodEndRaw !== null) {
      currentPeriodEnd = parseIso(currentPeriodEndRaw);
    }

    const cancelledAtRaw = getString(
      membership,
      "cancelled_at",
      "cancel_at",
    );
    let cancelledAt = existingMembership?.cancelled_at ?? null;
    if (cancelledAtRaw !== null) {
      cancelledAt = parseIso(cancelledAtRaw);
    }

    // Minimal diagnostics to aid troubleshooting in Supabase Logs/Invocations
    console.log("[whop-webhook] event payload", {
      action: actionName,
      whopMembershipId,
      email: resolvedEmail || null,
      status,
    });

    const record = {
      whop_membership_id: whopMembershipId,
      email: resolvedEmail,
      status,
      user_id: userId,
      plan_id: planId ?? existingMembership?.plan_id ?? null,
      plan_name: planName ?? existingMembership?.plan_name ?? null,
      entitlement_id: entitlementId ?? existingMembership?.entitlement_id ?? null,
      entitlement_name:
        entitlementName ?? existingMembership?.entitlement_name ?? null,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      cancelled_at: cancelledAt,
      last_event_id:
        getString(event, "id", "event_id") ??
        crypto.randomUUID(),
      raw_payload: event,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("whop_memberships")
      .upsert(record, { onConflict: "whop_membership_id" });

    if (error) {
      console.error("[whop-webhook] Upsert failed", error);
      return new Response("Upsert failed", { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[whop-webhook] Unexpected error", error);
    return new Response("Server error", { status: 500 });
  }
});
