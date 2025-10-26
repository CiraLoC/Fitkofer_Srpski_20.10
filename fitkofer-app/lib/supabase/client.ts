import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const manifest2Extra = (
  Constants as unknown as { manifest2?: { extra?: Record<string, unknown> } }
)?.manifest2?.extra;

const extraConfig =
  Constants.expoConfig?.extra ??
  (Constants.manifest as { extra?: Record<string, unknown> } | null | undefined)
    ?.extra ??
  manifest2Extra;

const supabaseUrl =
  (extraConfig?.supabaseUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  (extraConfig?.supabaseAnonKey as string | undefined) ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
  auth: {
    storage: Platform.OS === "web" ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type SupabaseClient = typeof supabase;
