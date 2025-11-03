import { useEffect, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

import { useColorScheme } from "@/components/useColorScheme";
import Screen from "@/components/ui/Screen";
import Card from "@/components/ui/Card";
import { H1, H2, Body, Label } from "@/components/ui/Typography";
import Colors from "@/constants/Colors";
import { useAppState } from "@/state/AppStateContext";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("sr-RS", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const buildStyles = (
  theme: typeof Colors.light | typeof Colors.dark,
  surfaces: { card: string; accent: string },
) =>
  StyleSheet.create({
    stack: {
      gap: 18,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
      gap: 16,
    },
    emptyText: {
      fontFamily: "Inter_500Medium",
      color: theme.text,
      textAlign: "center",
    },
    primaryButton: {
      backgroundColor: theme.tint,
      paddingVertical: 14,
      paddingHorizontal: 22,
      borderRadius: 16,
    },
    primaryLabel: {
      fontFamily: "Inter_600SemiBold",
      color: theme.background,
    },
    actionRow: {
      flexDirection: "row",
      gap: 12,
    },
    secondaryButton: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: surfaces.card,
      paddingVertical: 12,
      alignItems: "center",
    },
    secondaryLabel: {
      fontFamily: "Inter_600SemiBold",
      color: theme.text,
    },
    cardSpacing: {
      gap: 14,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    label: {
      fontFamily: "Inter_500Medium",
      color: theme.mutedText,
    },
    value: {
      fontFamily: "Inter_600SemiBold",
      color: theme.text,
    },
    membershipActions: {
      flexDirection: "row",
      gap: 12,
    },
    membershipButton: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 10,
      alignItems: "center",
      backgroundColor: surfaces.accent,
    },
    membershipLabel: {
      fontFamily: "Inter_500Medium",
      color: theme.text,
    },
    historyRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderRadius: 12,
      padding: 12,
      backgroundColor: surfaces.accent,
      borderWidth: 1,
      borderColor: theme.border,
    },
    historyLabel: {
      fontFamily: "Inter_500Medium",
      color: theme.text,
    },
    historyBody: {
      color: theme.mutedText,
    },
  });

