import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useAppState } from '@/state/AppStateContext';

const dayLabels = ['Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota', 'Nedelja'];

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = (date.getDay() + 6) % 7;
  result.setDate(date.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

export default function PlannerScreen() {
  const { plan, logs } = useAppState();

  if (!plan) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Plan još nije generisan.</Text>
      </View>
    );
  }

  const start = startOfWeek(new Date());
  const weekDays = Array.from({ length: 7 }, (_, idx) => {
    const current = new Date(start);
    current.setDate(start.getDate() + idx);
    const iso = current.toISOString().split('T')[0];
    const scheduleEntry = plan.training.schedule[idx];
    const session = plan.training.sessions.find((item) => item.id === scheduleEntry?.sessionId);
    const dayType = plan.nutrition.rotation[idx];
    const meals = plan.nutrition.planByDayType[dayType].meals;
    const habits = plan.habits.dailyHabits;
    const log = logs[iso];
    const total =
      (session ? 1 : 0) + meals.length + habits.length;
    const completed =
      (session && log?.workoutsCompleted.includes(session.id) ? 1 : 0) +
      meals.filter((meal) => log?.mealsCompleted.includes(meal.id)).length +
      habits.filter((habit) => log?.habitsCompleted.includes(habit.id)).length;
    const adherence = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      iso,
      label: dayLabels[idx],
      session,
      meals,
      habits,
      adherence,
      energy: log?.energy ?? null,
    };
  });

  const weeklyAdherence = useMemo(() => {
    const values = weekDays.filter((day) => day.adherence > 0).map((day) => day.adherence);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }, [weekDays]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Planer & evidencija</Text>
      <Text style={styles.copy}>
        Prati izvršenje tokom nedelje. Obeleži treninge, navike i obroke na početnom ekranu – ovde vidiš rezime.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nedeljna usklađenost</Text>
        <Text style={styles.metric}>{weeklyAdherence}%</Text>
        <Text style={styles.copy}>
          Cilj: 60%+ tokom 4 nedelje za stabilan napredak. Fokusiraj se na doslednost, ne perfekciju.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nedeljni izazov</Text>
        <Text style={styles.copy}>{plan.habits.weeklyChallenge}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dnevni pregled</Text>
        <View style={styles.weekList}>
          {weekDays.map((day) => (
            <View key={day.iso} style={styles.weekRow}>
              <Text style={styles.dayLabel}>{day.label}</Text>
              <View style={styles.weekSummary}>
                <Text style={styles.summaryText}>Adherencija: {day.adherence}%</Text>
                <Text style={styles.summaryText}>
                  Energija: {day.energy ? `nivo ${day.energy}` : '—'}
                </Text>
                <Text style={styles.summaryText}>
                  {day.session ? day.session.title : 'Oporavak / šetnja'}
                </Text>
                <Text style={styles.summaryDetail}>
                  Obroci: {day.meals.length} · Navike: {day.habits.length}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Podsetnici</Text>
        <Text style={styles.copy}>Postavi push notifikacije u Expo Settings (Integracije stižu u sledećoj verziji).</Text>
        <View style={styles.tipList}>
          <Text style={styles.tip}>• Jutro (07:30) – Priprema doručka i unos vode.</Text>
          <Text style={styles.tip}>• Popodne (17:30) – Podsetnik za trening ili šetnju.</Text>
          <Text style={styles.tip}>• Veče (21:30) – Isključivanje ekrana + NSDR.</Text>
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
  metric: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 32,
    color: Colors.light.tint,
  },
  weekList: {
    gap: 12,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 14,
  },
  dayLabel: {
    fontFamily: 'Inter_600SemiBold',
    width: 100,
    color: Colors.light.text,
  },
  weekSummary: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    padding: 12,
    gap: 4,
  },
  summaryText: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
  summaryDetail: {
    fontFamily: 'Inter_400Regular',
    color: '#6B5E58',
  },
  tipList: {
    gap: 8,
  },
  tip: {
    fontFamily: 'Inter_400Regular',
    color: '#5C5C5C',
  },
});
