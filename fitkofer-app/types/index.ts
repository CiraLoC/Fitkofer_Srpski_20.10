import type { Session } from '@supabase/supabase-js';

export type Goal = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high';
export type DietPreference = 'omnivore' | 'pescatarian' | 'vegetarian' | 'mixed' | 'keto' | 'carnivore';
export type StressLevel = 1 | 2 | 3 | 4 | 5;
export type DayIntensity = 'low' | 'mid' | 'high';
export type PlanSubscriptionTier = 'unselected' | 'nutrition' | 'training' | 'habits' | 'full';

export type HealthCondition = 'IR' | 'Hashimoto' | 'PCOS';

export interface UserProfile {
  age: number;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  activityLevel: ActivityLevel;
  equipment: {
    location: 'home' | 'gym';
    items: string[];
  };
  daysPerWeek: 2 | 3 | 4 | 5;
  dietPreference: DietPreference;
  allergies: string[];
  dislikedFoods: string[];
  sleepHours: number;
  stressLevel: StressLevel;
  healthConditions: HealthCondition[];
  cycleLengthDays?: number | null;
  periodLengthDays?: number | null;
  lastPeriodDate?: string | null;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  equipment: string;
  focus: 'upper' | 'lower' | 'full' | 'core' | 'cardio' | 'push' | 'pull' | 'mobility';
  instructions: string;
  sets: number;
  repRange: string;
  tempo?: string;
  restSeconds?: number;
  goalTags?: Goal[];
  healthTags?: HealthCondition[];
  intensity?: 'beginner' | 'intermediate' | 'advanced';
  preferredLocation?: 'home' | 'gym';
}

export interface WorkoutSession {
  id: string;
  title: string;
  focus: 'full' | 'upper' | 'lower' | 'push' | 'pull' | 'cardio' | 'mobility';
  difficulty: 'beginner' | 'intermediate';
  durationMinutes: number;
  notes: string;
  exercises: WorkoutExercise[];
}

export interface TrainingPlan {
  split: string;
  sessions: WorkoutSession[];
  schedule: Array<{
    day: number; // 0 Monday �?" 6 Sunday
    sessionId?: string;
  }>;
}

export interface MealRecipe {
  id: string;
  title: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';
  dietTypes: DietPreference[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  tags: string[];
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    source: string;
  }>;
  instructions: string[];
  image: string;
}

export interface MealSuggestion {
  id: string;
  title: string;
  icon: string;
}

export interface DailyNutritionPlan {
  dayType: DayIntensity;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meals: MealRecipe[];
  swaps: MealSuggestion[];
  dayIndex?: number;
  dayName?: string;
}

export interface Habit {
  id: string;
  title: string;
  description: string;
  category: 'hydration' | 'sleep' | 'mobility' | 'mindfulness' | 'nutrition';
}

export interface HabitPlan {
  dailyHabits: Habit[];
  weeklyChallenge: string;
}

export interface ProfileSnapshot {
  capturedAt: string;
  profile: UserProfile;
}

export interface GeneratedPlan {
  id: string;
  createdAt: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  subscriptionTier: PlanSubscriptionTier;
  profileSnapshot: ProfileSnapshot;
  profileHistory: ProfileSnapshot[];
  training: TrainingPlan;
  nutrition: {
    rotation: DayIntensity[];
    planByDayType: Record<DayIntensity, DailyNutritionPlan>;
    weeklyPlan: DailyNutritionPlan[];
  };
  habits: HabitPlan;
}

export interface CalendarMealSummary {
  id: string;
  title: string;
  completed: boolean;
}

export interface CalendarHabitSummary {
  id: string;
  title: string;
  completed: boolean;
}

export interface CalendarDaySummary {
  date: string;
  dayNumber: number;
  dayLabel: string;
  inSubscription: boolean;
  isToday: boolean;
  isFuture: boolean;
  dayType?: DayIntensity;
  workout?: {
    id: string;
    title: string;
    focus: WorkoutSession['focus'];
    completed: boolean;
  } | null;
  meals: CalendarMealSummary[];
  habits: CalendarHabitSummary[];
}

export type CalendarWeek = CalendarDaySummary[];

export interface CalendarData {
  start: string;
  end: string;
  weeks: CalendarWeek[];
  daysByDate: Record<string, CalendarDaySummary>;
}

export interface DailyLog {
  date: string; // ISO string
  energy?: StressLevel;
  workoutsCompleted: string[];
  mealsCompleted: string[];
  habitsCompleted: string[];
}

export interface AppState {
  profile: UserProfile | null;
  plan: GeneratedPlan | null;
  logs: Record<string, DailyLog>;
}

export type SyncStatus = 'idle' | 'syncing' | 'error';

export interface AppActions {
  setProfile: (profile: UserProfile) => Promise<void>;
  setPlan: (plan: GeneratedPlan) => Promise<void>;
  resetPlan: () => Promise<void>;
  toggleWorkoutCompletion: (date: string, workoutId: string) => Promise<void>;
  toggleMealCompletion: (date: string, mealId: string) => Promise<void>;
  toggleHabitCompletion: (date: string, habitId: string) => Promise<void>;
  setDailyEnergy: (date: string, level: StressLevel) => Promise<void>;
  signOut: () => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
}

export interface AppStateMeta {
  isHydrated: boolean;
  syncStatus: SyncStatus;
  lastError?: string | null;
  hasCompletedOnboarding: boolean;
  monthlyCalendar: CalendarData | null;
}

export interface AppAuthState {
  session: Session | null;
}

export type AppStateContextValue = AppState & AppActions & AppStateMeta & AppAuthState;
