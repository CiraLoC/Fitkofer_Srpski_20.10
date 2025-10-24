import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { createMonthlyCalendar } from '@/lib/calendar/month';
import type {
  AppActions,
  AppState,
  AppStateContextValue,
  DailyLog,
  GeneratedPlan,
  PlanSubscriptionTier,
  SyncStatus,
  StressLevel,
  UserProfile,
} from '@/types';
import { supabase } from '@/lib/supabase/client';
import {
  deletePlan,
  deleteProfile,
  fetchLogs,
  fetchPlan,
  fetchProfile,
  upsertDailyLog,
  upsertPlan,
  upsertProfile,
} from '@/lib/supabase/storage';

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

const initialState: AppState = {
  profile: null,
  plan: null,
  logs: {},
};

const ONBOARDING_FLAG_BASE = 'fitkofer:onboardingCompleted';
const MS_IN_DAY = 1000 * 60 * 60 * 24;

type Action =
  | { type: 'SET_PROFILE'; payload: UserProfile }
  | { type: 'SET_PLAN'; payload: GeneratedPlan }
  | { type: 'RESET' }
  | { type: 'UPSERT_LOG'; payload: DailyLog }
  | { type: 'HYDRATE'; payload: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    case 'SET_PLAN':
      return { ...state, plan: action.payload };
    case 'RESET':
      return initialState;
    case 'UPSERT_LOG': {
      return {
        ...state,
        logs: {
          ...state.logs,
          [action.payload.date]: action.payload,
        },
      };
    }
    case 'HYDRATE':
      return action.payload;
    default:
      return state;
  }
}

function ensureLog(logs: Record<string, DailyLog>, date: string): DailyLog {
  return (
    logs[date] ?? {
      date,
      workoutsCompleted: [],
      mealsCompleted: [],
      habitsCompleted: [],
    }
  );
}

