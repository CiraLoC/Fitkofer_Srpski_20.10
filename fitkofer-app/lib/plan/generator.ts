import { coreHabits, optionalHabits } from "@/data/habits";
import { homeExercises, gymExercises } from "@/data/exercises";
import { mealSwaps, meals } from "@/data/meals";
import type {
  ActivityLevel,
  DayIntensity,
  DietPreference,
  GeneratedPlan,
  Habit,
  MealRecipe,
  PlanSubscriptionTier,
  TrainingPlan,
  UserProfile,
  WorkoutExercise,
  WorkoutSession,
  DailyNutritionPlan,
} from "@/types";

type SplitConfig = {
  name: string;
  focuses: WorkoutSession["focus"][];
};

const splits: Record<UserProfile["daysPerWeek"], SplitConfig> = {
  2: {
    name: "Full Body A/B",
    focuses: ["full", "full"],
  },
  3: {
    name: "Upper / Lower / Full",
    focuses: ["upper", "lower", "full"],
  },
  4: {
    name: "Upper / Lower x2",
    focuses: ["upper", "lower", "upper", "lower"],
  },
  5: {
    name: "Push / Pull / Legs / Upper / Lower",
    focuses: ["push", "pull", "lower", "upper", "lower"],
  },
};

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.35,
  light: 1.45,
  moderate: 1.55,
  high: 1.7,
};

const goalAdjustments: Record<UserProfile["goal"], number> = {
  lose: -0.18,
  maintain: 0,
  gain: 0.12,
};

const dayLabels = [
  "Ponedeljak",
  "Utorak",
  "Sreda",
  "Četvrtak",
  "Petak",
  "Subota",
  "Nedelja",
];

const mealDistribution: Record<
  DayIntensity,
  {
    mealType: MealRecipe["mealType"];
    ratio: number;
  }[]
> = {
  low: [
    { mealType: "breakfast", ratio: 0.3 },
    { mealType: "lunch", ratio: 0.4 },
    { mealType: "dinner", ratio: 0.3 },
  ],
  mid: [
    { mealType: "breakfast", ratio: 0.28 },
    { mealType: "lunch", ratio: 0.34 },
    { mealType: "dinner", ratio: 0.28 },
    { mealType: "snack", ratio: 0.1 },
  ],
  high: [
    { mealType: "breakfast", ratio: 0.27 },
    { mealType: "lunch", ratio: 0.33 },
    { mealType: "dinner", ratio: 0.25 },
    { mealType: "snack", ratio: 0.08 },
    { mealType: "dessert", ratio: 0.07 },
  ],
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function exerciseMatchesProfile(
  exercise: WorkoutExercise,
  profile: UserProfile,
) {
  if (
    exercise.preferredLocation &&
    exercise.preferredLocation !== profile.equipment.location
  ) {
    return false;
  }
  if (
    exercise.goalTags &&
    exercise.goalTags.length > 0 &&
    !exercise.goalTags.includes(profile.goal)
  ) {
    return false;
  }
  if (exercise.healthTags && exercise.healthTags.length > 0) {
    const relevant = profile.healthConditions.some((condition) =>
      exercise.healthTags?.includes(condition),
    );
    if (!relevant) {
      return false;
    }
  }
  if (exercise.intensity === "advanced" && profile.activityLevel !== "high") {
    return false;
  }
  if (
    exercise.intensity === "intermediate" &&
    profile.activityLevel === "sedentary"
  ) {
    return false;
  }
  return true;
}

function pickExercises(
  focus: WorkoutSession["focus"],
  profile: UserProfile,
  count: number,
): WorkoutExercise[] {
  const basePool =
    profile.equipment.location === "home" ? homeExercises : gymExercises;
  const tailoredPool = basePool.filter((exercise) =>
    exerciseMatchesProfile(exercise, profile),
  );
  const normalizedFocus = focus;

  const focusMatches = (exercise: WorkoutExercise) => {
    if (normalizedFocus === "full") {
      return (
        exercise.focus === "full" ||
        exercise.focus === "lower" ||
        exercise.focus === "upper"
      );
    }
    if (normalizedFocus === "upper") {
      return (
        exercise.focus === "upper" ||
        exercise.focus === "push" ||
        exercise.focus === "pull"
      );
    }
    if (normalizedFocus === "lower") {
      return exercise.focus === "lower";
    }
    if (normalizedFocus === "push") {
      return exercise.focus === "push" || exercise.focus === "upper";
    }
    if (normalizedFocus === "pull") {
      return exercise.focus === "pull" || exercise.focus === "upper";
    }
    if (normalizedFocus === "cardio" || normalizedFocus === "mobility") {
      return exercise.focus === normalizedFocus;
    }
    return exercise.focus === normalizedFocus;
  };

  let primary = tailoredPool.filter(focusMatches);
  if (primary.length === 0) {
    primary = basePool.filter(focusMatches);
  }

  let complementary = tailoredPool.filter(
    (item) => item.focus === "core" || item.focus === "mobility",
  );
  if (complementary.length === 0) {
    complementary = basePool.filter(
      (item) => item.focus === "core" || item.focus === "mobility",
    );
  }

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
    const exercises = pickExercises(focus, profile, 6);
    const difficulty =
      profile.activityLevel === "sedentary" ? "beginner" : "intermediate";
    return {
      id: `${focus}-${index + 1}`,
      title: `${focus.charAt(0).toUpperCase() + focus.slice(1)} ${index + 1}`,
      focus,
      difficulty,
      durationMinutes: 45,
      notes:
        focus === "full"
          ? "Postepeno povećavaj težinu kada odradiš gornji broj ponavljanja dve nedelje zaredom."
          : "Prati tehniku, disanje i kontroliši tempo 2-1-1.",
      exercises,
    };
  });
}

