import { useCallback } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Constants from "expo-constants";
import { useRouter } from "expo-router";

import Colors from "@/constants/Colors";
import { useAppState } from "@/state/AppStateContext";

const extra =
  Constants.expoConfig?.extra ??
  (Constants.manifest as { extra?: Record<string, unknown> } | null | undefined)
    ?.extra ??
  {};

const checkoutUrl =
  (extra?.whopCheckoutUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_WHOP_CHECKOUT_URL;

const supportUrl = extra?.supportEmail as string | undefined;

const ACTIVE_STATUSES = ["active", "trialing", "grace"] as const;

export default function MembershipRequiredScreen() {
  const router = useRouter();
  const {
    membershipStatus,
    membershipPeriodEnd,
    refreshMembership,
    session,
    signOut,
  } = useAppState();

  const isActive = ACTIVE_STATUSES.includes(
    membershipStatus as (typeof ACTIVE_STATUSES)[number],
  );

  const handleOpenCheckout = useCallback(async () => {
    if (!checkoutUrl) {
      Alert.alert(
        "Checkout nije podešen",
        "Dodaj EXPO_PUBLIC_WHOP_CHECKOUT_URL u .env fajl kako bi otvorili Whop checkout.",
      );
      return;
    }
    const canOpen = await Linking.canOpenURL(checkoutUrl);
    if (!canOpen) {
      Alert.alert(
        "Greška",
        "Ne možemo da otvorimo Whop checkout na ovom uređaju.",
      );
      return;
    }
    await Linking.openURL(checkoutUrl);
  }, []);

  const handleSupport = useCallback(async () => {
    if (supportUrl && (await Linking.canOpenURL(`mailto:${supportUrl}`))) {
      await Linking.openURL(`mailto:${supportUrl}`);
      return;
    }
    Alert.alert(
      "Kontakt podrške",
      "Pišite nam na support@fitkofer.com kako bismo proverili status pretplate.",
    );
  }, []);

  const handleContinue = useCallback(() => {
    router.replace("/");
  }, [router]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.heading}>Aktiviraj članstvo</Text>
        <Text style={styles.copy}>
          Moramo da potvrdimo tvoje Whop članstvo pre nego što otključamo plan,
          treninge i dnevnik. Ako si već završila plaćanje, osveži status niže.
        </Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Status članstva</Text>
          <Text style={styles.statusValue}>{membershipStatus}</Text>
          {membershipPeriodEnd ? (
            <Text style={styles.statusMeta}>
              Važi do:{" "}
              {new Date(membershipPeriodEnd).toLocaleString("sr-RS", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </Text>
          ) : null}
          {session?.user?.email ? (
            <Text style={styles.statusMeta}>
              Prijavljena kao: {session.user.email}
            </Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          {!isActive ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleOpenCheckout}
            >
              <Text style={styles.primaryLabel}>Otvori Whop checkout</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => void refreshMembership()}
          >
            <Text style={styles.secondaryLabel}>Osveži status</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.textButton} onPress={handleSupport}>
            <Text style={styles.textButtonLabel}>Treba ti pomoć?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.textButton} onPress={signOut}>
            <Text style={styles.textButtonLabel}>Odjavi se</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={handleContinue}>
            <Text style={styles.linkButtonLabel}>Idi na početnu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.light.background,
    padding: 24,
    justifyContent: "center",
  },
  content: {
    gap: 24,
    maxWidth: 440,
    alignSelf: "center",
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
  statusCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    padding: 20,
    gap: 8,
  },
  statusLabel: {
    fontFamily: "Inter_500Medium",
    color: "#6B5E58",
  },
  statusValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.light.text,
    textTransform: "capitalize",
  },
  statusMeta: {
    fontFamily: "Inter_400Regular",
    color: "#8C8C8C",
  },
  actions: {
    gap: 12,
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
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
  secondaryLabel: {
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  textButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  textButtonLabel: {
    fontFamily: "Inter_500Medium",
    color: Colors.palette.olive,
  },
  linkButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  linkButtonLabel: {
    fontFamily: "Inter_500Medium",
    color: Colors.light.tint,
  },
});