function normalizePlan(plan: GeneratedPlan | null, profile: UserProfile | null): GeneratedPlan | null {
  if (!plan) return null;

  const subscriptionStart = plan.subscriptionStart ?? plan.createdAt;
  const subscriptionEnd =
    plan.subscriptionEnd ??
    new Date(new Date(subscriptionStart).getTime() + 29 * MS_IN_DAY).toISOString();
  const subscriptionTier: PlanSubscriptionTier = plan.subscriptionTier ?? 'unselected';

  const fallbackProfile =
    profile ??
    plan.profileSnapshot?.profile ??
    (plan.profileHistory && plan.profileHistory.length > 0
      ? plan.profileHistory[plan.profileHistory.length - 1].profile
      : null);

  const snapshot =
    plan.profileSnapshot ??
    (fallbackProfile
      ? { capturedAt: plan.createdAt, profile: fallbackProfile }
      : { capturedAt: plan.createdAt, profile: profile as UserProfile });

  const initialHistory =
    plan.profileHistory && plan.profileHistory.length > 0
      ? plan.profileHistory
      : fallbackProfile
      ? [{ capturedAt: plan.createdAt, profile: fallbackProfile }]
      : [];

  const mergedHistory = initialHistory.some((item) => item.capturedAt === snapshot.capturedAt)
    ? initialHistory
    : [...initialHistory, snapshot];

  return {
    ...plan,
    subscriptionStart,
    subscriptionEnd,
    subscriptionTier,
    profileSnapshot: snapshot,
    profileHistory: mergedHistory,
  };
}
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const userIdRef = useRef<string | null>(null);
  const onboardingKeyRef = useRef<string | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  const handleError = useCallback((error: unknown) => {
    console.error('[AppState] Supabase sync error', error);
    setSyncStatus('error');
    setLastError(error instanceof Error ? error.message : String(error));
  }, []);

  const hydrate = useCallback(
    async (session: Session | null) => {
      setSession(session);
      userIdRef.current = session?.user?.id ?? null;
      onboardingKeyRef.current = session?.user?.id
        ? `${ONBOARDING_FLAG_BASE}:${session.user.id}`
        : null;

      if (!session?.user) {
        dispatch({ type: 'RESET' });
        setHasCompletedOnboarding(false);
        setIsHydrated(true);
        return;
      }

      let storedFlag = false;
      if (onboardingKeyRef.current) {
        try {
          storedFlag = (await AsyncStorage.getItem(onboardingKeyRef.current)) === 'true';
        } catch (flagError) {
          console.warn('[AppState] Failed to read onboarding flag', flagError);
        }
      }
      setHasCompletedOnboarding(storedFlag);

      setSyncStatus('syncing');
      try {
        const [profileResult, planResult, logs] = await Promise.all([
          fetchProfile(session.user.id),
          fetchPlan(session.user.id),
          fetchLogs(session.user.id),
        ]);

        const fetchedProfile = profileResult ?? null;
        const normalizedPlan = normalizePlan(planResult, fetchedProfile);

        dispatch({
          type: 'HYDRATE',
          payload: {
            profile: fetchedProfile,
            plan: normalizedPlan,
            logs,
          },
        });
        setLastError(null);

        const completed = Boolean(normalizedPlan) || storedFlag;
        setHasCompletedOnboarding(completed);
        if (completed && onboardingKeyRef.current) {
          try {
            await AsyncStorage.setItem(onboardingKeyRef.current, 'true');
          } catch (persistError) {
            console.warn('[AppState] Failed to persist onboarding flag', persistError);
          }
        }
      } catch (error) {
        handleError(error);
      } finally {
        setIsHydrated(true);
        setSyncStatus('idle');
      }
    },
    [handleError],
  );

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          handleError(error);
          setIsHydrated(true);
          return;
        }
        if (!isMounted) return;
        await hydrate(data.session ?? null);
      } catch (error) {
        handleError(error);
        setIsHydrated(true);
      }
    };

    void init();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        void hydrate(session);
      },
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [handleError, hydrate]);

  const withSync = useCallback(
    async (operation: () => Promise<void>) => {
      const userId = userIdRef.current;
      if (!userId) {
        return;
      }
      setSyncStatus('syncing');
      try {
        await operation();
        setSyncStatus('idle');
        setLastError(null);
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  const actions: AppActions = useMemo(
    () => ({
      async setProfile(profile: UserProfile) {
        dispatch({ type: 'SET_PROFILE', payload: profile });
        await withSync(async () => {
          const userId = userIdRef.current;
          if (!userId) return;
          await upsertProfile(userId, profile);
        });
      },
      async setPlan(plan: GeneratedPlan) {
        dispatch({ type: 'SET_PLAN', payload: plan });
        await withSync(async () => {
          const userId = userIdRef.current;
          if (!userId) return;
          await upsertPlan(userId, plan);
        });
      },
      async resetPlan() {
        dispatch({ type: 'RESET' });
        await withSync(async () => {
          const userId = userIdRef.current;
          if (!userId) return;
          await deletePlan(userId);
          await deleteProfile(userId);
        });
        setHasCompletedOnboarding(false);
        if (onboardingKeyRef.current) {
          try {
            await AsyncStorage.removeItem(onboardingKeyRef.current);
          } catch (flagError) {
            console.warn('[AppState] Failed to remove onboarding flag', flagError);
          }
        }
      },
      async toggleWorkoutCompletion(date: string, workoutId: string) {
        const log = ensureLog(state.logs, date);
        const exists = log.workoutsCompleted.includes(workoutId);
        const workoutsCompleted = exists
          ? log.workoutsCompleted.filter((id) => id !== workoutId)
          : [...log.workoutsCompleted, workoutId];
        const nextLog = { ...log, workoutsCompleted };
        dispatch({
          type: 'UPSERT_LOG',
          payload: nextLog,
        });
        await withSync(async () => {
          const userId = userIdRef.current;
          if (!userId) return;
          await upsertDailyLog(userId, nextLog);
        });
      },
      async toggleMealCompletion(date: string, mealId: string) {
        const log = ensureLog(state.logs, date);
        const exists = log.mealsCompleted.includes(mealId);
        const mealsCompleted = exists
          ? log.mealsCompleted.filter((id) => id !== mealId)
          : [...log.mealsCompleted, mealId];
        const nextLog = { ...log, mealsCompleted };
        dispatch({
          type: 'UPSERT_LOG',
          payload: nextLog,
        });
        await withSync(async () => {
          const userId = userIdRef.current;
          if (!userId) return;
          await upsertDailyLog(userId, nextLog);
        });
      },
      async toggleHabitCompletion(date: string, habitId: string) {
        const log = ensureLog(state.logs, date);
        const exists = log.habitsCompleted.includes(habitId);
        const habitsCompleted = exists
          ? log.habitsCompleted.filter((id) => id !== habitId)
          : [...log.habitsCompleted, habitId];
        const nextLog = { ...log, habitsCompleted };
        dispatch({
          type: 'UPSERT_LOG',
          payload: nextLog,
        });
        await withSync(async () => {
          const userId = userIdRef.current;
          if (!userId) return;
          await upsertDailyLog(userId, nextLog);
        });
      },
      async setDailyEnergy(date: string, level: StressLevel) {
        const log = ensureLog(state.logs, date);
        const nextLog = { ...log, energy: level };
        dispatch({
          type: 'UPSERT_LOG',
          payload: nextLog,
        });
        await withSync(async () => {
          const userId = userIdRef.current;
          if (!userId) return;
          await upsertDailyLog(userId, nextLog);
        });
      },
      async markOnboardingComplete() {
        setHasCompletedOnboarding(true);
        if (onboardingKeyRef.current) {
          try {
            await AsyncStorage.setItem(onboardingKeyRef.current, 'true');
          } catch (flagError) {
            console.warn('[AppState] Failed to persist onboarding flag', flagError);
          }
        }
      },
      async signOut() {
        await supabase.auth.signOut();
        setSession(null);
        dispatch({ type: 'RESET' });
        userIdRef.current = null;
        setHasCompletedOnboarding(false);
        if (onboardingKeyRef.current) {
          try {
            await AsyncStorage.removeItem(onboardingKeyRef.current);
          } catch (flagError) {
            console.warn('[AppState] Failed to remove onboarding flag', flagError);
          }
        }
        onboardingKeyRef.current = null;
      },
    }),
    [state.logs, withSync],
  );

  const monthlyCalendar = useMemo(() => {
    if (!state.plan) return null;
    return createMonthlyCalendar(state.plan, state.logs);
  }, [state.plan, state.logs]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      ...state,
      ...actions,
      isHydrated,
      syncStatus,
      lastError,
      hasCompletedOnboarding,
      monthlyCalendar,
      session,
    }),
    [actions, hasCompletedOnboarding, isHydrated, lastError, monthlyCalendar, session, state, syncStatus],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return ctx;
}
