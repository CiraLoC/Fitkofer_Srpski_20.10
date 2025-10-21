import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useAppState } from '@/state/AppStateContext';
import type { DayIntensity } from '@/types';

const dayLabels = ['PON', 'UTO', 'SRE', 'ČET', 'PET', 'SUB', 'NED'];

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
        <Text style={styles.emptyText}>Nema planirane ishrane. Generiši plan kroz onboarding.</Text>
      </View>
    );
  }

  const dayType = plan.nutrition.rotation[selectedDay];
  const nutrition = plan.nutrition.planByDayType[dayType];
  const isoDate = useMemo(() => {
    const current = new Date();
    const diff = selectedDay - ((current.getDay() + 6) % 7);
    const target = new Date(current);
    target.setDate(current.getDate() + diff);
    return target.toISOString().split('T')[0];
  }, [selectedDay]);
  const log = logs[isoDate];

  const shoppingList = useMemo(() => {
    const entries = nutrition.meals
      .map((meal) => meal.ingredients)
      .flat()
      .reduce<Record<string, number>>((acc, ingredient) => {
        const key = ingredient.toLowerCase();
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {});
    return Object.entries(entries)
      .map(([ingredient, count]) => (count > 1 ? `${ingredient} x${count}` : ingredient))
      .sort();
  }, [nutrition.meals]);

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
            <Text style={styles.macroValue}>{nutrition.calories}</Text>
            <Text style={styles.macroLabel}>kcal</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{nutrition.protein}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{nutrition.carbs}g</Text>
            <Text style={styles.macroLabel}>Ugljeni hidrati</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{nutrition.fats}g</Text>
            <Text style={styles.macroLabel}>Masti</Text>
          </View>
        </View>
      </View>

      {nutrition.meals.map((meal) => {
        const completed = log?.mealsCompleted.includes(meal.id);
        return (
          <View key={meal.id} style={styles.card}>
            <View style={styles.mealHeader}>
              <View>
                <Text style={styles.cardTitle}>{meal.title}</Text>
                <Text style={styles.mealMeta}>
                  {meal.calories} kcal · P {meal.protein}g · U {meal.carbs}g · M {meal.fats}g
                </Text>
              </View>
              <TouchableOpacity onPress={() => toggleMealCompletion(isoDate, meal.id)}>
                <Text style={styles.actionLink}>{completed ? 'Poništi' : 'Označi kao pojedeno'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.tagRow}>{meal.tags.join(' • ')}</Text>
            <Text style={styles.sectionTitle}>Sastojci</Text>
            {meal.ingredients.map((ingredient) => (
              <Text key={ingredient} style={styles.ingredient}>
                • {ingredient}
              </Text>
            ))}
            <Text style={styles.sectionTitle}>Priprema</Text>
            <Text style={styles.instructions}>{meal.instructions}</Text>
          </View>
        );
      })}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Zamene obroka</Text>
        <Text style={styles.copy}>Biraj zamenu ako želiš varijaciju, kalorijska kategorija ostaje ista.</Text>
        <View style={styles.swapList}>
          {plan.nutrition.planByDayType.mid.swaps.map((swap) => (
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
          <Text key={item} style={styles.ingredient}>
            • {item}
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
    gap: 18,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.light.background,
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
    fontSize: 20,
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
