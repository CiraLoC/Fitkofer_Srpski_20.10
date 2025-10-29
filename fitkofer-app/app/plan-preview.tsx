import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter, type Href } from "expo-router";

import Colors from "@/constants/Colors";
import { useAppState } from "@/state/AppStateContext";
import type { DayIntensity } from "@/types";

const dayLabels = [
  "Ponedeljak",
  "Utorak",
  "Sreda",
  "Četvrtak",
  "Petak",
  "Subota",
  "Nedelja",
];

const intensityLabels: Record<DayIntensity, string> = {
  low: "Low",
  mid: "Mid",
  high: "High",
};

export default function PlanPreviewScreen() {
  const router = useRouter();
  const {
    plan,
    profile,
    session,
    isHydrated,
    setPlan,
    markOnboardingComplete,
    membershipStatus,
  } = useAppState();
  const [saving, setSaving] = useState(false);
  const dashboardHref = "/(tabs)/dashboard" satisfies Href;
  const membershipHref = "/membership-required" satisfies Href;
  const hasActiveMembership = ["active", "trialing", "grace"].includes(
    membershipStatus,
  );

  useEffect(() => {
    if (isHydrated && !session) {
      router.replace("/auth");
      return;
    }
    if (isHydrated && session && !hasActiveMembership) {
      router.replace(membershipHref);
    }
  }, [hasActiveMembership, isHydrated, membershipHref, router, session]);

  const schedule = useMemo(() => {
    if (!plan) return [];
    return plan.training.schedule.map((slot) => {
      const sessionForDay = plan.training.sessions.find(
        (item) => item.id === slot.sessionId,
      );
      return {
        dayIndex: slot.day,
        title: sessionForDay ? sessionForDay.title : "Oporavak",
        focus: sessionForDay?.focus ?? "Off",
      };
    });
  }, [plan]);

  const handleStart = useCallback(async () => {
    if (!plan) {
      router.replace("/onboarding");
      return;
    }
    if (!hasActiveMembership) {
      router.replace(membershipHref);
      return;
    }
    try {
      setSaving(true);
      if (plan.subscriptionTier !== "full") {
        await setPlan({ ...plan, subscriptionTier: "full" });
      }
      await markOnboardingComplete();
    } catch (error) {
      console.error(
        "[PlanPreview] Failed to mark plan as full subscription",
        error,
      );
    } finally {
      setSaving(false);
      router.replace(dashboardHref);
    }
  }, [
    dashboardHref,
    hasActiveMembership,
    markOnboardingComplete,
    membershipHref,
    plan,
    router,
    setPlan,
  ]);

  if (!session || !plan || !profile || !hasActiveMembership) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          Generiši plan kroz onboarding da bi ga videla.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pregled plana</Text>
      <Text style={styles.subtitle}>
        Kreirano{" "}
        {new Date(plan.createdAt).toLocaleDateString("sr-RS", {
          day: "2-digit",
          month: "short",
        })}
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
              <Text style={styles.rotationDay}>
                {dayLabels[index].slice(0, 3)}
              </Text>
              <Text
                style={[
                  styles.rotationBadge,
                  styles[`rotationBadge${intensity}`],
                ]}
              >
                {intensityLabels[intensity]}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.macrosRow}>
          {(Object.keys(plan.nutrition.planByDayType) as DayIntensity[]).map(
            (key) => {
              const entry = plan.nutrition.planByDayType[key];
              return (
                <View key={key} style={styles.macroCard}>
                  <Text style={styles.macroTitle}>
                    {intensityLabels[key]} dan
                  </Text>
                  <Text style={styles.macroValue}>{entry.calories} kcal</Text>
                  <Text style={styles.macroDetail}>
                    P {entry.protein}g / U {entry.carbs}g / M {entry.fats}g
                  </Text>
                </View>
              );
            },
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Navike</Text>
        {plan.habits.dailyHabits.map((habit) => (
          <View style={styles.habitItem} key={habit.id}>
            <Text style={styles.habitTitle}>{habit.title}</Text>
            <Text style={styles.habitDescription}>{habit.description}</Text>
          </View>
        ))}
        <View style={styles.challenge}>
          <Text style={styles.challengeTitle}>Nedeljni izazov</Text>
          <Text style={styles.habitDescription}>
            {plan.habits.weeklyChallenge}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Šta dalje?</Text>
        <Text style={styles.bodyText}>
          Startuj plan da otključaš dashboard sa dnevnim zadacima, obrocima i
          progresijom treninga.
        </Text>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            saving ? styles.primaryButtonDisabled : undefined,
          ]}
          onPress={handleStart}
          disabled={saving}
        >
          <Text style={styles.primaryLabel}>
            {saving ? "Čuvanje..." : "Pokreni plan"}
          </Text>
        </TouchableOpacity>
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
    gap: 20,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: Colors.light.background,
    gap: 16,
  },
  emptyText: {
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
    textAlign: "center",
  },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 28,
    color: Colors.light.text,
  },
  subtitle: {
    fontFamily: "Inter_500Medium",
    color: "#6B5E58",
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
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
  },
  bodyText: {
    fontFamily: "Inter_400Regular",
    color: "#5C5C5C",
    lineHeight: 20,
  },
  scheduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  scheduleItem: {
    width: "47%",
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 6,
  },
  scheduleDay: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  scheduleFocus: {
    fontFamily: "Inter_500Medium",
    color: "#6B5E58",
  },
  schedulePill: {
    marginTop: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: Colors.light.tint,
    color: Colors.light.background,
    fontFamily: "Inter_500Medium",
  },
  rotationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rotationItem: {
    alignItems: "center",
    gap: 8,
  },
  rotationDay: {
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  rotationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.background,
  },
  rotationBadgelow: {
    backgroundColor: Colors.palette.olive,
  },
  rotationBadgemid: {
    backgroundColor: Colors.palette.terracotta,
  },
  rotationBadgehigh: {
    backgroundColor: "#D1634D",
  },
  macrosRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  macroCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    flexBasis: "30%",
    flexGrow: 1,
    gap: 6,
  },
  macroTitle: {
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  macroValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.light.tint,
  },
  macroDetail: {
    fontFamily: "Inter_400Regular",
    color: "#5C5C5C",
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
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  habitDescription: {
    fontFamily: "Inter_400Regular",
    color: "#5C5C5C",
    lineHeight: 20,
  },
  challenge: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.palette.olive,
    gap: 8,
  },
  challengeTitle: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.background,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryLabel: {
    color: Colors.light.background,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },
});
