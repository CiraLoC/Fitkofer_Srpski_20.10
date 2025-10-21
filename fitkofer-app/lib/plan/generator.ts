import { coreHabits, optionalHabits } from '@/data/habits';
import { homeExercises, gymExercises } from '@/data/exercises';
import { mealSwaps, meals } from '@/data/meals';
import type {
  ActivityLevel,
  DayIntensity,
  DietPreference,
  GeneratedPlan,
  Habit,
  MealRecipe,
  TrainingPlan,
  UserProfile,
  WorkoutExercise,
  WorkoutSession,
} from '@/types';

type SplitConfig = {
  name: string;
  focuses: WorkoutSession['focus'][];
};

const splits: Record<UserProfile['daysPerWeek'], SplitConfig> = {
  2: {
    name: 'Full Body A/B',
    focuses: ['full', 'full'],
  },
  3: {
    name: 'Upper / Lower / Full',
    focuses: ['upper', 'lower', 'full'],
  },
  4: {
    name: 'Upper / Lower x2',
    focuses: ['upper', 'lower', 'upper', 'lower'],
  },
  5: {
    name: 'Push / Pull / Legs / Upper / Lower',
    focuses: ['push', 'pull', 'lower', 'upper', 'lower'],
  },
};

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.35,
  light: 1.45,
  moderate: 1.55,
  high: 1.7,
};

const goalAdjustments: Record<UserProfile['goal'], number> = {
  lose: -0.18,
  maintain: 0,
  gain: 0.12,
};

function pickExercises(
  focus: WorkoutSession['focus'],
  location: UserProfile['equipment']['location'],
  count: number,
): WorkoutExercise[] {
  const pool = location === 'home' ? homeExercises : gymExercises;
  const normalizedFocus = focus;

  const primary = pool.filter((item) => {
    if (normalizedFocus === 'full') {
      return item.focus === 'full' || item.focus === 'lower' || item.focus === 'upper';
    }
    if (normalizedFocus === 'upper') {
      return item.focus === 'upper' || item.focus === 'push' || item.focus === 'pull';
    }
    if (normalizedFocus === 'lower') {
      return item.focus === 'lower';
    }
    if (normalizedFocus === 'push') {
      return item.focus === 'push' || item.focus === 'upper';
    }
    if (normalizedFocus === 'pull') {
      return item.focus === 'pull' || item.focus === 'upper';
    }
    if (normalizedFocus === 'cardio' || normalizedFocus === 'mobility') {
      return item.focus === normalizedFocus;
    }
    return item.focus === normalizedFocus;
  });

  const complementary = pool.filter((item) => item.focus === 'core' || item.focus === 'mobility');

  const selected: WorkoutExercise[] = [];
  const used = new Set<string>();

  const pickFromList = (list: WorkoutExercise[], target: number) => {
    for (const exercise of list) {
      if (selected.length >= target) break;
      if (!used.has(exercise.id)) {
        selected.push(exercise);
        used.add(exercise.id);
      }
    }
  };

  pickFromList(primary, count - 1);
  if (selected.length < count) {
    pickFromList(complementary, count);
  }

  return selected.slice(0, count);
}

function buildSessions(profile: UserProfile): WorkoutSession[] {
  const config = splits[profile.daysPerWeek];
  return config.focuses.map((focus, index) => {
    const exercises = pickExercises(focus, profile.equipment.location, 6);
    const difficulty = profile.activityLevel === 'sedentary' ? 'beginner' : 'intermediate';
    return {
      id: `${focus}-${index + 1}`,
      title: `${focus.charAt(0).toUpperCase() + focus.slice(1)} ${index + 1}`,
      focus,
      difficulty,
      durationMinutes: 45,
      notes:
        focus === 'full'
          ? 'Postepeno povećavaj težinu kada odradiš gornji broj ponavljanja dve nedelje zaredom.'
          : 'Prati tehniku, disanje i kontroliši tempo 2-1-1.',
      exercises,
    };
  });
}

