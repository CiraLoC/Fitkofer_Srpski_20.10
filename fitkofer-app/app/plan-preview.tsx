import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import Colors from '@/constants/Colors';
import { useAppState } from '@/state/AppStateContext';
import type { DayIntensity } from '@/types';

const dayLabels = ['Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota', 'Nedelja'];

const intensityLabels: Record<DayIntensity, string> = {
  low: 'Low',
  mid: 'Mid',
  high: 'High',
};

export default function PlanPreviewScreen() {
  const router = useRouter();
  const { plan, profile } = useAppState();

  const schedule = useMemo(() => {
    if (!plan) return [];
    return plan.training.schedule.map((slot) => {
      const session = plan.training.sessions.find((item) => item.id === slot.sessionId);
      return {
        dayIndex: slot.day,
        title: session ? session.title : 'Oporavak',
        focus: session?.focus ?? 'Off',
      };
    });
  }, [plan]);

  if (!plan || !profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Generiši plan kroz onboarding da bi ga videla.</Text>
      </View>
    );
  }

  const handleStart = () => {
    router.replace('/(tabs)');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pregled plana</Text>
      <Text style={styles.subtitle}>
        Kreirano {new Date(plan.createdAt).toLocaleDateString('sr-RS', { day: '2-digit', month: 'short' })}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trening split</Text>
        <Text style={styles.bodyText}>{plan.training.split}</Text>
        <View style={styles.scheduleGrid}>
          {schedule.map((item) => (
            <View key={item.dayIndex} style={styles.scheduleItem}>
              <Text style={styles.scheduleDay}>{dayLabels[item.dayIndex]}</Text>
              <Text style={styles.scheduleFocus}>{item.title}</Text>
              <Text style={styles.schedulePill}>{item.focus}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kalorijska rotacija</Text>
        <View style={styles.rotationRow}>
          {plan.nutrition.rotation.map((intensity, index) => (
            <View key={`${intensity}-${index}`} style={styles.rotationItem}>
              <Text style={styles.rotationDay}>{dayLabels[index].slice(0, 3)}</Text>
              <Text style={[styles.rotationBadge, styles[`rotationBadge${intensity}`]]}>
                {intensityLabels[intensity]}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.macrosRow}>
          {(Object.keys(plan.nutrition.planByDayType) as DayIntensity[]).map((key) => {
            const entry = plan.nutrition.planByDayType[key];
            return (
              <View key={key} style={styles.macroCard}>
                <Text style={styles.macroTitle}>{intensityLabels[key]} dan</Text>
                <Text style={styles.macroValue}>{entry.calories} kcal</Text>
                <Text style={styles.macroDetail}>P {entry.protein}g · U {entry.carbs}g · M {entry.fats}g</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Habiti</Text>
        {plan.habits.dailyHabits.map((habit) => (
          <View style={styles.habitItem} key={habit.id}>
            <Text style={styles.habitTitle}>{habit.title}</Text>
            <Text style={styles.habitDescription}>{habit.description}</Text>
          </View>
        ))}
        <View style={styles.challenge}>
          <Text style={styles.challengeTitle}>Nedeljni izazov</Text>
          <Text style={styles.habitDescription}>{plan.habits.weeklyChallenge}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleStart}>
        <Text style={styles.primaryLabel}>Idi na dashboard</Text>
      </TouchableOpacity>
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
    paddingBottom: 60,
    gap: 20,
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
    textAlign: 'center',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: Colors.light.text,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    color: '#5C5C5C',
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 16,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.light.text,
  },
  bodyText: {
    fontFamily: 'Inter_400Regular',
    color: '#4A4A4A',
  },
  scheduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  scheduleItem: {
    width: '47%',
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  scheduleDay: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.text,
  },
  scheduleFocus: {
    fontFamily: 'Inter_500Medium',
    color: '#6B5E58',
    marginTop: 4,
  },
  schedulePill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.light.tint,
    color: Colors.light.background,
    fontFamily: 'Inter_500Medium',
  },
  rotationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rotationItem: {
    alignItems: 'center',
    gap: 8,
  },
  rotationDay: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
  rotationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.background,
  },
  rotationBadgelow: {
    backgroundColor: Colors.palette.olive,
  },
  rotationBadgemid: {
    backgroundColor: Colors.palette.terracotta,
  },
  rotationBadgehigh: {
    backgroundColor: '#D1634D',
  },
  macrosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  macroCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    flexBasis: '30%',
    flexGrow: 1,
  },
  macroTitle: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
  macroValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.light.tint,
    marginTop: 6,
  },
  macroDetail: {
    fontFamily: 'Inter_400Regular',
    marginTop: 6,
    color: '#5C5C5C',
  },
  habitItem: {
    borderRadius: 14,
    padding: 16,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 6,
  },
  habitTitle: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.text,
  },
  habitDescription: {
    fontFamily: 'Inter_400Regular',
    color: '#5C5C5C',
    lineHeight: 20,
  },
  challenge: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.palette.olive,
  },
  challengeTitle: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.background,
    marginBottom: 8,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryLabel: {
    color: Colors.light.background,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
});
