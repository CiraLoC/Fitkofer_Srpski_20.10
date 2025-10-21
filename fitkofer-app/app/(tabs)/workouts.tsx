import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useAppState } from '@/state/AppStateContext';

const dayLabels = ['Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota', 'Nedelja'];

export default function WorkoutsScreen() {
  const { plan } = useAppState();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  if (!plan) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Generiši plan da bi videla treninge.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heading}>Trening plan</Text>
        <Text style={styles.subheading}>{plan.training.split}</Text>
        <Text style={styles.copy}>
          Linearna progresija sa fokusom na kvalitet pokreta. Kada dva puta zaredom odradiš gornji broj
          ponavljanja u svim serijama, podigni težinu za 2.5-5%.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nedeljni raspored</Text>
        <View style={styles.scheduleList}>
          {plan.training.schedule.map((entry) => {
            const session = plan.training.sessions.find((item) => item.id === entry.sessionId);
            return (
              <View key={entry.day} style={styles.scheduleRow}>
                <Text style={styles.dayLabel}>{dayLabels[entry.day]}</Text>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>{session ? session.title : 'Oporavak / šetnja'}</Text>
                  <Text style={styles.sessionMeta}>
                    {session ? `${session.durationMinutes} min` : 'Mobilnost, NSDR, 6k koraka'}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {plan.training.sessions.map((session) => {
        const expanded = expandedSession === session.id;
        return (
          <View key={session.id} style={styles.card}>
            <TouchableOpacity
              onPress={() => setExpandedSession(expanded ? null : session.id)}
              style={styles.cardHeader}
            >
              <View>
                <Text style={styles.cardTitle}>{session.title}</Text>
                <Text style={styles.sessionMeta}>
                  {session.exercises.length} vežbi · {session.durationMinutes} min · {session.difficulty === 'beginner' ? 'Početni' : 'Srednji'} nivo
                </Text>
              </View>
              <Text style={styles.toggle}>{expanded ? '–' : '+'}</Text>
            </TouchableOpacity>
            {expanded && (
              <View style={styles.exerciseList}>
                {session.exercises.map((exercise) => (
                  <View key={exercise.id} style={styles.exerciseItem}>
                    <View style={styles.exerciseHeader}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseMeta}>
                        {exercise.sets}x {exercise.repRange}
                      </Text>
                    </View>
                    <Text style={styles.exerciseDetail}>{exercise.instructions}</Text>
                    <Text style={styles.exerciseDetail}>Oprema: {exercise.equipment}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Saveti za progres</Text>
        <View style={styles.tipList}>
          <Text style={styles.tip}>• Vodi evidenciju ponavljanja i težina u Planner ekranu.</Text>
          <Text style={styles.tip}>• Pauze 60-90 sekundi za višezglobne, 45-60 za izolacione vežbe.</Text>
          <Text style={styles.tip}>• Prvo tehnika, zatim tempo: spuštanje 2s, kontrolisan povratak.</Text>
        </View>
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
  },
  hero: {
    gap: 10,
  },
  heading: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: Colors.light.text,
  },
  subheading: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.light.tint,
  },
  copy: {
    fontFamily: 'Inter_400Regular',
    color: '#5C5C5C',
    lineHeight: 20,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.light.text,
  },
  scheduleList: {
    gap: 12,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dayLabel: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.text,
    width: 100,
  },
  sessionInfo: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    padding: 12,
    gap: 4,
  },
  sessionTitle: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.text,
  },
  sessionMeta: {
    fontFamily: 'Inter_400Regular',
    color: '#6B5E58',
  },
  toggle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
    color: Colors.light.tint,
  },
  exerciseList: {
    gap: 12,
  },
  exerciseItem: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    padding: 14,
    gap: 6,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.text,
  },
  exerciseMeta: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.tint,
  },
  exerciseDetail: {
    fontFamily: 'Inter_400Regular',
    color: '#5C5C5C',
  },
  tipList: {
    gap: 8,
  },
  tip: {
    fontFamily: 'Inter_400Regular',
    color: '#5C5C5C',
  },
});
