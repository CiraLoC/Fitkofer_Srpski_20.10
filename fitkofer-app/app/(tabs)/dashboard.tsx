import { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Colors from "@/constants/Colors";
import { formatLocalISODate } from "@/lib/utils/date";
import { useAppState } from "@/state/AppStateContext";
import type { DayIntensity, StressLevel } from "@/types";

const dayLabels = [
  "Ponedeljak",
  "Utorak",
  "Sreda",
  "Četvrtak",
  "Petak",
  "Subota",
  "Nedelja",
];

const intensityCopy: Record<DayIntensity, string> = {
  low: "Low dan (regeneracija)",
  mid: "Mid dan (standardni unos)",
  high: "High dan (trening + puni obroci)",
};

const energyOptions: { label: string; value: StressLevel }[] = [
  { label: "Niska", value: 1 },
  { label: "Ok", value: 3 },
  { label: "Visoka", value: 5 },
];

export default function DashboardScreen() {
  const {
    plan,
    logs,
    toggleWorkoutCompletion,
    toggleMealCompletion,
    toggleHabitCompletion,
    setDailyEnergy,
  } = useAppState();
  const today = useMemo(() => new Date(), []);
  const isoDate = formatLocalISODate(today);
  const log = logs[isoDate];

  if (!plan) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          Nema aktivnog plana. Prođi onboarding da kreiraš plan.
        </Text>
      </View>
    );
  }

  const dayIndex = ((today.getDay() + 6) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const dayPlan = plan.nutrition.weeklyPlan?.[dayIndex];
  const rotation = dayPlan?.dayType ?? plan.nutrition.rotation[dayIndex];
  const dailyNutrition = dayPlan ?? plan.nutrition.planByDayType[rotation];
  const scheduled = plan.training.schedule.find(
    (entry) => entry.day === dayIndex,
  );
  const workout = plan.training.sessions.find(
    (session) => session.id === scheduled?.sessionId,
  );
  const habits = plan.habits.dailyHabits;

  const totalTodos =
    (workout ? 1 : 0) + dailyNutrition.meals.length + habits.length;
  const completedTodos =
    (workout && log?.workoutsCompleted.includes(workout.id) ? 1 : 0) +
    dailyNutrition.meals.filter((meal) => log?.mealsCompleted.includes(meal.id))
      .length +
    habits.filter((habit) => log?.habitsCompleted.includes(habit.id)).length;
  const adherence =
    totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.greeting}>Zdravo!</Text>
        <Text style={styles.dateText}>
          {dayLabels[dayIndex]}, {today.toLocaleDateString("sr-RS")}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Uspešnost</Text>
        <Text style={styles.adherenceValue}>{adherence}%</Text>
        <Text style={styles.bodyText}>Dnevni progres za plan</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${adherence}%` }]} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Današnji fokus</Text>
        <Text style={styles.bodyText}>{intensityCopy[rotation]}</Text>
        <Text style={styles.macroHighlight}>
          {dailyNutrition.calories} kcal · P {dailyNutrition.protein}g · U{" "}
          {dailyNutrition.carbs}g · M {dailyNutrition.fats}g
        </Text>
      </View>

      {workout ? (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Trening</Text>
            <TouchableOpacity
              onPress={() => toggleWorkoutCompletion(isoDate, workout.id)}
            >
              <Text style={styles.actionLink}>
                {log?.workoutsCompleted.includes(workout.id)
                  ? "Poništi"
                  : "Označi kao završeno"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.workoutTitle}>{workout.title}</Text>
          <Text style={styles.bodyText}>
            {workout.durationMinutes} min · {workout.exercises.length} vežbi
          </Text>
          <View style={styles.exerciseList}>
            {workout.exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseItem}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {exercise.sets} serije · {exercise.repRange} ponavljanja ·{" "}
                  {exercise.equipment}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Oporavak</Text>
          <Text style={styles.bodyText}>
            Danas nema strukturiranog treninga. Fokus na šetnju i NSDR.
          </Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Obroci</Text>
        {dailyNutrition.meals.map((meal) => {
          const completed = log?.mealsCompleted.includes(meal.id);
          return (
            <TouchableOpacity
              key={meal.id}
              style={[
                styles.mealItem,
                completed ? styles.mealItemCompleted : undefined,
              ]}
              onPress={() => toggleMealCompletion(isoDate, meal.id)}
            >
              <View style={styles.mealHeader}>
                <Text
                  style={[
                    styles.mealTitle,
                    completed ? styles.completedText : undefined,
                  ]}
                >
                  {meal.title}
                </Text>
                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
              </View>
              <Text style={styles.mealMacros}>
                P {meal.protein}g · U {meal.carbs}g · M {meal.fats}g
              </Text>
              <Text style={styles.mealTags}>{meal.tags.join(" • ")}</Text>
            </TouchableOpacity>
          );
        })}
        <View style={styles.swapRow}>
          <Text style={styles.bodyText}>
            Treba zamena? Na ekranu Ishrana možeš izabrati alternativu.
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Navike</Text>
        <View style={styles.habitList}>
          {habits.map((habit) => {
            const completed = log?.habitsCompleted.includes(habit.id);
            return (
              <TouchableOpacity
                key={habit.id}
                style={[
                  styles.habitItem,
                  completed ? styles.habitItemCompleted : undefined,
                ]}
                onPress={() => toggleHabitCompletion(isoDate, habit.id)}
              >
                <Text
                  style={[
                    styles.habitTitle,
                    completed ? styles.completedText : undefined,
                  ]}
                >
                  {habit.title}
                </Text>
                <Text style={styles.habitDescription}>{habit.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Energija</Text>
        <Text style={styles.bodyText}>Kako se osećaš danas?</Text>
        <View style={styles.pillRow}>
          {energyOptions.map((option) => {
            const selected = log?.energy === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => setDailyEnergy(isoDate, option.value)}
                style={[
                  styles.energyPill,
                  selected ? styles.energyPillSelected : undefined,
                ]}
              >
                <Text
                  style={[
                    styles.energyLabel,
                    selected ? styles.energyLabelSelected : undefined,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 24,
    gap: 18,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: Colors.light.background,
  },
  emptyText: {
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
    textAlign: "center",
  },
  greeting: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 26,
    color: Colors.light.text,
  },
  dateText: {
    fontFamily: "Inter_400Regular",
    color: "#6B5E58",
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
  },
  bodyText: {
    fontFamily: "Inter_400Regular",
    color: "#5C5C5C",
  },
  adherenceValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 36,
    color: Colors.light.tint,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.light.background,
    borderRadius: 999,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.tint,
    borderRadius: 999,
  },
  macroHighlight: {
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  workoutTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  exerciseList: {
    gap: 10,
  },
  exerciseItem: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  exerciseName: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  exerciseMeta: {
    fontFamily: "Inter_400Regular",
    color: "#6B5E58",
    marginTop: 4,
  },
  mealItem: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  mealItemCompleted: {
    backgroundColor: Colors.palette.sand,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mealTitle: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  mealCalories: {
    fontFamily: "Inter_500Medium",
    color: Colors.light.tint,
  },
  mealMacros: {
    fontFamily: "Inter_400Regular",
    color: "#6B5E58",
  },
  mealTags: {
    fontFamily: "Inter_400Regular",
    color: "#8C8C8C",
  },
  swapRow: {
    paddingTop: 8,
  },
  habitList: {
    gap: 10,
  },
  habitItem: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 14,
    backgroundColor: Colors.light.background,
    gap: 6,
  },
  habitItemCompleted: {
    backgroundColor: Colors.palette.sand,
  },
  habitTitle: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  habitDescription: {
    fontFamily: "Inter_400Regular",
    color: "#5C5C5C",
  },
  actionLink: {
    fontFamily: "Inter_500Medium",
    color: Colors.light.tint,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: "#8C726C",
  },
  pillRow: {
    flexDirection: "row",
    gap: 12,
  },
  energyPill: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  energyPillSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  energyLabel: {
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  energyLabelSelected: {
    color: Colors.light.background,
  },
});
