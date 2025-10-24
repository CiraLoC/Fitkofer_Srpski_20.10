import type {
  CalendarData,
  CalendarDaySummary,
  DailyLog,
  DayIntensity,
  DailyNutritionPlan,
  GeneratedPlan,
  WorkoutSession,
} from '@/types';
import { formatLocalISODate } from '@/lib/utils/date';

const MS_IN_DAY = 1000 * 60 * 60 * 24;
const DAY_LABELS = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'];

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getDayOfWeek(date: Date) {
  return (date.getDay() + 6) % 7; // Monday = 0
}

function getNutritionForDay(
  dayIndex: number,
  weeklyPlan: Map<number, DailyNutritionPlan>,
  rotation: DayIntensity[],
  planByDayType: Record<DayIntensity, DailyNutritionPlan>,
): DailyNutritionPlan | undefined {
  const direct = weeklyPlan.get(dayIndex);
  if (direct) {
    return direct;
  }
  const dayType = rotation[dayIndex];
  return planByDayType[dayType];
}

function buildWorkoutSummary(
  sessionId: string | undefined,
  sessionLookup: Map<string, WorkoutSession>,
  completedIds: string[],
) {
  if (!sessionId) return null;
  const session = sessionLookup.get(sessionId);
  if (!session) return null;
  return {
    id: session.id,
    title: session.title,
    focus: session.focus,
    completed: completedIds.includes(session.id),
  };
}

export function createMonthlyCalendar(plan: GeneratedPlan, logs: Record<string, DailyLog>): CalendarData {
  const subscriptionStart = startOfDay(plan.subscriptionStart ? new Date(plan.subscriptionStart) : new Date(plan.createdAt));
  const subscriptionEnd = startOfDay(plan.subscriptionEnd ? new Date(plan.subscriptionEnd) : new Date(subscriptionStart.getTime() + 29 * MS_IN_DAY));

  const calendarStart = new Date(subscriptionStart);
  calendarStart.setDate(calendarStart.getDate() - getDayOfWeek(subscriptionStart));
  const calendarEnd = new Date(subscriptionEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - getDayOfWeek(subscriptionEnd)));

  const scheduleLookup = new Map<number, string | undefined>();
  plan.training.schedule.forEach((entry) => {
    scheduleLookup.set(entry.day, entry.sessionId);
  });
  const sessionLookup = new Map<string, WorkoutSession>();
  plan.training.sessions.forEach((session) => {
    sessionLookup.set(session.id, session);
  });

  const weeklyNutrition = new Map<number, DailyNutritionPlan>();
  plan.nutrition.weeklyPlan.forEach((planDay) => {
    weeklyNutrition.set(planDay.dayIndex ?? 0, planDay);
  });

  const habits = plan.habits.dailyHabits;
  const todayStart = startOfDay(new Date());
  const todayISO = formatLocalISODate(todayStart);

  const weeks: CalendarData['weeks'] = [];
  const daysByDate: Record<string, CalendarDaySummary> = {};
  let currentWeek: CalendarDaySummary[] = [];

  for (let cursor = new Date(calendarStart); cursor <= calendarEnd; cursor.setDate(cursor.getDate() + 1)) {
    const isoDate = formatLocalISODate(cursor);
    const legacyIsoDate = cursor.toISOString().split('T')[0];
    const inSubscription = cursor >= subscriptionStart && cursor <= subscriptionEnd;
    const dayOfWeek = getDayOfWeek(cursor);
    const isFuture = cursor > todayStart;
    const log = isFuture ? undefined : logs[isoDate] ?? logs[legacyIsoDate];
    const completedWorkouts = log?.workoutsCompleted ?? [];
    const completedMeals = new Set(log?.mealsCompleted ?? []);
    const completedHabits = new Set(log?.habitsCompleted ?? []);

    let dayType: DayIntensity | undefined;
    let mealsForDay: DailyNutritionPlan['meals'] = [];

    const diffFromStart = Math.floor((cursor.getTime() - subscriptionStart.getTime()) / MS_IN_DAY);
    const rotationIndex = ((getDayOfWeek(subscriptionStart) + Math.max(diffFromStart, 0)) % 7 + 7) % 7;

    if (inSubscription) {
      const nutritionForDay = getNutritionForDay(
        rotationIndex,
        weeklyNutrition,
        plan.nutrition.rotation,
        plan.nutrition.planByDayType,
      );
      dayType = nutritionForDay?.dayType;
      mealsForDay = nutritionForDay?.meals ?? [];
    }

    const workoutSummary = inSubscription
      ? buildWorkoutSummary(scheduleLookup.get(rotationIndex), sessionLookup, completedWorkouts)
      : null;

    const daySummary: CalendarDaySummary = {
      date: isoDate,
      dayNumber: cursor.getDate(),
      dayLabel: DAY_LABELS[dayOfWeek],
      inSubscription,
      isToday: isoDate === todayISO,
      isFuture,
      dayType,
      workout: workoutSummary,
      meals: mealsForDay.map((meal) => ({
        id: meal.id,
        title: meal.title,
        completed: completedMeals.has(meal.id),
      })),
      habits: habits.map((habit) => ({
        id: habit.id,
        title: habit.title,
        completed: completedHabits.has(habit.id),
      })),
    };

    currentWeek.push(daySummary);
    daysByDate[isoDate] = daySummary;

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return {
    start: subscriptionStart.toISOString(),
    end: subscriptionEnd.toISOString(),
    weeks,
    daysByDate,
  };
}
