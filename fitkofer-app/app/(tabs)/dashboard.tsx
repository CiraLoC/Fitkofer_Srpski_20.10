import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import Screen from "@/components/ui/Screen";
import Card from "@/components/ui/Card";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { H1, H2, Body, Label } from "@/components/ui/Typography";
import Colors from "@/constants/Colors";
import { formatLocalISODate } from "@/lib/utils/date";
import { useAppState } from "@/state/AppStateContext";
import type { DayIntensity, StressLevel } from "@/types";

type ThemeColors = typeof Colors.light;

const dayLabels = [
  "Ponedeljak",
  "Utorak",
  "Sreda",
  "Cetvrtak",
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
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const accentSurface = scheme === "light" ? Colors.palette.cream : "#26201C";
  const completedSurface = scheme === "light" ? Colors.palette.sand : "#332720";
  const styles = useMemo(
    () => createStyles(theme, accentSurface, completedSurface),
    [theme, accentSurface, completedSurface],
  );

  const {
    plan,
    logs,
    toggleWorkoutCompletion,
    toggleMealCompletion,
    toggleHabitCompletion,
    setDailyEnergy,
    membershipStatus,
  } = useAppState();
  const hasActiveMembership = ["active", "trialing", "grace"].includes(
    membershipStatus,
  );
  const today = useMemo(() => new Date(), []);
  const isoDate = formatLocalISODate(today);
  const log = logs[isoDate];

  const fadeAnim = useRef(new Animated.Value(0));
  useEffect(() => {
    Animated.timing(fadeAnim.current, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  if (!plan) {
    return (
      <Screen>
        <View style={styles.emptyState}>
          <Logo style={styles.emptyLogo} />
          <H2 style={styles.emptyHeading}>Aktiviraj svoj plan</H2>
          <Body style={styles.emptyCopy}>
            {hasActiveMembership
              ? "Nema generisanog plana. Prodji onboarding i kreiraj personalizovane treninge i ishranu."
              : "Aktiviraj Whop clanstvo da bi otkljucala plan, treninge i svakodnevne navike."}
          </Body>
        </View>
      </Screen>
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
    <Screen scroll contentPadding={24}>
      <Animated.View style={[styles.fadeIn, { opacity: fadeAnim.current }]}>
        <View style={styles.headerRow}>
          <View>
            <H1 style={styles.greeting}>Zdravo!</H1>
            <Body style={styles.dateText}>
              {dayLabels[dayIndex]}, {today.toLocaleDateString("sr-RS")}
            </Body>
          </View>
          <ThemeToggle />
        </View>

        <Card style={styles.cardSpacing}>
          <H2>Uspesnost</H2>
          <Text style={styles.adherenceValue}>{adherence}%</Text>
          <Body>Dnevni progres za plan</Body>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${adherence}%` }]} />
          </View>
        </Card>

        <Card style={styles.cardSpacing}>
          <H2>Danasnji fokus</H2>
          <Body>{intensityCopy[rotation]}</Body>
          <Text style={styles.macroHighlight}>
            {dailyNutrition.calories} kcal / P {dailyNutrition.protein}g / U{" "}
            {dailyNutrition.carbs}g / M {dailyNutrition.fats}g
          </Text>
        </Card>

        <Card style={styles.cardSpacing}>
          <View style={styles.cardHeader}>
            <H2>Trening</H2>
            {workout ? (
              <TouchableOpacity
                onPress={() => toggleWorkoutCompletion(isoDate, workout.id)}
              >
                <Label style={styles.actionLink}>
                  {log?.workoutsCompleted.includes(workout.id)
                    ? "Ponisti"
                    : "Oznaci kao zavrseno"}
                </Label>
              </TouchableOpacity>
            ) : null}
          </View>
          {workout ? (
            <View style={styles.workoutContent}>
              <Text style={styles.workoutTitle}>{workout.title}</Text>
              <Body>
                {workout.durationMinutes} min / {workout.exercises.length} vezbi
              </Body>
              <View style={styles.exerciseList}>
                {workout.exercises.map((exercise) => (
                  <View key={exercise.id} style={styles.exerciseItem}>
                    <View style={styles.exerciseHeader}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Label style={styles.exerciseMeta}>
                        {exercise.sets} serije / {exercise.repRange} ponavljanja
                        / {exercise.equipment}
                      </Label>
                    </View>
                    <Body style={styles.exerciseDetail}>
                      {exercise.instructions}
                    </Body>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <Body>
              Danas nema planiranog treninga. Fokus na laganu setnju, mobilnost
              i disanje.
            </Body>
          )}
        </Card>

        <Card style={styles.cardSpacing}>
          <H2>Obroci</H2>
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
                activeOpacity={0.82}
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
                  <Label style={styles.mealCalories}>
                    {meal.calories} kcal
                  </Label>
                </View>
                <Label style={styles.mealMacros}>
                  P {meal.protein}g / U {meal.carbs}g / M {meal.fats}g
                </Label>
                <Body style={styles.mealTags}>{meal.tags.join(" | ")}</Body>
              </TouchableOpacity>
            );
          })}
          <Body style={styles.swapHint}>
            Treba zamena? Na ekranu Ishrana mozes izabrati alternativu.
          </Body>
        </Card>

        <Card style={styles.cardSpacing}>
          <H2>Navike</H2>
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
                  activeOpacity={0.82}
                >
                  <Text
                    style={[
                      styles.habitTitle,
                      completed ? styles.completedText : undefined,
                    ]}
                  >
                    {habit.title}
                  </Text>
                  <Body style={styles.habitDescription}>
                    {habit.description}
                  </Body>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card style={styles.cardSpacing}>
          <H2>Energija</H2>
          <Body>Kako se osecas danas?</Body>
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
                  activeOpacity={0.85}
                >
                  <Label
                    style={[
                      styles.energyLabel,
                      selected ? styles.energyLabelSelected : undefined,
                    ]}
                  >
                    {option.label}
                  </Label>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      </Animated.View>
    </Screen>
  );
}

const createStyles = (
  theme: ThemeColors,
  accentSurface: string,
  completedSurface: string,
) =>
  StyleSheet.create({
    fadeIn: {
      gap: 18,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    greeting: {
      fontSize: 26,
    },
    dateText: {
      color: theme.mutedText,
    },
    cardSpacing: {
      gap: 12,
    },
    adherenceValue: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 36,
      color: theme.tint,
    },
    progressBar: {
      height: 8,
      backgroundColor: accentSurface,
      borderRadius: 999,
    },
    progressFill: {
      height: "100%",
      backgroundColor: theme.tint,
      borderRadius: 999,
    },
    macroHighlight: {
      fontFamily: "Inter_500Medium",
      color: theme.text,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    workoutContent: {
      gap: 10,
    },
    workoutTitle: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 16,
      color: theme.text,
    },
    exerciseList: {
      gap: 10,
    },
    exerciseItem: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: accentSurface,
      padding: 14,
      gap: 6,
    },
    exerciseHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    exerciseName: {
      fontFamily: "Inter_600SemiBold",
      color: theme.text,
    },
    exerciseMeta: {
      color: theme.mutedText,
    },
    exerciseDetail: {
      color: theme.mutedText,
    },
    actionLink: {
      color: theme.tint,
    },
    mealItem: {
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: accentSurface,
      gap: 8,
    },
    mealItemCompleted: {
      backgroundColor: completedSurface,
    },
    mealHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    mealTitle: {
      fontFamily: "Inter_600SemiBold",
      color: theme.text,
    },
    mealCalories: {
      color: theme.tint,
      minWidth: 64,
      textAlign: "right",
      fontFamily: "Inter_600SemiBold",
    },
    mealMacros: {
      color: theme.mutedText,
    },
    mealTags: {
      color: theme.mutedText,
    },
    swapHint: {
      color: theme.mutedText,
    },
    habitList: {
      gap: 10,
    },
    habitItem: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: accentSurface,
      padding: 14,
      gap: 6,
    },
    habitItemCompleted: {
      backgroundColor: completedSurface,
    },
    habitTitle: {
      fontFamily: "Inter_600SemiBold",
      color: theme.text,
    },
    habitDescription: {
      color: theme.mutedText,
    },
    completedText: {
      textDecorationLine: "line-through",
      color: theme.mutedText,
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
      borderColor: theme.border,
      backgroundColor: accentSurface,
    },
    energyPillSelected: {
      backgroundColor: theme.tint,
      borderColor: theme.tint,
    },
    energyLabel: {
      color: theme.text,
    },
    energyLabelSelected: {
      color: theme.background,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
      gap: 16,
    },
    emptyLogo: {
      width: 80,
      height: 80,
    },
    emptyHeading: {
      textAlign: "center",
    },
    emptyCopy: {
      textAlign: "center",
      maxWidth: 320,
      color: theme.mutedText,
    },
  });