function estimateBmr(profile: UserProfile): number {
  const { weightKg, heightCm, age } = profile;
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

function adjustForConditions(value: number, profile: UserProfile): number {
  if (profile.healthConditions.includes('IR') || profile.healthConditions.includes('PCOS')) {
    return value * 0.95;
  }
  return value;
}

function buildNutrition(profile: UserProfile, weeklyCalories: number, rotation: DayIntensity[]) {
  const proteinPerKg = profile.goal === 'gain' ? 2 : 1.8;
  const protein = proteinPerKg * profile.weightKg;
  const fatsPerKg = profile.goal === 'lose' ? 0.9 : profile.goal === 'gain' ? 1.1 : 1;
  let fats = fatsPerKg * profile.weightKg;

  if (profile.healthConditions.includes('Hashimoto')) {
    fats += 5;
  }

  const caloriesFromProtein = protein * 4;
  const caloriesFromFat = fats * 9;
  const remainingCalories = Math.max(weeklyCalories - (caloriesFromProtein + caloriesFromFat), 50);

  let carbs = remainingCalories / 4;
  carbs = adjustForConditions(carbs, profile);

  const midCalories = weeklyCalories;
  const lowCalories = Math.round(midCalories * 0.86);
  const highCalories = Math.round(midCalories * 1.1);

  const buildDailyPlan = (dayCalories: number, dayType: DayIntensity) => {
    const carbAdjust =
      dayType === 'low' ? carbs * 0.85 : dayType === 'high' ? carbs * 1.1 : carbs;
    const fatAdjust =
      dayType === 'low' ? fats * 1.05 : dayType === 'high' ? fats * 0.95 : fats;

    return {
      dayType,
      calories: Math.round(dayCalories),
      protein: Math.round(protein),
      carbs: Math.round(carbAdjust),
      fats: Math.round(fatAdjust),
      meals: selectMeals(profile, dayType),
      swaps: mealSwaps,
    };
  };

  return {
    rotation,
    planByDayType: {
      low: buildDailyPlan(lowCalories, 'low'),
      mid: buildDailyPlan(midCalories, 'mid'),
      high: buildDailyPlan(highCalories, 'high'),
    },
  };
}

function filterMealsByPreference(preference: DietPreference, candidates: MealRecipe[]): MealRecipe[] {
  switch (preference) {
    case 'vegetarian':
      return candidates.filter((meal) => meal.tags.includes('vegetarian'));
    case 'pescatarian':
      return candidates.filter((meal) => meal.tags.includes('pescatarian') || meal.tags.includes('vegetarian'));
    default:
      return candidates;
  }
}

function matchesRestrictions(profile: UserProfile, meal: MealRecipe): boolean {
  const lowerIngredients = meal.ingredients.join(' ').toLowerCase();
  const hasAllergy = profile.allergies.some((allergy) => lowerIngredients.includes(allergy.toLowerCase()));
  const hasDisliked = profile.dislikedFoods.some((food) => lowerIngredients.includes(food.toLowerCase()));
  return !hasAllergy && !hasDisliked;
}

function selectMeals(profile: UserProfile, dayType: DayIntensity): MealRecipe[] {
  const base = meals.filter((m) => matchesRestrictions(profile, m));
  const byPref = filterMealsByPreference(profile.dietPreference, base);
  const breakfast = byPref.find((meal) => meal.tags.includes('doručak')) ?? meals[0];
  const lunch = byPref.find((meal) => meal.tags.includes('ručak')) ?? meals[3];
  const snack =
    byPref.find((meal) => meal.tags.includes('užina') || meal.tags.includes('desert')) ??
    meals.find((m) => m.tags.includes('užina')) ??
    meals[1];

  if (dayType === 'high') {
    const additional = byPref.find((meal) => meal.tags.includes('desert')) ?? meals[meals.length - 1];
    return [breakfast, lunch, snack, additional];
  }

  if (dayType === 'low') {
    return [breakfast, lunch, snack];
  }

  const dinner =
    byPref.find((meal) => meal.tags.includes('meal-prep') || meal.tags.includes('ručak')) ?? meals[2];
  return [breakfast, lunch, dinner, snack];
}

function buildTrainingPlan(profile: UserProfile): TrainingPlan {
  const sessions = buildSessions(profile);
  const schedule: TrainingPlan['schedule'] = Array.from({ length: 7 }, (_, index) => ({
    day: index,
  }));

  const startingDays = profile.daysPerWeek === 5 ? [0, 1, 2, 3, 4] : profile.daysPerWeek === 4 ? [0, 1, 3, 4] : profile.daysPerWeek === 3 ? [0, 2, 4] : [1, 4];

  sessions.forEach((session, idx) => {
    const dayIndex = startingDays[idx] ?? idx;
    schedule[dayIndex] = { day: dayIndex, sessionId: session.id };
  });

  return {
    split: splits[profile.daysPerWeek].name,
    sessions,
    schedule,
  };
}

function createRotation(schedule: TrainingPlan['schedule']): DayIntensity[] {
  const rotation: DayIntensity[] = Array(7).fill('low');
  const sessionDays = schedule.filter((day) => day.sessionId).map((day) => day.day);

  sessionDays.forEach((day, index) => {
    rotation[day] = index < 2 ? 'high' : 'mid';
  });

  return rotation;
}

export function generatePlan(profile: UserProfile): GeneratedPlan {
  const bmr = estimateBmr(profile);
  const tdee = bmr * activityMultipliers[profile.activityLevel];
  const adjustment = goalAdjustments[profile.goal];
  const targetCalories = Math.round(tdee * (1 + adjustment));

  const training = buildTrainingPlan(profile);
  const rotation = createRotation(training.schedule);
  const nutrition = buildNutrition(profile, targetCalories, rotation);

  const extraHabits: Habit[] = [];
  if (profile.stressLevel >= 4) {
    const gratitude = optionalHabits.find((habit) => habit.id === 'gratitude');
    if (gratitude) extraHabits.push(gratitude);
  }
  if (profile.sleepHours < 7) {
    const mobility = optionalHabits.find((habit) => habit.id === 'mobility-reset');
    if (mobility) extraHabits.push(mobility);
  }

  const habits = {
    dailyHabits: [...coreHabits, ...extraHabits],
    weeklyChallenge: '35k koraka + 3 treninga ove nedelje',
  };

  return {
    id: `plan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    training,
    nutrition,
    habits,
  };
}