function estimateBmr(profile: UserProfile): number {
  const { weightKg, heightCm, age } = profile;
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

function adjustForConditions(value: number, profile: UserProfile): number {
  if (
    profile.healthConditions.includes("IR") ||
    profile.healthConditions.includes("PCOS")
  ) {
    return value * 0.95;
  }
  return value;
}

function filterMealsByPreference(
  preference: DietPreference,
  candidates: MealRecipe[],
): MealRecipe[] {
  switch (preference) {
    case "vegetarian":
      return candidates.filter(
        (meal) =>
          meal.dietTypes.includes("vegetarian") ||
          meal.dietTypes.includes("mixed"),
      );
    case "pescatarian":
      return candidates.filter(
        (meal) =>
          meal.dietTypes.includes("pescatarian") ||
          meal.dietTypes.includes("mixed") ||
          meal.dietTypes.includes("vegetarian"),
      );
    case "keto":
      return candidates.filter(
        (meal) =>
          meal.dietTypes.includes("keto") ||
          meal.dietTypes.includes("carnivore"),
      );
    case "carnivore":
      return candidates.filter((meal) => meal.dietTypes.includes("carnivore"));
    case "mixed":
      return candidates.filter(
        (meal) =>
          meal.dietTypes.includes("mixed") ||
          meal.dietTypes.includes("omnivore") ||
          meal.dietTypes.includes("pescatarian") ||
          meal.dietTypes.includes("vegetarian"),
      );
    case "omnivore":
    default:
      return candidates.filter(
        (meal) =>
          meal.dietTypes.includes("omnivore") ||
          meal.dietTypes.includes("mixed"),
      );
  }
}

function filterMealsByHealth(
  profile: UserProfile,
  candidates: MealRecipe[],
): MealRecipe[] {
  if (profile.healthConditions.length === 0) {
    return candidates;
  }

  const conditions = profile.healthConditions.map((condition) =>
    condition.toLowerCase(),
  );
  const containsAll = (meal: MealRecipe) =>
    conditions.every((condition) =>
      meal.tags.some((tag) => tag.toLowerCase().includes(condition)),
    );
  const containsAny = (meal: MealRecipe) =>
    conditions.some((condition) =>
      meal.tags.some((tag) => tag.toLowerCase().includes(condition)),
    );

  const strictMatches = candidates.filter(containsAll);
  if (strictMatches.length >= 6) {
    return strictMatches;
  }

  const partialMatches = candidates.filter(containsAny);
  if (partialMatches.length >= 6) {
    return partialMatches;
  }

  return candidates;
}

function matchesRestrictions(profile: UserProfile, meal: MealRecipe): boolean {
  const lowerIngredients = meal.ingredients
    .map((ingredient) => ingredient.name.toLowerCase())
    .join(" ");
  const hasAllergy = profile.allergies.some((allergy) =>
    lowerIngredients.includes(allergy.toLowerCase()),
  );
  const hasDisliked = profile.dislikedFoods.some((food) =>
    lowerIngredients.includes(food.toLowerCase()),
  );
  return !hasAllergy && !hasDisliked;
}

function scoreMealForDay(
  meal: MealRecipe,
  targetCalories: number,
  dayType: DayIntensity,
  profile: UserProfile,
): number {
  const baseScore = Math.abs(meal.calories - targetCalories);
  const tagBoost =
    dayType === "high"
      ? meal.tags.includes("high-calorie")
        ? -40
        : 0
      : dayType === "low"
        ? meal.tags.includes("low-calorie")
          ? -30
          : 0
        : meal.tags.includes("mid-calorie")
          ? -20
          : 0;
  const proteinBoost = meal.tags.includes("high-protein") ? -10 : 0;

  let healthScore = 0;
  if (profile.healthConditions.length > 0) {
    const conditions = profile.healthConditions.map((condition) =>
      condition.toLowerCase(),
    );
    const hasAll = conditions.every((condition) =>
      meal.tags.some((tag) => tag.toLowerCase().includes(condition)),
    );
    const hasAny = conditions.some((condition) =>
      meal.tags.some((tag) => tag.toLowerCase().includes(condition)),
    );
    if (hasAll) {
      healthScore -= 40;
    } else if (hasAny) {
      healthScore -= 15;
    } else {
      healthScore += 25;
    }
  }

  return baseScore + tagBoost + proteinBoost + healthScore;
}

function pickMealForType(
  mealsPool: MealRecipe[],
  mealType: MealRecipe["mealType"],
  dayType: DayIntensity,
  targetCalories: number,
  usedIds: Set<string>,
  profile: UserProfile,
): MealRecipe | null {
  const candidates = mealsPool.filter((meal) => meal.mealType === mealType);
  if (candidates.length === 0) {
    return null;
  }

  const unused = candidates.filter((candidate) => !usedIds.has(candidate.id));
  const pool = unused.length > 0 ? unused : candidates;
  const scored = pool
    .map((meal) => ({
      meal,
      score: scoreMealForDay(meal, targetCalories, dayType, profile),
    }))
    .sort((a, b) => a.score - b.score);

  const chosen = scored[0]?.meal ?? null;
  if (chosen) {
    usedIds.add(chosen.id);
  }
  return chosen;
}

function sumMeals(mealsForDay: MealRecipe[]) {
  return mealsForDay.reduce(
    (acc, meal) => {
      acc.calories += meal.calories;
      acc.protein += meal.protein;
      acc.carbs += meal.carbs;
      acc.fats += meal.fats;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );
}

function buildNutrition(
  profile: UserProfile,
  weeklyCalories: number,
  rotation: DayIntensity[],
) {
  const proteinPerKg = profile.goal === "gain" ? 2 : 1.8;
  const baseProtein = proteinPerKg * profile.weightKg;
  const fatsPerKg =
    profile.goal === "lose" ? 0.9 : profile.goal === "gain" ? 1.1 : 1;
  let baseFats = fatsPerKg * profile.weightKg;

  if (profile.healthConditions.includes("Hashimoto")) {
    baseFats += 5;
  }

  const caloriesFromProtein = baseProtein * 4;
  const caloriesFromFat = baseFats * 9;
  const remainingCalories = Math.max(
    weeklyCalories - (caloriesFromProtein + caloriesFromFat),
    120,
  );

  let baseCarbs = remainingCalories / 4;
  baseCarbs = adjustForConditions(baseCarbs, profile);

  const targets: Record<
    DayIntensity,
    { calories: number; protein: number; carbs: number; fats: number }
  > = {
    low: {
      calories: Math.round(weeklyCalories * 0.86),
      protein: Math.round(baseProtein),
      carbs: Math.round(baseCarbs * 0.82),
      fats: Math.round(baseFats * 1.05),
    },
    mid: {
      calories: Math.round(weeklyCalories),
      protein: Math.round(baseProtein),
      carbs: Math.round(baseCarbs),
      fats: Math.round(baseFats),
    },
    high: {
      calories: Math.round(weeklyCalories * 1.1),
      protein: Math.round(baseProtein * 1.05),
      carbs: Math.round(baseCarbs * 1.1),
      fats: Math.round(baseFats * 0.95),
    },
  };

  const basePool = meals.filter((meal) => matchesRestrictions(profile, meal));
  const dietFiltered = filterMealsByPreference(
    profile.dietPreference,
    basePool,
  );
  const healthFiltered = filterMealsByHealth(profile, dietFiltered);
  const usedMealIds = new Set<string>();

  const weeklyPlan: DailyNutritionPlan[] = rotation.map((dayType, index) => {
    const specs = mealDistribution[dayType];
    const mealsForDay: MealRecipe[] = [];
    specs.forEach((spec) => {
      const targetCalories = targets[dayType].calories * spec.ratio;
      const chosen =
        pickMealForType(
          healthFiltered,
          spec.mealType,
          dayType,
          targetCalories,
          usedMealIds,
          profile,
        ) ??
        pickMealForType(
          dietFiltered,
          spec.mealType,
          dayType,
          targetCalories,
          usedMealIds,
          profile,
        ) ??
        pickMealForType(
          basePool,
          spec.mealType,
          dayType,
          targetCalories,
          usedMealIds,
          profile,
        );

      if (chosen) {
        mealsForDay.push(chosen);
      }
    });

    if (mealsForDay.length === 0) {
      const fallback = healthFiltered.slice(0, 3);
      mealsForDay.push(...fallback);
    }

    const totals = sumMeals(mealsForDay);

    return {
      dayType,
      dayIndex: index,
      dayName: dayLabels[index],
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fats: Math.round(totals.fats),
      meals: mealsForDay,
      swaps: mealSwaps,
    };
  });

  const planByDayType: Record<DayIntensity, DailyNutritionPlan> = {
    low: weeklyPlan.find((plan) => plan.dayType === "low") ?? {
      dayType: "low",
      dayIndex: 0,
      dayName: dayLabels[0],
      calories: targets.low.calories,
      protein: targets.low.protein,
      carbs: targets.low.carbs,
      fats: targets.low.fats,
      meals: healthFiltered
        .filter((meal) => meal.mealType !== "dessert")
        .slice(0, 3),
      swaps: mealSwaps,
    },
    mid: weeklyPlan.find((plan) => plan.dayType === "mid") ?? {
      dayType: "mid",
      dayIndex: 0,
      dayName: dayLabels[0],
      calories: targets.mid.calories,
      protein: targets.mid.protein,
      carbs: targets.mid.carbs,
      fats: targets.mid.fats,
      meals: healthFiltered.slice(0, 4),
      swaps: mealSwaps,
    },
    high: weeklyPlan.find((plan) => plan.dayType === "high") ?? {
      dayType: "high",
      dayIndex: 0,
      dayName: dayLabels[0],
      calories: targets.high.calories,
      protein: targets.high.protein,
      carbs: targets.high.carbs,
      fats: targets.high.fats,
      meals: healthFiltered.slice(0, 5),
      swaps: mealSwaps,
    },
  };

  return {
    rotation,
    planByDayType,
    weeklyPlan,
  };
}

function buildTrainingPlan(profile: UserProfile): TrainingPlan {
  const sessions = buildSessions(profile);
  const schedule: TrainingPlan["schedule"] = Array.from(
    { length: 7 },
    (_, index) => ({
      day: index,
    }),
  );

  const startingDays =
    profile.daysPerWeek === 5
      ? [0, 1, 2, 3, 4]
      : profile.daysPerWeek === 4
        ? [0, 1, 3, 4]
        : profile.daysPerWeek === 3
          ? [0, 2, 4]
          : [1, 4];

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

function createRotation(schedule: TrainingPlan["schedule"]): DayIntensity[] {
  const rotation: DayIntensity[] = Array(7).fill("low");
  const sessionDays = schedule
    .filter((day) => day.sessionId)
    .map((day) => day.day);

  sessionDays.forEach((day, index) => {
    rotation[day] = index < 2 ? "high" : "mid";
  });

  return rotation;
}

export function generatePlan(
  profile: UserProfile,
  previousPlan?: GeneratedPlan,
): GeneratedPlan {
  const bmr = estimateBmr(profile);
  const tdee = bmr * activityMultipliers[profile.activityLevel];
  const adjustment = goalAdjustments[profile.goal];
  const targetCalories = Math.round(tdee * (1 + adjustment));

  const training = buildTrainingPlan(profile);
  const rotation = createRotation(training.schedule);
  const nutrition = buildNutrition(profile, targetCalories, rotation);

  const subscriptionStartDate = startOfDay(new Date());
  const subscriptionEndDate = new Date(subscriptionStartDate);
  subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 29);

  const snapshotCapturedAt = new Date().toISOString();
  const newSnapshot = {
    capturedAt: snapshotCapturedAt,
    profile,
  };
  const previousHistory =
    previousPlan?.profileHistory ??
    (previousPlan?.profileSnapshot ? [previousPlan.profileSnapshot] : []);
  const profileHistory = [...previousHistory, newSnapshot];

  const extraHabits: Habit[] = [];
  if (profile.stressLevel >= 4) {
    const gratitude = optionalHabits.find((habit) => habit.id === "gratitude");
    if (gratitude) extraHabits.push(gratitude);
  }
  if (profile.sleepHours < 7) {
    const mobility = optionalHabits.find(
      (habit) => habit.id === "mobility-reset",
    );
    if (mobility) extraHabits.push(mobility);
  }

  const habits = {
    dailyHabits: [...coreHabits, ...extraHabits],
    weeklyChallenge: "35k koraka + 3 treninga ove nedelje",
  };

  const subscriptionTier: PlanSubscriptionTier =
    previousPlan?.subscriptionTier ?? "unselected";

  return {
    id: `plan-${Date.now()}`,
    createdAt: new Date().toISOString(),
    subscriptionStart: subscriptionStartDate.toISOString(),
    subscriptionEnd: subscriptionEndDate.toISOString(),
    subscriptionTier,
    profileSnapshot: newSnapshot,
    profileHistory,
    training,
    nutrition,
    habits,
  };
}