export default function ProfileScreen() {
  const router = useRouter();
  const {
    profile,
    plan,
    resetPlan,
    signOut,
    session,
    isHydrated,
    membershipStatus,
    membershipPeriodEnd,
    refreshMembership,
  } = useAppState();
  const recentSnapshots = useMemo(
    () => (plan ? plan.profileHistory.slice(-5).reverse() : []),
    [plan],
  );
  const goalLabel = useMemo(() => {
    if (!profile) return "";
    if (profile.goal === "lose") return "Gubitak masnog tkiva";
    if (profile.goal === "gain") return "Dobitak mišića";
    return "Održavanje";
  }, [profile]);
  const hasActiveMembership = ["active", "trialing", "grace"].includes(
    membershipStatus,
  );

  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const surfaces = useMemo(
    () => ({
      card: scheme === "light" ? Colors.palette.cream : "#241D19",
      accent: scheme === "light" ? Colors.palette.sand : "#2D241F",
    }),
    [scheme],
  );
  const styles = useMemo(() => buildStyles(theme, surfaces), [theme, surfaces]);

  useEffect(() => {
    if (isHydrated && !session) {
      router.replace("/auth");
    }
  }, [isHydrated, router, session]);

  if (!session) {
    return null;
  }

  if (!profile || !plan) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Body style={styles.emptyText}>
            {hasActiveMembership
              ? "Još nema podataka. Završi onboarding da pokreneš plan."
              : "Aktiviraj Whop članstvo da bi pristupila profilu i planu."}
          </Body>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.replace(
                hasActiveMembership ? "/onboarding" : "/membership-required",
              )
            }
          >
            <Text style={styles.primaryLabel}>
              {hasActiveMembership
                ? "Pokreni onboarding"
                : "Aktiviraj članstvo"}
            </Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const handleRegenerate = () => {
    resetPlan();
    router.replace("/onboarding");
  };

  const handleMembershipManage = () => {
    router.push("/membership-required");
  };

  return (
    <Screen scroll contentPadding={24}>
      <View style={styles.stack}>
        <View>
          <H1>Tvoj profil</H1>
          <Body style={{ color: theme.mutedText }}>
            Podaci su sačuvani u Supabase profilu. Možeš ih menjati ručno ili
            ponoviti onboarding u bilo kom trenutku.
          </Body>
        </View>

        <Card style={styles.cardSpacing}>
          <H2>Članstvo</H2>
          <View style={styles.row}>
            <Label style={styles.label}>Status</Label>
            <Text style={styles.value}>{membershipStatus}</Text>
          </View>
          {membershipPeriodEnd ? (
            <View style={styles.row}>
              <Label style={styles.label}>Važi do</Label>
              <Text style={styles.value}>
                {formatDate(membershipPeriodEnd)}
              </Text>
            </View>
          ) : null}
          <View style={styles.membershipActions}>
            <TouchableOpacity
              style={styles.membershipButton}
              onPress={() => void refreshMembership()}
            >
              <Text style={styles.membershipLabel}>Osveži status</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.membershipButton}
              onPress={handleMembershipManage}
            >
              <Text style={styles.membershipLabel}>Upravljaj članstvom</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push("/profile-edit")}
          >
            <Text style={styles.secondaryLabel}>Uredi profil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={signOut}>
            <Text style={styles.secondaryLabel}>Odjavi se</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.cardSpacing}>
          <H2>Osnovne informacije</H2>
          <View style={styles.row}>
            <Label style={styles.label}>Godine</Label>
            <Text style={styles.value}>{profile.age}</Text>
          </View>
          <View style={styles.row}>
            <Label style={styles.label}>Visina</Label>
            <Text style={styles.value}>{profile.heightCm} cm</Text>
          </View>
          <View style={styles.row}>
            <Label style={styles.label}>Težina</Label>
            <Text style={styles.value}>{profile.weightKg} kg</Text>
          </View>
          <View style={styles.row}>
            <Label style={styles.label}>Cilj</Label>
            <Text style={styles.value}>{goalLabel}</Text>
          </View>
          <View style={styles.row}>
            <Label style={styles.label}>Aktivnost</Label>
            <Text style={styles.value}>{profile.activityLevel}</Text>
          </View>
          <View style={styles.row}>
            <Label style={styles.label}>Planirani treninzi</Label>
            <Text style={styles.value}>{profile.daysPerWeek}x nedeljno</Text>
          </View>
        </Card>

        <Card style={styles.cardSpacing}>
          <H2>Menstrualni ciklus</H2>
          <Body style={{ color: theme.mutedText }}>
            Informacije pomažu pri prilagođavanju treninga i kalorija.
          </Body>
          <View style={styles.row}>
            <Label style={styles.label}>Dužina ciklusa</Label>
            <Text style={styles.value}>
              {profile.cycleLengthDays
                ? `${profile.cycleLengthDays} dana`
                : "Nije uneto"}
            </Text>
          </View>
          <View style={styles.row}>
            <Label style={styles.label}>Trajanje menstruacije</Label>
            <Text style={styles.value}>
              {profile.periodLengthDays
                ? `${profile.periodLengthDays} dana`
                : "Nije uneto"}
            </Text>
          </View>
          <View style={styles.row}>
            <Label style={styles.label}>Poslednja menstruacija</Label>
            <Text style={styles.value}>
              {profile.lastPeriodDate
                ? formatDate(profile.lastPeriodDate)
                : "Nije uneto"}
            </Text>
          </View>
        </Card>

        <Card style={styles.cardSpacing}>
          <H2>Istorija snimljenih podataka</H2>
          {recentSnapshots.length === 0 ? (
            <Body style={{ color: theme.mutedText }}>
              Nema snimljenih verzija profila. Nakon ažuriranja podataka
              sačuvaće se poslednjih pet stanja.
            </Body>
          ) : (
            recentSnapshots.map((snapshot) => (
              <View key={snapshot.id} style={styles.historyRow}>
                <View>
                  <Text style={styles.historyLabel}>
                    {formatDate(snapshot.createdAt)}
                  </Text>
                  <Text style={styles.historyBody}>
                    {snapshot.goal === "lose"
                      ? "Gubitak masnog tkiva"
                      : snapshot.goal === "gain"
                        ? "Dobitak mišića"
                        : "Održavanje"}
                  </Text>
                </View>
                <Text style={styles.historyBody}>{snapshot.weightKg} kg</Text>
              </View>
            ))
          )}
        </Card>

        <Card style={styles.cardSpacing}>
          <H2>Plan reset</H2>
          <Body style={{ color: theme.mutedText }}>
            Ponovi onboarding kada želiš da prilagodiš plan ciljevima ili
            opremi.
          </Body>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegenerate}
          >
            <Text style={styles.primaryLabel}>Regeneriši plan</Text>
          </TouchableOpacity>
        </Card>
      </View>
    </Screen>
  );
}

ProfileScreen.displayName = "ProfileScreen";
