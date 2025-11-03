import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Redirect, type Href, useRouter } from "expo-router";

import Screen from "@/components/ui/Screen";
import Logo from "@/components/ui/Logo";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Button";
import { H1, Body } from "@/components/ui/Typography";
import { supabase } from "@/lib/supabase/client";
import { useAppState } from "@/state/AppStateContext";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

type ThemeColors = typeof Colors.light;

export default function IndexRoute() {
  const {
    plan,
    session,
    isHydrated,
    hasCompletedOnboarding,
    membershipStatus,
  } = useAppState();
  const dashboardHref = "/(tabs)/dashboard" satisfies Href;
  const membershipHref = "/membership-required" satisfies Href;
  const hasActiveMembership = ["active", "trialing", "grace"].includes(
    membershipStatus,
  );

  if (!isHydrated) return null;
  if (!session) return <LandingScreen />;
  if (!hasCompletedOnboarding) return <Redirect href="/onboarding" />;
  if (!hasActiveMembership) return <Redirect href={membershipHref} />;
  if (!plan) return <Redirect href="/plan-options" />;
  return <Redirect href={dashboardHref} />;
}

function LandingScreen() {
  const router = useRouter();
  const [loginVisible, setLoginVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Nedostaju podaci", "Unesi email adresu i lozinku.");
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      setLoginVisible(false);
      setEmail("");
      setPassword("");
    } catch (error) {
      Alert.alert(
        "Prijava nije uspela",
        error instanceof Error ? error.message : "Pokušaj ponovo.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => router.push("/auth?mode=signUp" as Href);
  const handleOpenLogin = () => {
    setEmail("");
    setPassword("");
    setLoginVisible(true);
  };

  return (
    <Screen scroll>
      <View style={styles.hero}>
        <Logo style={{ width: 96, height: 96, marginBottom: 8 }} />
        <H1 style={styles.appName}>Fitkofer</H1>
        <Body style={styles.tagline}>
          Personalni treninzi i ishrana za zauzete mame — bez pritiska, bez
          dijeta, bez stresa.
        </Body>
      </View>

      <View style={styles.buttonStack}>
        <PrimaryButton title="Kreiraj nalog" onPress={handleCreateAccount} />
        <SecondaryButton title="Uloguj se" onPress={handleOpenLogin} />
      </View>

      <Modal
        visible={loginVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLoginVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Prijava</Text>
            <Text style={styles.modalCopy}>
              Unesi email adresu i lozinku kako bi nastavila sa planom.
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Email adresa"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Lozinka"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <PrimaryButton
              title="Prijavi se"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: 4 }}
            />

            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={() => setLoginVisible(false)}
            >
              <Text style={styles.modalSecondaryLabel}>Zatvori</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const createStyles = (theme: ThemeColors) =>
  StyleSheet.create({
    hero: {
      alignItems: "center",
      gap: 12,
      marginTop: 20,
      marginBottom: 18,
    },
    appName: {
      fontSize: 40,
      textAlign: "center",
    },
    tagline: {
      textAlign: "center",
      maxWidth: 340,
    },
    buttonStack: {
      width: "100%",
      maxWidth: 360,
      gap: 12,
      alignSelf: "center",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modalCard: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: theme.card,
      borderRadius: 20,
      padding: 24,
      gap: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalTitle: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 20,
      color: theme.text,
    },
    modalCopy: {
      fontFamily: "Inter_400Regular",
      color: theme.mutedText,
    },
    modalInput: {
      backgroundColor: theme.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontFamily: "Inter_500Medium",
      color: theme.text,
    },
    modalSecondaryButton: {
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalSecondaryLabel: {
      fontFamily: "Inter_500Medium",
      color: theme.text,
    },
    disabledButton: {
      opacity: 0.6,
    },
  });
