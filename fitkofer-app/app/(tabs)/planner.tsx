import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Colors from '@/constants/Colors';
import { formatLocalISODate } from '@/lib/utils/date';
import { useAppState } from '@/state/AppStateContext';
import type { CalendarDaySummary } from '@/types';

const localeFormatter = new Intl.DateTimeFormat('sr-RS', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatDate(isoDate: string) {
  return localeFormatter.format(new Date(isoDate));
}

function formatFocus(focus: CalendarDaySummary['workout']) {
  if (!focus) return 'Oporavak / šetnja';
  return `${focus.title}${focus.completed ? ' ✓' : ''}`;
}

function formatMealLabel(meal: { id: string; title: string; completed: boolean }) {
  return `${meal.completed ? '✓' : '○'} ${meal.title}`;
}

function formatHabitLabel(habit: { id: string; title: string; completed: boolean }) {
  return `${habit.completed ? '✓' : '○'} ${habit.title}`;
}

export default function PlannerScreen() {
  const { plan, monthlyCalendar } = useAppState();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const subscriptionStart = plan?.subscriptionStart ?? plan?.createdAt ?? '';
  const subscriptionEnd = plan?.subscriptionEnd ?? plan?.createdAt ?? '';

  useEffect(() => {
    if (!plan || !monthlyCalendar) return;
    const todayIso = formatLocalISODate(new Date());
    const defaultDate =
      monthlyCalendar.daysByDate[todayIso]?.inSubscription
        ? todayIso
        : formatLocalISODate(new Date(subscriptionStart));
    setSelectedDate(defaultDate);
  }, [monthlyCalendar, plan, subscriptionStart]);

  const selectedDay = useMemo(
    () => (selectedDate && monthlyCalendar ? monthlyCalendar.daysByDate[selectedDate] ?? null : null),
    [monthlyCalendar, selectedDate],
  );

  if (!plan || !monthlyCalendar) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Plan još nije generisan.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Mesečni planer</Text>
      <Text style={styles.copy}>
        Prati plan od {formatDate(subscriptionStart)} do {formatDate(subscriptionEnd)}. Dodirni dan da vidiš
        trening, obroke i navike.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kalendarski pregled</Text>
        <View style={styles.calendar}>
          {monthlyCalendar.weeks.map((week, index) => (
            <View key={`week-${index}`} style={styles.weekRow}>
              {week.map((day) => {
                const isSelected = day.date === selectedDate;
                const cellStyles = [
                  styles.dayCell,
                  !day.inSubscription && styles.dayCellDisabled,
                  day.isToday && styles.dayCellToday,
                  isSelected && styles.dayCellSelected,
                ];
                return (
                  <TouchableOpacity
                    key={day.date}
                    style={cellStyles}
                    onPress={() => day.inSubscription && setSelectedDate(day.date)}
                    disabled={!day.inSubscription}
                  >
                    <Text style={[styles.dayNumber, !day.inSubscription && styles.dayNumberMuted]}>
                      {day.dayNumber}
                    </Text>
                    {day.workout && <Text style={styles.dayBadge}>{day.workout.completed ? 'T✓' : 'T'}</Text>}
                    {day.meals.length > 0 && (
                      <Text style={styles.dayBadge}>
                        {day.meals.filter((meal) => meal.completed).length}/{day.meals.length}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {selectedDay ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalji za {formatDate(selectedDay.date)}</Text>
          <Text style={styles.summaryText}>
            Energetski dan: {selectedDay.dayType ? selectedDay.dayType.toUpperCase() : 'van plana'}
          </Text>
          <Text style={styles.summaryText}>Trening: {formatFocus(selectedDay.workout)}</Text>

          <Text style={styles.sectionLabel}>Obroci</Text>
          {selectedDay.meals.map((meal) => (
            <Text key={meal.id} style={styles.summaryDetail}>
              {formatMealLabel(meal)}
            </Text>
          ))}

          <Text style={styles.sectionLabel}>Navike</Text>
          {selectedDay.habits.map((habit) => (
            <Text key={habit.id} style={styles.summaryDetail}>
              {formatHabitLabel(habit)}
            </Text>
          ))}

          <Text style={styles.sectionLabel}>Nedeljni izazov</Text>
          <Text style={styles.summaryDetail}>{plan.habits.weeklyChallenge}</Text>
        </View>
      ) : null}
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
    paddingBottom: 100,
    gap: 18,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
    padding: 24,
  },
  emptyText: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
  heading: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: Colors.light.text,
  },
  copy: {
    fontFamily: 'Inter_400Regular',
    color: '#5C5C5C',
    lineHeight: 20,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.light.text,
  },
  calendar: {
    gap: 8,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayCell: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    gap: 4,
  },
  dayCellDisabled: {
    opacity: 0.4,
  },
  dayCellToday: {
    borderColor: Colors.light.tint,
  },
  dayCellSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  dayNumber: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.text,
  },
  dayNumberMuted: {
    color: '#8C8C8C',
  },
  dayBadge: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: Colors.light.text,
  },
  summaryText: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
  sectionLabel: {
    marginTop: 8,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.text,
  },
  summaryDetail: {
    fontFamily: 'Inter_400Regular',
    color: '#5C5C5C',
  },
});
