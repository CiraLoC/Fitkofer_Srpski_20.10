import { createContext, ReactNode, useContext, useMemo, useReducer } from 'react';

import type {
  AppActions,
  AppState,
  AppStateContextValue,
  DailyLog,
  GeneratedPlan,
  StressLevel,
  UserProfile,
} from '@/types';

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

const initialState: AppState = {
  profile: null,
  plan: null,
  logs: {},
};

type Action =
  | { type: 'SET_PROFILE'; payload: UserProfile }
  | { type: 'SET_PLAN'; payload: GeneratedPlan }
  | { type: 'RESET' }
  | { type: 'UPSERT_LOG'; payload: DailyLog };

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

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const actions: AppActions = useMemo(
    () => ({
      setProfile(profile: UserProfile) {
        dispatch({ type: 'SET_PROFILE', payload: profile });
      },
      setPlan(plan: GeneratedPlan) {
        dispatch({ type: 'SET_PLAN', payload: plan });
      },
      resetPlan() {
        dispatch({ type: 'RESET' });
      },
      toggleWorkoutCompletion(date: string, workoutId: string) {
        const log = ensureLog(state.logs, date);
        const exists = log.workoutsCompleted.includes(workoutId);
        const workoutsCompleted = exists
          ? log.workoutsCompleted.filter((id) => id !== workoutId)
          : [...log.workoutsCompleted, workoutId];
        dispatch({
          type: 'UPSERT_LOG',
          payload: { ...log, workoutsCompleted },
        });
      },
      toggleMealCompletion(date: string, mealId: string) {
        const log = ensureLog(state.logs, date);
        const exists = log.mealsCompleted.includes(mealId);
        const mealsCompleted = exists
          ? log.mealsCompleted.filter((id) => id !== mealId)
          : [...log.mealsCompleted, mealId];
        dispatch({
          type: 'UPSERT_LOG',
          payload: { ...log, mealsCompleted },
        });
      },
      toggleHabitCompletion(date: string, habitId: string) {
        const log = ensureLog(state.logs, date);
        const exists = log.habitsCompleted.includes(habitId);
        const habitsCompleted = exists
          ? log.habitsCompleted.filter((id) => id !== habitId)
          : [...log.habitsCompleted, habitId];
        dispatch({
          type: 'UPSERT_LOG',
          payload: { ...log, habitsCompleted },
        });
      },
      setDailyEnergy(date: string, level: StressLevel) {
        const log = ensureLog(state.logs, date);
        dispatch({
          type: 'UPSERT_LOG',
          payload: { ...log, energy: level },
        });
      },
    }),
    [state.logs],
  );

  const value = useMemo<AppStateContextValue>(
    () => ({
      ...state,
      ...actions,
    }),
    [actions, state],
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
