import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import Screen from "@/components/ui/Screen";
import Card from "@/components/ui/Card";
import { H1, H2, Body, Label } from "@/components/ui/Typography";
import Colors from "@/constants/Colors";
import { formatLocalISODate } from "@/lib/utils/date";
import { useAppState } from "@/state/AppStateContext";
import type { CalendarDaySummary } from "@/types";

const localeFormatter = new Intl.DateTimeFormat("sr-RS", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(isoDate: string) {
  return localeFormatter.format(new Date(isoDate));
}

function formatFocus(focus: CalendarDaySummary["workout"]) {
  if (!focus) return "Oporavak / šetnja";
  return `${focus.title}${focus.completed ? " ✓" : ""}`;
}

const buildStyles = (
  theme: typeof Colors.light | typeof Colors.dark,
  surfaces: {
    calendar: string;
    disabled: string;
    selected: string;
    badge: string;
  },
) =>
  StyleSheet.create({
    stack: {
      gap: 18,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
      gap: 16,
    },
    emptyText: {
      fontFamily: "Inter_500Medium",
      color: theme.text,
      textAlign: "center",
    },
    calendarCard: {
      gap: 16,
    },
    calendarHint: {
      color: theme.mutedText,
    },
    calendarGrid: {
      gap: 12,
    },
    weekRow: {
      flexDirection: "row",
      gap: 8,
      justifyContent: "space-between",
    },
    dayCell: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: surfaces.calendar,
      minWidth: 44,
      gap: 4,
    },
    dayCellDisabled: {
      backgroundColor: surfaces.disabled,
      borderColor: surfaces.disabled,
    },
    dayCellToday: {
      borderColor: theme.tint,
    },
    dayCellSelected: {
      backgroundColor: surfaces.selected,
      borderColor: surfaces.selected,
    },
    dayNumber: {
      fontFamily: "Inter_600SemiBold",
      color: theme.text,
    },
    dayNumberMuted: {
      color: theme.mutedText,
      opacity: 0.6,
    },
    dayBadge: {
      fontFamily: "Inter_500Medium",
      fontSize: 12,
      color: surfaces.badge,
    },
    detailsCard: {
      gap: 12,
    },
    summaryText: {
      color: theme.mutedText,
    },
    sectionLabel: {
      fontFamily: "Inter_600SemiBold",
      color: theme.text,
      marginTop: 6,
    },
    summaryDetail: {
      color: theme.mutedText,
    },
  });

export default function PlannerScreen() {
  const { plan, monthlyCalendar, membershipStatus } = useAppState();
  const hasActiveMembership = ["active", "trialing", "grace"].includes(
    membershipStatus,
  );
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const surfaces = useMemo(
    () => ({
      calendar: scheme === "light" ? Colors.palette.cream : "#211A16",
      disabled: scheme === "light" ? "#F0E5DB" : "#1A1512",
      selected:
        scheme === "light"
          ? Colors.palette.terracotta
          : Colors.palette.terracottaSoft,
      badge: scheme === "light" ? theme.tint : theme.tint,
    }),
    [scheme, theme.tint],
  );
  const styles = useMemo(() => buildStyles(theme, surfaces), [theme, surfaces]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const subscriptionStart = plan?.subscriptionStart ?? plan?.createdAt ?? "";
  const subscriptionEnd = plan?.subscriptionEnd ?? plan?.createdAt ?? "";

  useEffect(() => {
    if (!plan || !monthlyCalendar) return;
    const todayIso = formatLocalISODate(new Date());
    const defaultDate = monthlyCalendar.daysByDate[todayIso]?.inSubscription
      ? todayIso
      : formatLocalISODate(new Date(subscriptionStart));
    setSelectedDate(defaultDate);
  }, [monthlyCalendar, plan, subscriptionStart]);

  const selectedDay = useMemo(
    () =>
      selectedDate && monthlyCalendar
        ? (monthlyCalendar.daysByDate[selectedDate] ?? null)
        : null,
    [monthlyCalendar, selectedDate],
  );

  if (!plan || !monthlyCalendar) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Body style={styles.emptyText}>
            {hasActiveMembership
              ? "Plan još nije generisan."
              : "Aktiviraj Whop članstvo da bi otključala planer i navike."}
          </Body>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll contentPadding={24}>
      <View style={styles.stack}>
        <View>
          <H1>Mesečni planer</H1>
          <Body style={styles.calendarHint}>
            Prati plan od {formatDate(subscriptionStart)} do{" "}
            {formatDate(subscriptionEnd)}. Dodirni dan da vidiš trening, obroke
            i navike.
          </Body>
        </View>

        <Card style={styles.calendarCard}>
          <H2>Kalendarski pregled</H2>
          <View style={styles.calendarGrid}>
            {monthlyCalendar.weeks.map((week, index) => (
              <View key={`week-${index}`} style={styles.weekRow}>
                {week.map((day) => {
                  const isSelected = day.date === selectedDate;
                  const isDisabled = !day.inSubscription;
                  return (
                    <TouchableOpacity
                      key={day.date}
                      style={[
                        styles.dayCell,
                        isDisabled && styles.dayCellDisabled,
                        day.isToday && styles.dayCellToday,
                        isSelected && styles.dayCellSelected,
                      ]}
                      onPress={() => !isDisabled && setSelectedDate(day.date)}
                      disabled={isDisabled}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          isDisabled && styles.dayNumberMuted,
                        ]}
                      >
                        {day.dayNumber}
                      </Text>
                      {day.workout ? (
                        <Text style={styles.dayBadge}>
                          {day.workout.completed ? "T✓" : "T"}
                        </Text>
                      ) : null}
                      {day.meals.length > 0 ? (
                        <Text style={styles.dayBadge}>
                          {day.meals.filter((meal) => meal.completed).length}/
                          {day.meals.length}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </Card>

        {selectedDay ? (
          <Card style={styles.detailsCard}>
            <H2>Detalji za {formatDate(selectedDay.date)}</H2>
            <Body style={styles.summaryText}>
              Energetski dan:{" "}
              {selectedDay.dayType
                ? selectedDay.dayType.toUpperCase()
                : "van plana"}
            </Body>
            <Body style={styles.summaryText}>
              Trening: {formatFocus(selectedDay.workout)}
            </Body>

            <Label style={styles.sectionLabel}>Obroci</Label>
            {selectedDay.meals.map((meal) => (
              <Body key={meal.id} style={styles.summaryDetail}>
                {meal.completed ? "✓" : "•"} {meal.title}
              </Body>
            ))}

            <Label style={styles.sectionLabel}>Navike</Label>
            {selectedDay.habits.map((habit) => (
              <Body key={habit.id} style={styles.summaryDetail}>
                {habit.completed ? "✓" : "•"} {habit.title}
              </Body>
            ))}

            <Label style={styles.sectionLabel}>Nedeljni izazov</Label>
            <Body style={styles.summaryDetail}>
              {plan.habits.weeklyChallenge}
            </Body>
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}

PlannerScreen.displayName = "PlannerScreen";
