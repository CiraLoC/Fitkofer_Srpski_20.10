import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import Colors from '@/constants/Colors';
import { generatePlan } from '@/lib/plan/generator';
import { useAppState } from '@/state/AppStateContext';
import type {
  ActivityLevel,
  Goal,
  HealthCondition,
  StressLevel,
  UserProfile,
} from '@/types';

const steps = ['O tebi', 'Ciljevi', 'Ishrana', 'Oprema', 'Raspored'] as const;

type Step = (typeof steps)[number];

const goals: { value: Goal; label: string }[] = [
  { value: 'lose', label: 'Gubitak masnog tkiva' },
  { value: 'maintain', label: 'Održavanje' },
  { value: 'gain', label: 'Dobitak mišića' },
];

const activities: { value: ActivityLevel; label: string }[] = [
  { value: 'sedentary', label: 'Sedeći posao' },
  { value: 'light', label: 'Lagano aktivna' },
  { value: 'moderate', label: 'Trening 3-4x' },
  { value: 'high', label: 'Intenzivno 5x+' },
];

const conditions: { value: HealthCondition; label: string }[] = [
  { value: 'IR', label: 'Insulinska rezistencija' },
  { value: 'Hashimoto', label: 'Hashimoto' },
  { value: 'PCOS', label: 'PCOS' },
];

const stressOptions: { value: StressLevel; label: string }[] = [
  { value: 1, label: 'Nizak' },
  { value: 2, label: 'Blago podignut' },
  { value: 3, label: 'Umeren' },
  { value: 4, label: 'Visok' },
  { value: 5, label: 'Hronično visok' },
];

const dietOptions: { value: UserProfile['dietPreference']; label: string }[] = [
  { value: 'omnivore', label: 'Sve jedem' },
  { value: 'mixed', label: 'Meso + povrće fokus' },
  { value: 'pescatarian', label: 'Riba i biljni izvori' },
  { value: 'vegetarian', label: 'Vegetarijanski' },
];

const initialProfile: UserProfile = {
  age: 28,
  heightCm: 168,
  weightKg: 68,
  goal: 'lose',
  activityLevel: 'light',
  equipment: {
    location: 'home',
    items: [],
  },
  daysPerWeek: 3,
  dietPreference: 'omnivore',
  allergies: [],
  dislikedFoods: [],
  sleepHours: 7,
  stressLevel: 3,
  healthConditions: [],
};

function OptionPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.pill,
        selected ? styles.pillSelected : undefined,
        { borderColor: selected ? Colors.light.tint : Colors.light.border },
      ]}
    >
      <Text style={[styles.pillLabel, selected ? styles.pillLabelSelected : undefined]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StepTitle({ step, index }: { step: Step; index: number }) {
  return (
    <View style={styles.stepHeader}>
      <Text style={styles.stepIndex}>{index + 1}</Text>
      <Text style={styles.stepTitle}>{step}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { setProfile, setPlan, session, isHydrated } = useAppState();
  const [activeStep, setActiveStep] = useState<Step>(steps[0]);
  const [form, setForm] = useState<UserProfile>(initialProfile);
  const [allergyInput, setAllergyInput] = useState('');
  const [dislikeInput, setDislikeInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated && !session) {
      router.replace('/auth');
    }
  }, [isHydrated, router, session]);

  if (!session) {
    return null;
  }

  const stepIndex = useMemo(() => steps.indexOf(activeStep), [activeStep]);

  const nextStep = () => {
    if (stepIndex < steps.length - 1) {
      setActiveStep(steps[stepIndex + 1]);
      setError(null);
    }
  };

  const prevStep = () => {
    if (stepIndex > 0) {
      setActiveStep(steps[stepIndex - 1]);
      setError(null);
    }
  };

  const handleAddItem = (type: 'allergies' | 'dislikedFoods') => {
    const value = type === 'allergies' ? allergyInput.trim() : dislikeInput.trim();
    if (!value) return;
    setForm((prev) => ({
      ...prev,
      [type]: Array.from(new Set([...prev[type], value])),
    }));
    if (type === 'allergies') {
      setAllergyInput('');
    } else {
      setDislikeInput('');
    }
  };

  const handleRemoveItem = (type: 'allergies' | 'dislikedFoods', value: string) => {
    setForm((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item !== value),
    }));
  };

  const validateStep = (): boolean => {
    if (activeStep === 'O tebi') {
      if (!form.age || !form.heightCm || !form.weightKg) {
        setError('Popuni godine, visinu i težinu.');
        return false;
      }
    }
    if (activeStep === 'Oprema') {
      if (form.equipment.location === 'home' && form.equipment.items.length === 0) {
        setError('Dodaj barem jednu stavku opreme ili označi da radiš bez opreme.');
        return false;
      }
    }
    if (activeStep === 'Raspored') {
      if (!form.daysPerWeek) {
        setError('Izaberi broj trening dana.');
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleContinue = () => {
    if (validateStep()) {
      nextStep();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    try {
      await setProfile(form);
      const plan = generatePlan(form);
      await setPlan(plan);
      router.replace('/plan-preview');
    } catch (submitError) {
      console.error('[Onboarding] Failed to persist profile/plan', submitError);
      setError('Došlo je do greške pri čuvanju plana. Pokušaj ponovo.');
    }
  };

  const equipmentItems =
    form.equipment.location === 'home'
      ? ['Trake', 'Bučice', 'Klupa', 'Bez opreme']
      : ['Šipka', 'Mašine', 'Bučice', 'Kardio zona'];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headline}>Započni promenu</Text>
        <Text style={styles.subhead}>
          Personalizovan plan za trening, ishranu i navike kroz 5 kratkih koraka.
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((stepIndex + 1) / steps.length) * 100}%` }]} />
        </View>

        <StepTitle step={activeStep} index={stepIndex} />

        {activeStep === 'O tebi' && (
          <>
            <Section title="Osnovne informacije">
              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Godine</Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={String(form.age)}
                    onChangeText={(text) =>
                      setForm((prev) => ({ ...prev, age: Number(text.replace(/[^0-9]/g, '')) || 0 }))
                    }
                    style={styles.input}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Visina (cm)</Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={String(form.heightCm)}
                    onChangeText={(text) =>
                      setForm((prev) => ({
                        ...prev,
                        heightCm: Number(text.replace(/[^0-9]/g, '')) || 0,
                      }))
                    }
                    style={styles.input}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Težina (kg)</Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    value={String(form.weightKg)}
                    onChangeText={(text) =>
                      setForm((prev) => ({
                        ...prev,
                        weightKg: Number(text.replace(/[^0-9.]/g, '')) || 0,
                      }))
                    }
                    style={styles.input}
                  />
                </View>
              </View>
            </Section>

            <Section title="Spavanje & stres">
              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Sati sna</Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    value={String(form.sleepHours)}
                    onChangeText={(text) =>
                      setForm((prev) => ({
                        ...prev,
                        sleepHours: Number(text.replace(/[^0-9.]/g, '')) || 0,
                      }))
                    }
                    style={styles.input}
                  />
                </View>
              </View>
              <View style={styles.pillRow}>
                {stressOptions.map((option) => (
                  <OptionPill
                    key={option.value}
                    label={option.label}
                    selected={form.stressLevel === option.value}
                    onPress={() => setForm((prev) => ({ ...prev, stressLevel: option.value }))}
                  />
                ))}
              </View>
            </Section>
          </>
        )}

        {activeStep === 'Ciljevi' && (
          <>
            <Section title="Glavni cilj">
              <View style={styles.pillRow}>
                {goals.map((goal) => (
                  <OptionPill
                    key={goal.value}
                    label={goal.label}
                    selected={form.goal === goal.value}
                    onPress={() => setForm((prev) => ({ ...prev, goal: goal.value }))}
                  />
                ))}
              </View>
            </Section>

            <Section title="Aktivnost">
              <View style={styles.pillColumn}>
                {activities.map((activity) => (
                  <OptionPill
                    key={activity.value}
                    label={activity.label}
                    selected={form.activityLevel === activity.value}
                    onPress={() => setForm((prev) => ({ ...prev, activityLevel: activity.value }))}
                  />
                ))}
              </View>
            </Section>

            <Section title="Zdravstveni uslovi">
              <View style={styles.pillRow}>
                {conditions.map((condition) => {
                  const selected = form.healthConditions.includes(condition.value);
                  return (
                    <OptionPill
                      key={condition.value}
                      label={condition.label}
                      selected={selected}
                      onPress={() =>
                        setForm((prev) => ({
                          ...prev,
                          healthConditions: selected
                            ? prev.healthConditions.filter((item) => item !== condition.value)
                            : [...prev.healthConditions, condition.value],
                        }))
                      }
                    />
                  );
                })}
              </View>
            </Section>
          </>
        )}

        {activeStep === 'Ishrana' && (
          <>
            <Section title="Preferencije">
              <View style={styles.pillRow}>
                {dietOptions.map((option) => (
                  <OptionPill
                    key={option.value}
                    label={option.label}
                    selected={form.dietPreference === option.value}
                    onPress={() => setForm((prev) => ({ ...prev, dietPreference: option.value }))}
                  />
                ))}
              </View>
            </Section>

            <Section title="Alergije">
              <View style={styles.inlineInput}>
                <TextInput
                  placeholder="npr. kikiriki"
                  value={allergyInput}
                  onChangeText={setAllergyInput}
                  style={[styles.input, styles.inlineField]}
                />
                <TouchableOpacity style={styles.inlineButton} onPress={() => handleAddItem('allergies')}>
                  <Text style={styles.inlineButtonLabel}>Dodaj</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tagContainer}>
                {form.allergies.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => handleRemoveItem('allergies', item)}
                    style={styles.tag}
                  >
                    <Text style={styles.tagText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Section>

            <Section title="Ne volim / ne odgovara mi">
              <View style={styles.inlineInput}>
                <TextInput
                  placeholder="npr. plavi sir"
                  value={dislikeInput}
                  onChangeText={setDislikeInput}
                  style={[styles.input, styles.inlineField]}
                />
                <TouchableOpacity
                  style={styles.inlineButton}
                  onPress={() => handleAddItem('dislikedFoods')}
                >
                  <Text style={styles.inlineButtonLabel}>Dodaj</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tagContainer}>
                {form.dislikedFoods.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => handleRemoveItem('dislikedFoods', item)}
                    style={styles.tag}
                  >
                    <Text style={styles.tagText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Section>
          </>
        )}

        {activeStep === 'Oprema' && (
          <>
            <Section title="Gde treniraš?">
              <View style={styles.pillRow}>
                <OptionPill
                  label="Kući"
                  selected={form.equipment.location === 'home'}
                  onPress={() =>
                    setForm((prev) => ({
                      ...prev,
                      equipment: { ...prev.equipment, location: 'home', items: [] },
                    }))
                  }
                />
                <OptionPill
                  label="Teretana"
                  selected={form.equipment.location === 'gym'}
                  onPress={() =>
                    setForm((prev) => ({
                      ...prev,
                      equipment: { ...prev.equipment, location: 'gym', items: [] },
                    }))
                  }
                />
              </View>
            </Section>

            <Section title="Dostupna oprema">
              <View style={styles.tagContainer}>
                {equipmentItems.map((item) => {
                  const selected = form.equipment.items.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() =>
                        setForm((prev) => ({
                          ...prev,
                          equipment: {
                            ...prev.equipment,
                            items: selected
                              ? prev.equipment.items.filter((option) => option !== item)
                              : [...prev.equipment.items, item],
                          },
                        }))
                      }
                      style={[styles.tag, selected ? styles.tagSelected : undefined]}
                    >
                      <Text style={[styles.tagText, selected ? styles.tagTextSelected : undefined]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Section>
          </>
        )}

        {activeStep === 'Raspored' && (
          <>
            <Section title="Koliko dana možeš da treniraš?">
              <View style={styles.pillRow}>
                {[2, 3, 4, 5].map((day) => (
                  <OptionPill
                    key={day}
                    label={`${day}x nedeljno`}
                    selected={form.daysPerWeek === day}
                    onPress={() =>
                      setForm((prev) => ({
                        ...prev,
                        daysPerWeek: day as UserProfile['daysPerWeek'],
                      }))
                    }
                  />
                ))}
              </View>
            </Section>

            <Section title="Spremna si!">
              <Text style={styles.summaryText}>
                Posle potvrde generisaćemo treninge, rotaciju kalorija i navike usklađene sa tvojim
                ulaznim podacima. Plan možeš prilagoditi kasnije.
              </Text>
            </Section>
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.actions}>
          {stepIndex > 0 && (
            <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
              <Text style={styles.secondaryButtonLabel}>Nazad</Text>
            </TouchableOpacity>
          )}
          {stepIndex < steps.length - 1 ? (
            <TouchableOpacity style={styles.primaryButton} onPress={handleContinue}>
              <Text style={styles.primaryButtonLabel}>Nastavi</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
              <Text style={styles.primaryButtonLabel}>Generiši plan</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  headline: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.light.text,
    marginBottom: 8,
  },
  subhead: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#5C5C5C',
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.light.border,
    borderRadius: 999,
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.tint,
    borderRadius: 999,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.tint,
    color: Colors.light.background,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: 'Inter_600SemiBold',
    marginRight: 12,
  },
  stepTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.light.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    marginBottom: 12,
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
    fontSize: 14,
    color: '#6B5E58',
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: Colors.light.text,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pillColumn: {
    gap: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: Colors.light.background,
  },
  pillSelected: {
    backgroundColor: Colors.light.tint,
  },
  pillLabel: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
  pillLabelSelected: {
    color: Colors.light.background,
  },
  inlineInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inlineField: {
    flex: 1,
  },
  inlineButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
  },
  inlineButtonLabel: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.background,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.light.card,
  },
  tagSelected: {
    backgroundColor: Colors.light.tint,
  },
  tagText: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
  tagTextSelected: {
    color: Colors.light.background,
  },
  summaryText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#5C5C5C',
    lineHeight: 22,
  },
  error: {
    color: '#AF1F1F',
    fontFamily: 'Inter_500Medium',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonLabel: {
    color: Colors.light.background,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  secondaryButtonLabel: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
});
