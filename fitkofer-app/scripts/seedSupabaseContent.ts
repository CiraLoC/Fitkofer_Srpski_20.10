import "dotenv/config";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

import { homeExercises, gymExercises } from "@/data/exercises";
import { coreHabits, optionalHabits } from "@/data/habits";
import { meals } from "@/data/meals";

fileURLToPath(import.meta.url);

const isDev = process.env.NODE_ENV !== "production";

const supabaseUrl =
  process.env.SUPABASE_SERVICE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing SUPABASE_SERVICE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.",
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function upsertExercises() {
  const records = [...homeExercises, ...gymExercises].map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    focus: exercise.focus,
    equipment: exercise.equipment,
    instructions: exercise.instructions,
    sets: exercise.sets,
    rep_range: exercise.repRange,
    tempo: exercise.tempo ?? null,
    rest_seconds: exercise.restSeconds ?? null,
    goal_tags: exercise.goalTags ?? [],
    health_tags: exercise.healthTags ?? [],
    intensity: exercise.intensity ?? null,
    preferred_location: exercise.preferredLocation ?? null,
    media: {},
  }));

  const { error } = await supabase
    .from("content_exercises")
    .upsert(records, { onConflict: "id" });
  if (error) throw error;
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(`Upserted ${records.length} exercises`);
  }
}

async function upsertHabits() {
  const records = [...coreHabits, ...optionalHabits].map((habit) => ({
    id: habit.id,
    title: habit.title,
    description: habit.description,
    category: habit.category,
    is_core: coreHabits.some((core) => core.id === habit.id),
    locale: "sr-Latn",
  }));
  const { error } = await supabase
    .from("content_habits")
    .upsert(records, { onConflict: "id" });
  if (error) throw error;
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(`Upserted ${records.length} habits`);
  }
}

async function upsertMeals() {
  const records = meals.map((meal) => ({
    id: meal.id,
    title: meal.title,
    meal_type: meal.mealType,
    diet_types: meal.dietTypes,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fats: meal.fats,
    tags: meal.tags,
    ingredients: meal.ingredients,
    instructions: meal.instructions,
    image_url: meal.image ?? null,
    prep_time_minutes: meal.prepTimeMinutes ?? null,
  }));
  const { error } = await supabase
    .from("content_meals")
    .upsert(records, { onConflict: "id" });
  if (error) throw error;
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(`Upserted ${records.length} meals`);
  }
}

async function main() {
  try {
    await upsertExercises();
    await upsertHabits();
    await upsertMeals();
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log("Content seed completed successfully");
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Content seed failed:", error);
    process.exitCode = 1;
  }
}

main();
