import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter, type Href } from "expo-router";

import Colors from "@/constants/Colors";
import { useAppState } from "@/state/AppStateContext";
import type { PlanSubscriptionTier } from "@/types";

type OptionId = Exclude<PlanSubscriptionTier, "unselected">;
type PlanOption = {
  id: OptionId;
  title: string;
  subtitle: string;
};

const options: PlanOption[] = [
  {
    id: "nutrition",
    title: "Generisi plan ishrane",
    subtitle: "Personalizovana sedmicna rotacija obroka i lista za kupovinu.",
  },
  {
    id: "training",
    title: "Generisi plan treninga",
    subtitle: "Pametno rasporedjeni treninzi sa tvojom dostupnom opremom.",
  },
  {
    id: "habits",
    title: "Generisi plan uvodjenja zdravih navika",
    subtitle: "Dnevni i nedeljni izazovi koji grade doslednost.",
  },
  {
    id: "full",
    title: "Generisi ceo paket",
    subtitle: "Ishrana + trening + navike u jednoj kontrolnoj tabli.",
  },
];

export default function PlanOptionsScreen() {
  const router = useRouter();
  const { plan, session, isHydrated, setPlan, markOnboardingComplete } =
    useAppState();
  const [pendingOption, setPendingOption] = useState<OptionId | null>(null);
  const dashboardHref = "/(tabs)/dashboard" satisfies Href;

  useEffect(() => {
    if (!isHydrated) return;
    if (!session) {
      router.replace("/auth");
      return;
    }
    if (plan && plan.subscriptionTier !== "unselected") {
      router.replace(dashboardHref);
    }
  }, [dashboardHref, isHydrated, plan, router, session]);

  const handleSelect = useCallback(
    async (option: OptionId) => {
      if (!plan) {
        router.replace("/onboarding");
        return;
      }
      try {
        setPendingOption(option);
        await setPlan({ ...plan, subscriptionTier: option });
        await markOnboardingComplete();
        router.replace(dashboardHref);
      } catch (error) {
        console.error("[PlanOptions] Failed to store selection", error);
        Alert.alert(
          "Greska",
          "Nismo uspeli da zapamtimo izbor. Pokusaj ponovo.",
        );
      } finally {
        setPendingOption(null);
      }
    },
    [dashboardHref, markOnboardingComplete, plan, router, setPlan],
  );

  if (!session || !plan) {
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Dobrodosla!</Text>
      <Text style={styles.subheading}>
        Izaberi kako zelis da nastavis i preuzmi kontrolu nad zdravljem uz
        personalizovane planove.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sta zelis da personalizujes?</Text>
        <Text style={styles.cardCopy}>
          Svaki plan mozes aktivirati zasebno ili uzeti komplet. U sledecem
          koraku pokazacemo pogodnosti i opcije pretplate.
        </Text>
      </View>

      <View style={styles.optionList}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionButton}
            onPress={() => handleSelect(option.id)}
            disabled={Boolean(pendingOption)}
          >
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
            {pendingOption === option.id ? (
              <ActivityIndicator color={Colors.light.tint} />
            ) : null}
          </TouchableOpacity>
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
    paddingBottom: 48,
    gap: 24,
  },
  heading: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 30,
    color: Colors.light.text,
  },
  subheading: {
    fontFamily: "Inter_400Regular",
    color: "#5C5C5C",
    lineHeight: 22,
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
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
  },
  cardCopy: {
    fontFamily: "Inter_400Regular",
    color: "#5C5C5C",
    lineHeight: 20,
  },
  optionList: {
    gap: 16,
  },
  optionButton: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  optionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
  },
  optionSubtitle: {
    fontFamily: "Inter_400Regular",
    color: "#6B5E58",
    lineHeight: 20,
  },
});
