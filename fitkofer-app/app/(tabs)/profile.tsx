import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import Colors from '@/constants/Colors';
import { useAppState } from '@/state/AppStateContext';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('sr-RS', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, plan, resetPlan, signOut, session, isHydrated } = useAppState();

  useEffect(() => {
    if (isHydrated && !session) {
      router.replace('/auth');
    }
  }, [isHydrated, router, session]);

  if (!session) {
    return null;
  }

  if (!profile || !plan) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Još nema podataka. Završi onboarding da pokreneš plan.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/onboarding')}>
          <Text style={styles.primaryLabel}>Pokreni onboarding</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const recentSnapshots = useMemo(() => plan.profileHistory.slice(-5).reverse(), [plan.profileHistory]);

  const goalLabel =
    profile.goal === 'lose'
      ? 'Gubitak masnog tkiva'
      : profile.goal === 'gain'
      ? 'Dobitak misica'
      : 'Odrzavanje';

  const handleRegenerate = () => {
    resetPlan();
    router.replace('/onboarding');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Tvoj profil</Text>
      <Text style={styles.copy}>
        Podaci su sačuvani u Supabase profilu. Možeš ih menjati ručno ili ponoviti onboarding u bilo kom trenutku.
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/profile-edit')}>
          <Text style={styles.secondaryLabel}>Uredi profil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={signOut}>
          <Text style={styles.secondaryLabel}>Odjavi se</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Osnovne informacije</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Godine</Text>
          <Text style={styles.value}>{profile.age}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Visina</Text>
          <Text style={styles.value}>{profile.heightCm} cm</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Težina</Text>
          <Text style={styles.value}>{profile.weightKg} kg</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Cilj</Text>
          <Text style={styles.value}>{goalLabel}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Aktivnost</Text>
          <Text style={styles.value}>{profile.activityLevel}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Planirani treninzi</Text>
          <Text style={styles.value}>{profile.daysPerWeek}x nedeljno</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Menstrualni ciklus</Text>
        <Text style={styles.copy}>Informacije pomažu pri prilagođavanju treninga i kalorija.</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Dužina ciklusa</Text>
          <Text style={styles.value}>{profile.cycleLengthDays ? `${profile.cycleLengthDays} dana` : 'Nije uneto'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Trajanje menstruacije</Text>
          <Text style={styles.value}>{profile.periodLengthDays ? `${profile.periodLengthDays} dana` : 'Nije uneto'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Poslednja menstruacija</Text>
          <Text style={styles.value}>{profile.lastPeriodDate ? formatDate(profile.lastPeriodDate) : 'Nije uneto'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Zdravstveni kontekst</Text>
        <Text style={styles.copy}>Plan je prilagođen navedenim stanjima i ograničenjima.</Text>
        <Text style={styles.value}>
          {profile.healthConditions.length > 0 ? profile.healthConditions.join(', ') : 'Nema specifičnih stanja'}
        </Text>
        <Text style={styles.copy}>Alergije: {profile.allergies.join(', ') || 'Nema'}</Text>
        <Text style={styles.copy}>Ne volim: {profile.dislikedFoods.join(', ') || 'Nema'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Integracije</Text>
        <View style={styles.integrationRow}>
          <Text style={styles.integrationTitle}>Apple Health / Google Fit</Text>
          <Text style={styles.integrationStatus}>Read-only (koraci, energija)</Text>
        </View>
        <Text style={styles.copy}>Automatska sinhronizacija stiže kroz Supabase Edge funkciju.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pretplata</Text>
        <Text style={styles.copy}>Fitkofer Pro (7 dana probno) – upravljanje kroz RevenueCat dashboard.</Text>
        <Text style={styles.copy}>Status: Aktivna (primer)</Text>
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryLabel}>Kontakt podršku za promene</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Istorija promena profila</Text>
        {recentSnapshots.length === 0 ? (
          <Text style={styles.copy}>Još uvek nema sačuvanih istorijskih zapisa.</Text>
        ) : (
          recentSnapshots.map((snapshot) => (
            <View key={snapshot.capturedAt} style={styles.historyItem}>
              <Text style={styles.historyDate}>{formatDate(snapshot.capturedAt)}</Text>
              <Text style={styles.historyDetail}>
                {snapshot.profile.weightKg} kg · {snapshot.profile.daysPerWeek}x treninga · cilj {snapshot.profile.goal}
              </Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleRegenerate}>
        <Text style={styles.primaryLabel}>Ponovi onboarding</Text>
      </TouchableOpacity>
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
    paddingBottom: 100,
    gap: 18,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.light.background,
    gap: 16,
  },
  emptyText: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
    textAlign: 'center',
  },
  heading: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: Colors.light.text,
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
    gap: 12,
  },
  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.light.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: 'Inter_400Regular',
    color: '#6B5E58',
  },
  value: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.text,
  },
  integrationRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    padding: 14,
    gap: 4,
  },
  integrationTitle: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.text,
  },
  integrationStatus: {
    fontFamily: 'Inter_400Regular',
    color: '#6B5E58',
  },
  primaryButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryLabel: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.background,
    fontSize: 16,
  },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  secondaryLabel: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  historyItem: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 12,
    gap: 4,
    backgroundColor: Colors.light.background,
  },
  historyDate: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.text,
  },
  historyDetail: {
    fontFamily: 'Inter_400Regular',
    color: '#5C5C5C',
  },
});
