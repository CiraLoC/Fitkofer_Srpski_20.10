import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Colors from '@/constants/Colors';
import { formatLocalISODate } from '@/lib/utils/date';
import { useAppState } from '@/state/AppStateContext';
import type { DayIntensity } from '@/types';

const dayLabels = ['PON', 'UTO', 'SRE', 'CET', 'PET', 'SUB', 'NED'];

const intensityLabels: Record<DayIntensity, string> = {
  low: 'Low dan',
  mid: 'Mid dan',
  high: 'High dan',
};

export default function NutritionScreen() {
  const { plan, logs, toggleMealCompletion } = useAppState();
  const today = useMemo(() => new Date(), []);
  const defaultDay = ((today.getDay() + 6) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const [selectedDay, setSelectedDay] = useState<number>(defaultDay);

  if (!plan) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Nema planirane ishrane. Generisi plan kroz onboarding.</Text>
      </View>
    );
  }

  const fallbackDayType = plan.nutrition.rotation[selectedDay];
  const fallbackPlan = plan.nutrition.planByDayType[fallbackDayType];
  const dayPlan =
    plan.nutrition.weeklyPlan?.[selectedDay] ??
    ({
      ...fallbackPlan,
      dayIndex: selectedDay,
      dayName: dayLabels[selectedDay],
    } as typeof fallbackPlan & { dayIndex: number; dayName: string });
  const dayType = dayPlan.dayType ?? fallbackDayType;

  const isoDate = useMemo(() => {
    const current = new Date();
    const diff = selectedDay - ((current.getDay() + 6) % 7);
    const target = new Date(current);
    target.setDate(current.getDate() + diff);
    return formatLocalISODate(target);
  }, [selectedDay]);
  const log = logs[isoDate];

  const shoppingList = useMemo(() => {
    const accumulator = dayPlan.meals
      .map((meal) => meal.ingredients)
      .flat()
      .reduce<Record<string, { quantity: number; unit: string }>>((acc, ingredient) => {
        const key = ingredient.name.toLowerCase();
        const existing = acc[key];
        acc[key] = {
          quantity: (existing?.quantity ?? 0) + ingredient.quantity,
          unit: ingredient.unit,
        };
        return acc;
      }, {});

    return Object.entries(accumulator)
      .map(([name, details]) => {
        const quantity = Math.round(details.quantity * 10) / 10;
        return `${name} (${quantity}${details.unit})`;
      })
      .sort();
  }, [dayPlan.meals]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.heading}>Plan ishrane</Text>
        <Text style={styles.subheading}>{intensityLabels[dayType]}</Text>
      </View>

      <View style={styles.daySelector}>
        {dayLabels.map((label, index) => {
          const selected = index === selectedDay;
          return (
            <TouchableOpacity
              key={label}
              style={[styles.dayPill, selected ? styles.dayPillSelected : undefined]}
              onPress={() => setSelectedDay(index)}
            >
              <Text style={[styles.dayLabel, selected ? styles.dayLabelSelected : undefined]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Makroi</Text>
        <View style={styles.macrosRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{dayPlan.calories}</Text>
            <Text style={styles.macroLabel}>kcal</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{dayPlan.protein}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{dayPlan.carbs}g</Text>
            <Text style={styles.macroLabel}>Ugljeni hidrati</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{dayPlan.fats}g</Text>
            <Text style={styles.macroLabel}>Masti</Text>
          </View>
        </View>
      </View>

      {dayPlan.meals.map((meal) => {
        const completed = log?.mealsCompleted.includes(meal.id);
        return (
          <View key={meal.id} style={styles.card}>
            <View style={styles.mealHeader}>
              <View>
                <Text style={styles.cardTitle}>{meal.title}</Text>
                <Text style={styles.mealMeta}>
                  {meal.calories} kcal • P {meal.protein}g • U {meal.carbs}g • M {meal.fats}g
                </Text>
              </View>
              <TouchableOpacity onPress={() => toggleMealCompletion(isoDate, meal.id)}>
                <Text style={styles.actionLink}>{completed ? 'Ponisti' : 'Oznaci kao pojedeno'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.tagRow}>{meal.tags.join(' | ')}</Text>
            <Text style={styles.sectionTitle}>Sastojci</Text>
            {meal.ingredients.map((ingredient) => (
              <Text key={`${meal.id}-${ingredient.name}`} style={styles.ingredient}>
                - {Math.round(ingredient.quantity * 10) / 10}
                {ingredient.unit} {ingredient.name} ({Math.round(ingredient.calories)} kcal)
              </Text>
            ))}
            <Text style={styles.sectionTitle}>Priprema</Text>
            {meal.instructions.map((step, index) => (
              <Text key={`${meal.id}-step-${index}`} style={styles.instructions}>
                {index + 1}. {step}
              </Text>
            ))}
          </View>
        );
      })}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Zamene obroka</Text>
        <Text style={styles.copy}>Izaberi zamenu ako ti treba varijacija, kalorije ostaju u istoj zoni.</Text>
        <View style={styles.swapList}>
          {dayPlan.swaps.map((swap) => (
            <View key={swap.id} style={styles.swapItem}>
              <Text style={styles.swapIcon}>{swap.icon}</Text>
              <Text style={styles.swapLabel}>{swap.title}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lista za kupovinu</Text>
        {shoppingList.map((item) => (
          <Text key={item} style={styles.copy}>
            - {item}
          </Text>
        ))}
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
    gap: 16,
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
  header: {
    gap: 6,
  },
  heading: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: Colors.light.text,
  },
  subheading: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.tint,
  },
  daySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayPill: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  dayPillSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  dayLabel: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
  dayLabelSelected: {
    color: Colors.light.background,
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
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.tint,
    fontSize: 18,
  },
  macroLabel: {
    fontFamily: 'Inter_400Regular',
    color: '#6B5E58',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mealMeta: {
    fontFamily: 'Inter_400Regular',
    color: '#6B5E58',
    marginTop: 4,
  },
  tagRow: {
    fontFamily: 'Inter_400Regular',
    color: '#8C8C8C',
  },
  sectionTitle: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
    marginTop: 8,
  },
  ingredient: {
    fontFamily: 'Inter_400Regular',
    color: '#5C5C5C',
  },
  instructions: {
    fontFamily: 'Inter_400Regular',
    color: '#5C5C5C',
    lineHeight: 20,
  },
  copy: {
    fontFamily: 'Inter_400Regular',
    color: '#5C5C5C',
  },
  swapList: {
    gap: 10,
  },
  swapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  swapIcon: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  swapLabel: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
  actionLink: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.tint,
  },
});
