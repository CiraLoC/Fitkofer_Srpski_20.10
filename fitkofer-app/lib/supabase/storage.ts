import { supabase } from '@/lib/supabase/client';
import type { DailyLog, GeneratedPlan, UserProfile } from '@/types';

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
  date: string;
  log: DailyLog | null;
};

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('profile')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  const row = data as ProfileRow | null;
  return row?.profile ?? null;
}

export async function upsertProfile(userId: string, profile: UserProfile) {
  const { error } = await supabase.from('user_profiles').upsert(
    {
      user_id: userId,
      profile,
    },
    {
      onConflict: 'user_id',
    },
  );
  if (error) throw error;
}

export async function fetchPlan(userId: string) {
  const { data, error } = await supabase
    .from('user_plans')
    .select('plan')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  const row = data as PlanRow | null;
  return row?.plan ?? null;
}

export async function upsertPlan(userId: string, plan: GeneratedPlan) {
  const { error } = await supabase.from('user_plans').upsert(
    {
      user_id: userId,
      plan,
    },
    {
      onConflict: 'user_id',
    },
  );
  if (error) throw error;
}

export async function deletePlan(userId: string) {
  const { error } = await supabase.from('user_plans').delete().eq('user_id', userId);
  if (error) throw error;
  const { error: logsError } = await supabase.from('daily_logs').delete().eq('user_id', userId);
  if (logsError) throw logsError;
}

export async function deleteProfile(userId: string) {
  const { error } = await supabase.from('user_profiles').delete().eq('user_id', userId);
  if (error) throw error;
}

export async function fetchLogs(userId: string) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('date, log')
    .eq('user_id', userId);

  if (error) throw error;
  const rows = (data as LogRow[]) ?? [];
  return (
    rows.reduce<Record<string, DailyLog>>((acc, row) => {
      if (row.log) {
        acc[row.date] = row.log;
      }
      return acc;
    }, {}) ?? {}
  );
}

export async function upsertDailyLog(userId: string, log: DailyLog) {
  const { error } = await supabase.from('daily_logs').upsert(
    {
      user_id: userId,
      date: log.date,
      log,
    },
    {
      onConflict: 'user_id,date',
    },
  );
  if (error) throw error;
}
