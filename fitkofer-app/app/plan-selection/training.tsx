import { useCallback, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter, type Href } from "expo-router";

import Colors from "@/constants/Colors";
import { useAppState } from "@/state/AppStateContext";

export default function TrainingPlanScreen() {
  const router = useRouter();
  const { plan, setPlan, markOnboardingComplete } = useAppState();
  const [saving, setSaving] = useState(false);
  const dashboardHref = "/(tabs)/dashboard" satisfies Href;

  const activatePlan = useCallback(
    async (tier: "training" | "full") => {
      if (!plan) {
        router.replace("/onboarding");
        return;
      }
      try {
        setSaving(true);
        await setPlan({ ...plan, subscriptionTier: tier });
        await markOnboardingComplete();
        router.replace(dashboardHref);
      } catch (error) {
        console.error(
          "[TrainingPlan] Failed to update subscription tier",
          error,
        );
        Alert.alert("Greska", "Plan nije sacuvan. Pokusaj ponovo.");
      } finally {
        setSaving(false);
      }
    },
    [dashboardHref, markOnboardingComplete, plan, router, setPlan],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Plan treninga spreman!</Text>
      <Text style={styles.copy}>
        Cekaju te personalizovani treninzi uskladjeni sa brojem dana i opremom
        koju imas na raspolaganju.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => activatePlan("training")}
        disabled={saving}
      >
        <Text style={styles.primaryLabel}>Otvori panel za treninge</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => activatePlan("full")}
        disabled={saving}
      >
        <Text style={styles.secondaryLabel}>Ipak zelim ceo paket</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 24,
    justifyContent: "center",
    gap: 20,
  },
  heading: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 28,
    color: Colors.light.text,
  },
  copy: {
    fontFamily: "Inter_400Regular",
    color: "#5C5C5C",
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryLabel: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.background,
    fontSize: 16,
  },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  secondaryLabel: {
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
});
