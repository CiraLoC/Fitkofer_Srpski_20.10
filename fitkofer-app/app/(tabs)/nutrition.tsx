import { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import Screen from "@/components/ui/Screen";
import Card from "@/components/ui/Card";
import Logo from "@/components/ui/Logo";
import { H1, H2, Subtitle, Body, Label } from "@/components/ui/Typography";
import Colors from "@/constants/Colors";
import { formatLocalISODate } from "@/lib/utils/date";
import { useAppState } from "@/state/AppStateContext";
import type { DayIntensity } from "@/types";

type ThemeColors = typeof Colors.light;

const dayLabels = ["PON", "UTO", "SRE", "CET", "PET", "SUB", "NED"];

const intensityLabels: Record<DayIntensity, string> = {
  low: "Low dan",
  mid: "Mid dan",
  high: "High dan",
};

export default function NutritionScreen() {
  const { plan, logs, toggleMealCompletion, membershipStatus } = useAppState();
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const controlSurface = scheme === "light" ? theme.background : "#221B16";
  const elevatedSurface = scheme === "light" ? Colors.palette.cream : "#2A221E";
  const selectedTone =
    scheme === "light" ? theme.tint : Colors.palette.terracottaSoft;
  const selectedTextColor = scheme === "light" ? theme.background : theme.text;
  const styles = useMemo(
    () =>
      createStyles(
        theme,
        controlSurface,
        elevatedSurface,
        selectedTone,
        selectedTextColor,
      ),
    [theme, controlSurface, elevatedSurface, selectedTone, selectedTextColor],
  );

  const hasActiveMembership = ["active", "trialing", "grace"].includes(
    membershipStatus,
  );
  const today = useMemo(() => new Date(), []);
  const defaultDay = ((today.getDay() + 6) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const [selectedDay, setSelectedDay] = useState<number>(defaultDay);

  const isoDate = useMemo(() => {
    const current = new Date();
    const diff = selectedDay - ((current.getDay() + 6) % 7);
    const target = new Date(current);
    target.setDate(current.getDate() + diff);
    return formatLocalISODate(target);
  }, [selectedDay]);

  const dayContext = useMemo(() => {
    if (!plan) return null;
    const fallbackDayType = plan.nutrition.rotation[selectedDay];
    const fallbackPlan = plan.nutrition.planByDayType[fallbackDayType];
    const planForDay =
      plan.nutrition.weeklyPlan?.[selectedDay] ??
      ({
        ...fallbackPlan,
        dayIndex: selectedDay,
        dayName: dayLabels[selectedDay],
      } as typeof fallbackPlan & { dayIndex: number; dayName: string });
    const dayType = planForDay.dayType ?? fallbackDayType;
    return { dayPlan: planForDay, dayType };
  }, [plan, selectedDay]);

  const shoppingList = useMemo(() => {
    if (!dayContext) return [];
    const accumulator = dayContext.dayPlan.meals
      .map((meal) => meal.ingredients)
      .flat()
      .reduce<Record<string, { quantity: number; unit: string }>>(
        (acc, ingredient) => {
          const key = ingredient.name.toLowerCase();
          const existing = acc[key];
          acc[key] = {
            quantity: (existing?.quantity ?? 0) + ingredient.quantity,
            unit: ingredient.unit,
          };
          return acc;
        },
        {},
      );

    return Object.entries(accumulator)
      .map(([name, details]) => {
        const quantity = Math.round(details.quantity * 10) / 10;
        return `${name} (${quantity}${details.unit})`;
      })
      .sort();
  }, [dayContext]);

  if (!plan || !dayContext) {
    return (
      <Screen>
        <View style={styles.emptyState}>
          <Logo style={styles.emptyLogo} />
          <H2 style={styles.emptyHeading}>Plan ishrane nije spreman</H2>
          <Body style={styles.emptyCopy}>
            {hasActiveMembership
              ? "Prodji onboarding i generisi plan obroka prilagodjen tvom cilju."
              : "Aktiviraj Whop clanstvo da bi dobila personalizovane obroke."}
          </Body>
        </View>
      </Screen>
    );
  }

  const { dayPlan, dayType } = dayContext;
  const log = logs[isoDate];

  return (
    <Screen scroll contentPadding={24}>
      <View style={styles.stack}>
        <View style={styles.header}>
          <H1 style={styles.heading}>Plan ishrane</H1>
          <Subtitle style={styles.subheading}>
            {intensityLabels[dayType]}
          </Subtitle>
        </View>

        <View style={styles.daySelector}>
          {dayLabels.map((label, index) => {
            const selected = index === selectedDay;
            return (
              <TouchableOpacity
                key={label}
                style={[
                  styles.dayPill,
                  selected
                    ? {
                        backgroundColor: selectedTone,
                        borderColor: selectedTone,
                      }
                    : undefined,
                ]}
                onPress={() => setSelectedDay(index)}
                activeOpacity={0.85}
              >
                <Label
                  style={[
                    styles.dayLabel,
                    selected ? styles.dayLabelSelected : undefined,
                  ]}
                >
                  {label}
                </Label>
              </TouchableOpacity>
            );
          })}
        </View>

        <Card style={styles.cardSpacing}>
          <H2>Makroi dana</H2>
          <View style={styles.macrosRow}>
            <MacroTile
              label="kcal"
              value={`${dayPlan.calories}`}
              styles={styles}
            />
            <MacroTile
              label="Protein"
              value={`${dayPlan.protein}g`}
              styles={styles}
            />
            <MacroTile
              label="Ugljeni hidrati"
              value={`${dayPlan.carbs}g`}
              styles={styles}
            />
            <MacroTile
              label="Masti"
              value={`${dayPlan.fats}g`}
              styles={styles}
            />
          </View>
        </Card>

        {dayPlan.meals.map((meal) => {
          const completed = log?.mealsCompleted.includes(meal.id);
          return (
            <Card key={meal.id} style={styles.cardSpacing}>
              <View style={styles.mealHeader}>
                <View style={{ flex: 1 }}>
                  <H2>{meal.title}</H2>
                  <Label style={styles.mealMeta}>
                    {meal.calories} kcal / P {meal.protein}g / U {meal.carbs}g /
                    M {meal.fats}g
                  </Label>
                </View>
                <TouchableOpacity
                  onPress={() => toggleMealCompletion(isoDate, meal.id)}
                >
                  <Label style={styles.actionLink}>
                    {completed ? "Ponisti" : "Oznaci kao pojedeno"}
                  </Label>
                </TouchableOpacity>
              </View>
              <Body style={styles.tagRow}>{meal.tags.join(" | ")}</Body>
              <Text style={styles.sectionTitle}>Sastojci</Text>
              {meal.ingredients.map((ingredient) => (
                <Body
                  key={`${meal.id}-${ingredient.name}`}
                  style={styles.ingredient}
                >
                  - {Math.round(ingredient.quantity * 10) / 10}
                  {ingredient.unit} {ingredient.name} (
                  {Math.round(ingredient.calories)} kcal)
                </Body>
              ))}
              <Text style={styles.sectionTitle}>Priprema</Text>
              {meal.instructions.map((step, index) => (
                <Body
                  key={`${meal.id}-step-${index}`}
                  style={styles.instructions}
                >
                  {index + 1}. {step}
                </Body>
              ))}
            </Card>
          );
        })}

        <Card style={styles.cardSpacing}>
          <H2>Zamene obroka</H2>
          <Body style={styles.copy}>
            Treba varijacija? Odaberi zamenu sa slicnim kalorijama.
          </Body>
          <View style={styles.swapList}>
            {dayPlan.swaps.map((swap) => (
              <View key={swap.id} style={styles.swapItem}>
                <Text style={styles.swapIcon}>{swap.icon}</Text>
                <Body style={styles.swapLabel}>{swap.title}</Body>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.cardSpacing}>
          <H2>Lista za kupovinu</H2>
          {shoppingList.map((item) => (
            <Body key={item} style={styles.copy}>
              - {item}
            </Body>
          ))}
        </Card>
      </View>
    </Screen>
  );
}

type MacroTileProps = {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
};

function MacroTile({ label, value, styles }: MacroTileProps) {
  return (
    <View style={styles.macroTile}>
      <Text style={styles.macroValue}>{value}</Text>
      <Label style={styles.macroLabel}>{label}</Label>
    </View>
  );
}

const createStyles = (
  theme: ThemeColors,
  controlSurface: string,
  elevatedSurface: string,
  selectedTone: string,
  selectedTextColor: string,
) =>
  StyleSheet.create({
    stack: {
      gap: 18,
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
    header: {
      gap: 6,
    },
    heading: {
      fontSize: 26,
    },
    subheading: {
      color: theme.tint,
    },
    daySelector: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    dayPill: {
      flex: 1,
      marginHorizontal: 4,
      borderRadius: 14,
      paddingVertical: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: controlSurface,
    },
    dayLabel: {
      color: theme.text,
    },
    dayLabelSelected: {
      color: selectedTextColor,
    },
    cardSpacing: {
      gap: 12,
    },
    macrosRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    macroTile: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderRadius: 14,
      backgroundColor: elevatedSurface,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 4,
      minHeight: 84,
    },
    macroValue: {
      fontFamily: "Inter_600SemiBold",
      color: selectedTone,
      fontSize: 18,
      textAlign: "center",
    },
    macroLabel: {
      color: theme.mutedText,
      textAlign: "center",
    },
    mealHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    mealMeta: {
      color: theme.mutedText,
      marginTop: 4,
    },
    tagRow: {
      color: theme.mutedText,
    },
    sectionTitle: {
      fontFamily: "Inter_500Medium",
      color: theme.text,
      marginTop: 8,
    },
    ingredient: {
      color: theme.mutedText,
    },
    instructions: {
      color: theme.mutedText,
      lineHeight: 20,
    },
    copy: {
      color: theme.mutedText,
    },
    swapList: {
      gap: 10,
    },
    swapItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 10,
      borderRadius: 12,
      backgroundColor: controlSurface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    swapIcon: {
      fontSize: 16,
    },
    swapLabel: {
      flex: 1,
    },
    actionLink: {
      color: selectedTone,
    },
  });
