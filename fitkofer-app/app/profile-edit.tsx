import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import Colors from '@/constants/Colors';
import { useAppState } from '@/state/AppStateContext';
import type { StressLevel } from '@/types';

const stressOptions: { label: string; value: StressLevel }[] = [
  { label: 'Nizak', value: 1 },
  { label: 'Blago povisen', value: 2 },
  { label: 'Umeren', value: 3 },
  { label: 'Visok', value: 4 },
  { label: 'Hronican', value: 5 },
];

export default function ProfileEditScreen() {
  const router = useRouter();
  const { profile, setProfile, session, isHydrated } = useAppState();
  const [weight, setWeight] = useState(profile?.weightKg ? String(profile.weightKg) : '');
  const [sleep, setSleep] = useState(profile?.sleepHours ? String(profile.sleepHours) : '');
  const [stress, setStress] = useState<StressLevel>((profile?.stressLevel ?? 3) as StressLevel);
  const [cycleLength, setCycleLength] = useState(profile?.cycleLengthDays ? String(profile.cycleLengthDays) : '');
  const [periodLength, setPeriodLength] = useState(profile?.periodLengthDays ? String(profile.periodLengthDays) : '');
  const [lastPeriod, setLastPeriod] = useState(profile?.lastPeriodDate ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isHydrated && !session) {
      router.replace('/auth');
    }
  }, [isHydrated, router, session]);

  if (!session || !profile) {
    return null;
  }

  const handleSave = async () => {
    setError(null);
    const nextWeight = weight.trim() ? Number(weight.replace(/[^0-9.]/g, '')) : profile.weightKg;
    const nextSleep = sleep.trim() ? Number(sleep.replace(/[^0-9.]/g, '')) : profile.sleepHours;

    if (Number.isNaN(nextWeight) || nextWeight <= 0) {
      setError('Unesi validnu težinu.');
      return;
    }
    if (Number.isNaN(nextSleep) || nextSleep <= 0 || nextSleep > 24) {
      setError('Unesi validan broj sati sna.');
      return;
    }

    const cycleLengthDays = cycleLength.trim() ? Number(cycleLength.replace(/[^0-9]/g, '')) : null;
    const periodLengthDays = periodLength.trim() ? Number(periodLength.replace(/[^0-9]/g, '')) : null;
    const lastPeriodDate = lastPeriod.trim() ? lastPeriod.trim() : null;

    if (cycleLengthDays !== null && (cycleLengthDays < 15 || cycleLengthDays > 60)) {
      setError('Dužina ciklusa treba da bude između 15 i 60 dana.');
      return;
    }
    if (periodLengthDays !== null && (periodLengthDays < 1 || periodLengthDays > 15)) {
      setError('Trajanje menstruacije treba da bude između 1 i 15 dana.');
      return;
    }
    if (lastPeriodDate && !/^\d{4}-\d{2}-\d{2}$/.test(lastPeriodDate)) {
      setError('Unesi datum poslednje menstruacije u formatu YYYY-MM-DD ili ostavi prazno.');
      return;
    }

    try {
      setSaving(true);
      await setProfile({
        ...profile,
        weightKg: nextWeight,
        sleepHours: nextSleep,
        stressLevel: stress,
        cycleLengthDays,
        periodLengthDays,
        lastPeriodDate,
      });
      Alert.alert('Sačuvano', 'Profil je uspešno ažuriran.');
      router.back();
    } catch (err) {
      console.error('[ProfileEdit] Failed to update profile', err);
      setError('Došlo je do greške pri čuvanju profila. Pokušaj ponovo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Uredi profil</Text>
      <Text style={styles.copy}>Ažuriraj osnovne podatke kako bismo bolje prilagodili tvoj plan.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Težina i san</Text>
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Težina (kg)</Text>
            <TextInput
              keyboardType="decimal-pad"
              value={weight}
              placeholder="npr. 68"
              onChangeText={setWeight}
              style={styles.input}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sati sna</Text>
            <TextInput
              keyboardType="decimal-pad"
              value={sleep}
              placeholder="npr. 7"
              onChangeText={setSleep}
              style={styles.input}
            />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Stres</Text>
        <View style={styles.pillRow}>
          {stressOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.pill, stress === option.value && styles.pillSelected]}
              onPress={() => setStress(option.value)}
            >
              <Text style={[styles.pillLabel, stress === option.value && styles.pillLabelSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Menstrualni ciklus (opciono)</Text>
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dužina ciklusa (dana)</Text>
            <TextInput
              keyboardType="number-pad"
              value={cycleLength}
              placeholder="npr. 28"
              onChangeText={setCycleLength}
              style={styles.input}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Trajanje menstruacije (dana)</Text>
            <TextInput
              keyboardType="number-pad"
              value={periodLength}
              placeholder="npr. 5"
              onChangeText={setPeriodLength}
              style={styles.input}
            />
          </View>
        </View>
        <Text style={styles.label}>Datum poslednje menstruacije</Text>
        <TextInput
          placeholder="YYYY-MM-DD"
          value={lastPeriod}
          onChangeText={setLastPeriod}
          style={styles.input}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.primaryButton, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.primaryLabel}>{saving ? 'Čuvanje...' : 'Sačuvaj promene'}</Text>
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
    gap: 18,
    paddingBottom: 48,
  },
  heading: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 26,
    color: Colors.light.text,
  },
  copy: {
    fontFamily: 'Inter_400Regular',
    color: '#5C5C5C',
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
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    color: '#6B5E58',
  },
  input: {
    marginTop: 6,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  pillSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  pillLabel: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
  pillLabelSelected: {
    color: Colors.light.background,
  },
  error: {
    fontFamily: 'Inter_500Medium',
    color: '#AF1F1F',
  },
  primaryButton: {
    marginTop: 12,
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
  buttonDisabled: {
    opacity: 0.6,
  },
});
