import { supabase } from "@/lib/supabase/client";
import type {
  DailyLog,
  GeneratedPlan,
  MembershipStatus,
  MembershipSummary,
  UserProfile,
} from "@/types";

type ProfileRow = {
  user_id: string;
  profile: UserProfile | null;
};

type PlanRow = {
  user_id: string;
  plan: GeneratedPlan | null;
};

type LogRow = {
  user_id: string;
  log_date: string;
  log: DailyLog | null;
};

type MembershipRow = {
  status: MembershipStatus;
  current_period_end: string | null;
  updated_at: string | null;
};

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("profile")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  const row = data as ProfileRow | null;
  return row?.profile ?? null;
}

export async function upsertProfile(userId: string, profile: UserProfile) {
  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      profile,
    },
    {
      onConflict: "user_id",
    },
  );
  if (error) throw error;
}

export async function fetchPlan(userId: string) {
  const { data, error } = await supabase
    .from("user_plans")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  const row = data as PlanRow | null;
  return row?.plan ?? null;
}

export async function upsertPlan(userId: string, plan: GeneratedPlan) {
  const { error } = await supabase.from("user_plans").upsert(
    {
      user_id: userId,
      plan,
    },
    {
      onConflict: "user_id",
    },
  );
  if (error) throw error;
}

export async function deletePlan(userId: string) {
  const { error } = await supabase
    .from("user_plans")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
  const { error: logsError } = await supabase
    .from("daily_logs")
    .delete()
    .eq("user_id", userId);
  if (logsError) throw logsError;
}

export async function deleteProfile(userId: string) {
  const { error } = await supabase
    .from("user_profiles")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}

export async function fetchLogs(userId: string) {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("log_date, log")
    .eq("user_id", userId);

  if (error) throw error;
  const rows = (data as LogRow[]) ?? [];
  return (
    rows.reduce<Record<string, DailyLog>>((acc, row) => {
      if (row.log) {
        const logDate = row.log.date ?? row.log_date;
        acc[logDate] = { ...row.log, date: logDate };
      }
      return acc;
    }, {}) ?? {}
  );
}

export async function upsertDailyLog(userId: string, log: DailyLog) {
  const { error } = await supabase.from("daily_logs").upsert(
    {
      user_id: userId,
      log_date: log.date,
      log,
    },
    {
      onConflict: "user_id,log_date",
    },
  );
  if (error) throw error;
}

export async function fetchMembership(): Promise<MembershipSummary> {
  const { data, error } = await supabase.rpc("get_membership_status");
  if (error) throw error;
  const row = (data as MembershipRow[] | null)?.[0];
  if (!row) {
    return {
      status: "inactive",
      currentPeriodEnd: null,
      updatedAt: null,
    };
  }
  return {
    status: row.status ?? "inactive",
    currentPeriodEnd: row.current_period_end,
    updatedAt: row.updated_at,
  };
}

export async function claimMembership(email: string) {
  const trimmed = email.trim();
  if (!trimmed) return;
  const { error } = await supabase.rpc("claim_membership", {
    v_email: trimmed,
  });
  if (error) throw error;
}
