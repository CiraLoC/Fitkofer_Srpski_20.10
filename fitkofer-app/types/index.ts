export type Goal = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high';
export type DietPreference = 'omnivore' | 'pescatarian' | 'vegetarian' | 'mixed';
export type StressLevel = 1 | 2 | 3 | 4 | 5;
export type DayIntensity = 'low' | 'mid' | 'high';

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
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  tags: string[];
  ingredients: string[];
  instructions: string;
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

export interface GeneratedPlan {
  id: string;
  createdAt: string;
  training: TrainingPlan;
  nutrition: {
    rotation: DayIntensity[];
    planByDayType: Record<DayIntensity, DailyNutritionPlan>;
  };
  habits: HabitPlan;
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

export interface AppActions {
  setProfile: (profile: UserProfile) => void;
  setPlan: (plan: GeneratedPlan) => void;
  resetPlan: () => void;
  toggleWorkoutCompletion: (date: string, workoutId: string) => void;
  toggleMealCompletion: (date: string, mealId: string) => void;
  toggleHabitCompletion: (date: string, habitId: string) => void;
  setDailyEnergy: (date: string, level: StressLevel) => void;
}

export type AppStateContextValue = AppState & AppActions;
