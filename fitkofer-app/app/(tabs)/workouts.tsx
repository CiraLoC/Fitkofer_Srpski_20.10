import { useEffect, useMemo, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import Screen from "@/components/ui/Screen";
import Card from "@/components/ui/Card";
import Logo from "@/components/ui/Logo";
import { H1, H2, Subtitle, Body, Label } from "@/components/ui/Typography";
import Colors from "@/constants/Colors";
import { useAppState } from "@/state/AppStateContext";

type ThemeColors = typeof Colors.light;

const dayLabels = [
  "Ponedeljak",
  "Utorak",
  "Sreda",
  "Cetvrtak",
  "Petak",
  "Subota",
  "Nedelja",
];

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function WorkoutsScreen() {
  const { plan, membershipStatus } = useAppState();
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const controlSurface = scheme === "light" ? theme.background : "#211A16";
  const elevatedSurface = scheme === "light" ? Colors.palette.cream : "#2A221E";
  const accent =
    scheme === "light" ? theme.tint : Colors.palette.terracottaSoft;
  const styles = useMemo(
    () => createStyles(theme, controlSurface, elevatedSurface, accent),
    [theme, controlSurface, elevatedSurface, accent],
  );

  const hasActiveMembership = ["active", "trialing", "grace"].includes(
    membershipStatus,
  );
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    if (!expandedSession) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [expandedSession]);

  if (!plan) {
    return (
      <Screen>
        <View style={styles.emptyState}>
          <Logo style={styles.emptyLogo} />
          <H2 style={styles.emptyHeading}>Trening plan nije spreman</H2>
          <Body style={styles.emptyCopy}>
            {hasActiveMembership
              ? "Generisi plan kroz onboarding kako bi dobila treninge po meri."
              : "Aktiviraj Whop clanstvo da otkljucas trening rutine."}
          </Body>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll contentPadding={24}>
      <View style={styles.stack}>
        <View style={styles.hero}>
          <H1 style={styles.heading}>Trening plan</H1>
          <Subtitle style={styles.subheading}>{plan.training.split}</Subtitle>
          <Body style={styles.copy}>
            Linearna progresija sa fokusom na kvalitet pokreta. Kada dva puta
            zaredom odradis gornji broj ponavljanja u svim serijama, podigni
            tezinu za 2.5-5%.
          </Body>
        </View>

        <Card style={styles.cardSpacing}>
          <H2>Nedeljni raspored</H2>
          <View style={styles.scheduleList}>
            {plan.training.schedule.map((entry) => {
              const session = plan.training.sessions.find(
                (item) => item.id === entry.sessionId,
              );
              return (
                <View key={entry.day} style={styles.scheduleRow}>
                  <Label style={styles.dayLabel}>{dayLabels[entry.day]}</Label>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle}>
                      {session ? session.title : "Oporavak / setnja"}
                    </Text>
                    <Body style={styles.sessionMeta}>
                      {session
                        ? `${session.durationMinutes} min`
                        : "Mobilnost, disanje, 6k koraka"}
                    </Body>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {plan.training.sessions.map((session) => {
          const expanded = expandedSession === session.id;
          return (
            <Card key={session.id} style={styles.cardSpacing}>
              <TouchableOpacity
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setExpandedSession(expanded ? null : session.id);
                }}
                style={styles.cardHeader}
                activeOpacity={0.85}
              >
                <View style={{ flex: 1 }}>
                  <H2>{session.title}</H2>
                  <Body style={styles.sessionMeta}>
                    {session.exercises.length} vezbi / {session.durationMinutes}{" "}
                    min /{" "}
                    {session.difficulty === "beginner" ? "Pocetni" : "Srednji"}{" "}
                    nivo
                  </Body>
                </View>
                <Text style={styles.toggle}>{expanded ? "-" : "+"}</Text>
              </TouchableOpacity>
              {expanded ? (
                <View style={styles.exerciseList}>
                  {session.exercises.map((exercise) => (
                    <View key={exercise.id} style={styles.exerciseItem}>
                      <View style={styles.exerciseHeader}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <Label style={styles.exerciseMeta}>
                          {exercise.sets} x {exercise.repRange}
                        </Label>
                      </View>
                      <Body style={styles.exerciseDetail}>
                        {exercise.instructions}
                      </Body>
                      <Body style={styles.exerciseDetail}>
                        Oprema: {exercise.equipment}
                      </Body>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          );
        })}

        <Card style={styles.cardSpacing}>
          <H2>Saveti za progres</H2>
          <View style={styles.tipList}>
            <Body style={styles.tip}>
              - Vodi evidenciju ponavljanja u Planner ekranu.
            </Body>
            <Body style={styles.tip}>
              - Pauze 60-90 sekundi za kompleksne, 45-60 za izolacione vezbe.
            </Body>
            <Body style={styles.tip}>
              - Fokus na kontrolu: ekscentrik 2s, stabilan povratak.
            </Body>
          </View>
        </Card>
      </View>
    </Screen>
  );
}

const createStyles = (
  theme: ThemeColors,
  controlSurface: string,
  elevatedSurface: string,
  accent: string,
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
    hero: {
      gap: 10,
    },
    heading: {
      fontSize: 26,
    },
    subheading: {
      color: accent,
    },
    copy: {
      color: theme.mutedText,
    },
    cardSpacing: {
      gap: 12,
    },
    scheduleList: {
      gap: 12,
    },
    scheduleRow: {
      flexDirection: "row",
      gap: 16,
    },
    dayLabel: {
      width: 100,
      color: theme.text,
    },
    sessionInfo: {
      flex: 1,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: controlSurface,
      padding: 12,
      gap: 4,
    },
    sessionTitle: {
      fontFamily: "Inter_600SemiBold",
      color: theme.text,
    },
    sessionMeta: {
      color: theme.mutedText,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 12,
    },
    toggle: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 24,
      color: accent,
    },
    exerciseList: {
      gap: 12,
    },
    exerciseItem: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: elevatedSurface,
      padding: 14,
      gap: 6,
    },
    exerciseHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    exerciseName: {
      fontFamily: "Inter_600SemiBold",
      color: theme.text,
    },
    exerciseMeta: {
      color: accent,
    },
    exerciseDetail: {
      color: theme.mutedText,
    },
    tipList: {
      gap: 8,
    },
    tip: {
      color: theme.mutedText,
    },
  });
