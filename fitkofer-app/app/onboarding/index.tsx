import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter, type Href } from "expo-router";

import Colors from "@/constants/Colors";
import { generatePlan } from "@/lib/plan/generator";
import { useAppState } from "@/state/AppStateContext";
import type {
  ActivityLevel,
  Goal,
  HealthCondition,
  StressLevel,
  UserProfile,
} from "@/types";

const steps = ["O tebi", "Ciljevi", "Ishrana", "Logistika"] as const;

type Step = (typeof steps)[number];

const goals: { value: Goal; label: string }[] = [
  { value: "lose", label: "Gubitak masnog tkiva" },
  { value: "maintain", label: "Odrzavanje" },
  { value: "gain", label: "Dobitak misica" },
];
const activities: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedeći posao" },
  { value: "light", label: "Lagano aktivna" },
  { value: "moderate", label: "Trening 3-4x" },
  { value: "high", label: "Intenzivno 5x+" },
];

const conditions: { value: HealthCondition; label: string }[] = [
  { value: "IR", label: "Insulinska rezistencija" },
  { value: "Hashimoto", label: "Hashimoto" },
  { value: "PCOS", label: "PCOS" },
];

const stressOptions: { value: StressLevel; label: string }[] = [
  { value: 1, label: "Nizak" },
  { value: 2, label: "Blago podignut" },
  { value: 3, label: "Umeren" },
  { value: 4, label: "Visok" },
  { value: 5, label: "Hronično visok" },
];

const dietOptions: { value: UserProfile["dietPreference"]; label: string }[] = [
  { value: "omnivore", label: "Sve jedem" },
  { value: "mixed", label: "Meso + povrce fokus" },
  { value: "pescatarian", label: "Riba i biljni izvori" },
  { value: "vegetarian", label: "Vegetarijanski" },
  { value: "keto", label: "Keto (low carb)" },
  { value: "carnivore", label: "Carnivore" },
];

const initialProfile: UserProfile = {
  age: 28,
  heightCm: 168,
  weightKg: 68,
  goal: "lose",
  activityLevel: "light",
  equipment: {
    location: "home",
    items: [],
  },
  daysPerWeek: 3,
  dietPreference: "omnivore",
  allergies: [],
  dislikedFoods: [],
  sleepHours: 7,
  stressLevel: 3,
  healthConditions: [],
  cycleLengthDays: null,
  periodLengthDays: null,
  lastPeriodDate: null,
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
      <Text
        style={[
          styles.pillLabel,
          selected ? styles.pillLabelSelected : undefined,
        ]}
      >
        {label}
      </Text>
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const {
    plan: existingPlan,
    setProfile,
    setPlan,
    session,
    isHydrated,
  } = useAppState();
  const [activeStep, setActiveStep] = useState<Step>(steps[0]);
  const [form, setForm] = useState<UserProfile>(initialProfile);
  const [allergyInput, setAllergyInput] = useState("");
  const [dislikeInput, setDislikeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const stepIndex = useMemo(() => steps.indexOf(activeStep), [activeStep]);

  useEffect(() => {
    if (isHydrated && !session) {
      router.replace("/auth");
    }
  }, [isHydrated, router, session]);

  if (!session) {
    return null;
  }

  const nextStep = () => {
    if (stepIndex < steps.length - 1) {
      setActiveStep(steps[stepIndex + 1]);
      setError(null);
      setFieldErrors({});
    }
  };

  const prevStep = () => {
    if (stepIndex > 0) {
      setActiveStep(steps[stepIndex - 1]);
      setError(null);
      setFieldErrors({});
    }
  };

  const handleAddItem = (type: "allergies" | "dislikedFoods") => {
    const value =
      type === "allergies" ? allergyInput.trim() : dislikeInput.trim();
    if (!value) return;
    setForm((prev) => ({
      ...prev,
      [type]: Array.from(new Set([...prev[type], value])),
    }));
    if (type === "allergies") {
      setAllergyInput("");
    } else {
      setDislikeInput("");
    }
  };

  const handleRemoveItem = (
    type: "allergies" | "dislikedFoods",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [type]: prev[type].filter((item) => item !== value),
    }));
  };

  const validateStep = (): boolean => {
    const errors: Record<string, string> = {};

    if (activeStep === "O tebi") {
      if (!form.age || form.age < 13 || form.age > 100) {
        errors.age = "Unesi godine (13-100).";
      }
      if (!form.heightCm || form.heightCm < 120 || form.heightCm > 220) {
        errors.heightCm = "Unesi visinu u centimetrima.";
      }
      if (!form.weightKg || form.weightKg < 35 || form.weightKg > 200) {
        errors.weightKg = "Unesi tezinu u kilogramima.";
      }
      if (!form.sleepHours || form.sleepHours < 3 || form.sleepHours > 12) {
        errors.sleepHours = "Unesi sati sna (3-12).";
      }
      if (!form.stressLevel) {
        errors.stressLevel = "Oznaci nivo stresa.";
      }

      const { cycleLengthDays, periodLengthDays, lastPeriodDate } = form;
      const hasCycleData =
        cycleLengthDays != null ||
        periodLengthDays != null ||
        (lastPeriodDate ?? "") !== "";
      if (hasCycleData) {
        if (
          cycleLengthDays != null &&
          (cycleLengthDays < 15 || cycleLengthDays > 60)
        ) {
          errors.cycleLengthDays =
            "Duzina ciklusa treba da bude izmedju 15 i 60 dana.";
        }
        if (
          periodLengthDays != null &&
          (periodLengthDays < 1 || periodLengthDays > 15)
        ) {
          errors.periodLengthDays =
            "Trajanje menstruacije treba da bude izmedju 1 i 15 dana.";
        }
        if (
          lastPeriodDate &&
          !/^\d{4}-\d{2}-\d{2}$/.test(lastPeriodDate ?? "")
        ) {
          errors.lastPeriodDate =
            "Koristi format YYYY-MM-DD ili ostavi prazno.";
        }
      }
    }

    if (activeStep === "Ciljevi") {
      if (!form.goal) {
        errors.goal = "Odaberi glavni cilj.";
      }
      if (!form.activityLevel) {
        errors.activityLevel = "Oznaci nivo aktivnosti.";
      }
    }

    if (activeStep === "Ishrana") {
      if (!form.dietPreference) {
        errors.dietPreference = "Izaberi preferenciju ishrane.";
      }
    }

    if (activeStep === "Logistika") {
      if (!form.equipment.location) {
        errors.equipmentLocation = "Izaberi lokaciju treninga.";
      }
      if (
        form.equipment.location === "home" &&
        form.equipment.items.length === 0
      ) {
        errors.equipmentItems =
          "Dodaj barem jednu stavku opreme ili oznaci 'Bez opreme'.";
      }
      if (!form.daysPerWeek) {
        errors.daysPerWeek = "Izaberi broj trening dana.";
      }
    }

    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      setFieldErrors(errors);
      setError("Ispravi obelezena polja pre nastavka.");
      return false;
    }

    setFieldErrors({});
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
      const plan = generatePlan(form, existingPlan ?? undefined);
      await setPlan(plan);
      router.replace("/plan-options" as Href);
    } catch (submitError) {
      console.error("[Onboarding] Failed to persist profile/plan", submitError);
      setError("Došlo je do greške pri čuvanju plana. Pokušaj ponovo.");
    }
  };

  const equipmentItems =
    form.equipment.location === "home"
      ? ["Trake", "Bučice", "Klupa", "Bez opreme"]
      : ["Šipka", "Mašine", "Bučice", "Kardio zona"];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headline}>Započni promenu</Text>
        <Text style={styles.subhead}>
          Personalizovan plan za trening, ishranu i navike kroz 5 kratkih
          koraka.
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((stepIndex + 1) / steps.length) * 100}%` },
            ]}
          />
        </View>

        <StepTitle step={activeStep} index={stepIndex} />

        {activeStep === "O tebi" && (
          <>
            <Section title="Osnovne informacije">
              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Godine</Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={String(form.age)}
                    onChangeText={(text) => {
                      clearFieldError("age");
                      setForm((prev) => ({
                        ...prev,
                        age: Number(text.replace(/[^0-9]/g, "")) || 0,
                      }));
                    }}
                    onFocus={() => clearFieldError("age")}
                    style={[
                      styles.input,
                      fieldErrors.age ? styles.inputError : undefined,
                    ]}
                  />
                  {fieldErrors.age ? (
                    <Text style={styles.fieldError}>{fieldErrors.age}</Text>
                  ) : null}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Visina (cm)</Text>
                  <TextInput
                    keyboardType="number-pad"
                    value={String(form.heightCm)}
                    onChangeText={(text) => {
                      clearFieldError("heightCm");
                      setForm((prev) => ({
                        ...prev,
                        heightCm: Number(text.replace(/[^0-9]/g, "")) || 0,
                      }));
                    }}
                    onFocus={() => clearFieldError("heightCm")}
                    style={[
                      styles.input,
                      fieldErrors.heightCm ? styles.inputError : undefined,
                    ]}
                  />
                  {fieldErrors.heightCm ? (
                    <Text style={styles.fieldError}>
                      {fieldErrors.heightCm}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Težina (kg)</Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    value={String(form.weightKg)}
                    onChangeText={(text) => {
                      clearFieldError("weightKg");
                      setForm((prev) => ({
                        ...prev,
                        weightKg: Number(text.replace(/[^0-9.]/g, "")) || 0,
                      }));
                    }}
                    onFocus={() => clearFieldError("weightKg")}
                    style={[
                      styles.input,
                      fieldErrors.weightKg ? styles.inputError : undefined,
                    ]}
                  />
                  {fieldErrors.weightKg ? (
                    <Text style={styles.fieldError}>
                      {fieldErrors.weightKg}
                    </Text>
                  ) : null}
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
                    onChangeText={(text) => {
                      clearFieldError("sleepHours");
                      setForm((prev) => ({
                        ...prev,
                        sleepHours: Number(text.replace(/[^0-9.]/g, "")) || 0,
                      }));
                    }}
                    onFocus={() => clearFieldError("sleepHours")}
                    style={[
                      styles.input,
                      fieldErrors.sleepHours ? styles.inputError : undefined,
                    ]}
                  />
                  {fieldErrors.sleepHours ? (
                    <Text style={styles.fieldError}>
                      {fieldErrors.sleepHours}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View
                style={[
                  styles.pillRow,
                  fieldErrors.stressLevel ? styles.pillRowError : undefined,
                ]}
              >
                {stressOptions.map((option) => (
                  <OptionPill
                    key={option.value}
                    label={option.label}
                    selected={form.stressLevel === option.value}
                    onPress={() => {
                      clearFieldError("stressLevel");
                      setForm((prev) => ({
                        ...prev,
                        stressLevel: option.value,
                      }));
                    }}
                  />
                ))}
              </View>
              {fieldErrors.stressLevel ? (
                <Text style={styles.fieldError}>{fieldErrors.stressLevel}</Text>
              ) : null}
            </Section>

            <Section title="Ciklus (opciono)">
              <Text style={styles.sectionHint}>
                Pomozite nam da prilagodimo trening i kalorije. Preskoči ako ne
                želiš da deliš.
              </Text>
              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Dužina ciklusa (dana)</Text>
                  <TextInput
                    keyboardType="number-pad"
                    placeholder="npr. 28"
                    value={
                      form.cycleLengthDays ? String(form.cycleLengthDays) : ""
                    }
                    onChangeText={(text) => {
                      clearFieldError("cycleLengthDays");
                      const cleaned = text.replace(/[^0-9]/g, "");
                      setForm((prev) => ({
                        ...prev,
                        cycleLengthDays: cleaned ? Number(cleaned) : null,
                      }));
                    }}
                    onFocus={() => clearFieldError("cycleLengthDays")}
                    style={[
                      styles.input,
                      fieldErrors.cycleLengthDays
                        ? styles.inputError
                        : undefined,
                    ]}
                  />
                  {fieldErrors.cycleLengthDays ? (
                    <Text style={styles.fieldError}>
                      {fieldErrors.cycleLengthDays}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Trajanje menstruacije (dana)</Text>
                  <TextInput
                    keyboardType="number-pad"
                    placeholder="npr. 5"
                    value={
                      form.periodLengthDays ? String(form.periodLengthDays) : ""
                    }
                    onChangeText={(text) => {
                      clearFieldError("periodLengthDays");
                      const cleaned = text.replace(/[^0-9]/g, "");
                      setForm((prev) => ({
                        ...prev,
                        periodLengthDays: cleaned ? Number(cleaned) : null,
                      }));
                    }}
                    onFocus={() => clearFieldError("periodLengthDays")}
                    style={[
                      styles.input,
                      fieldErrors.periodLengthDays
                        ? styles.inputError
                        : undefined,
                    ]}
                  />
                  {fieldErrors.periodLengthDays ? (
                    <Text style={styles.fieldError}>
                      {fieldErrors.periodLengthDays}
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Datum poslednje menstruacije</Text>
                <TextInput
                  placeholder="YYYY-MM-DD"
                  value={form.lastPeriodDate ?? ""}
                  onChangeText={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      lastPeriodDate: value.trim() ? value.trim() : null,
                    }))
                  }
                  onFocus={() => clearFieldError("lastPeriodDate")}
                  style={[
                    styles.input,
                    fieldErrors.lastPeriodDate ? styles.inputError : undefined,
                  ]}
                />
                {fieldErrors.lastPeriodDate ? (
                  <Text style={styles.fieldError}>
                    {fieldErrors.lastPeriodDate}
                  </Text>
                ) : null}
              </View>
            </Section>
          </>
        )}

        {activeStep === "Ciljevi" && (
          <>
            <Section title="Glavni cilj">
              <View
                style={[
                  styles.pillRow,
                  fieldErrors.goal ? styles.pillRowError : undefined,
                ]}
              >
                {goals.map((goal) => (
                  <OptionPill
                    key={goal.value}
                    label={goal.label}
                    selected={form.goal === goal.value}
                    onPress={() => {
                      clearFieldError("goal");
                      setForm((prev) => ({ ...prev, goal: goal.value }));
                    }}
                  />
                ))}
              </View>
              {fieldErrors.goal ? (
                <Text style={styles.fieldError}>{fieldErrors.goal}</Text>
              ) : null}
            </Section>

            <Section title="Aktivnost">
              <View
                style={[
                  styles.pillColumn,
                  fieldErrors.activityLevel ? styles.pillRowError : undefined,
                ]}
              >
                {activities.map((activity) => (
                  <OptionPill
                    key={activity.value}
                    label={activity.label}
                    selected={form.activityLevel === activity.value}
                    onPress={() => {
                      clearFieldError("activityLevel");
                      setForm((prev) => ({
                        ...prev,
                        activityLevel: activity.value,
                      }));
                    }}
                  />
                ))}
              </View>
              {fieldErrors.activityLevel ? (
                <Text style={styles.fieldError}>
                  {fieldErrors.activityLevel}
                </Text>
              ) : null}
            </Section>

            <Section title="Zdravstveni uslovi">
              <View style={styles.pillRow}>
                {conditions.map((condition) => {
                  const selected = form.healthConditions.includes(
                    condition.value,
                  );
                  return (
                    <OptionPill
                      key={condition.value}
                      label={condition.label}
                      selected={selected}
                      onPress={() =>
                        setForm((prev) => ({
                          ...prev,
                          healthConditions: selected
                            ? prev.healthConditions.filter(
                                (item) => item !== condition.value,
                              )
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

        {activeStep === "Ishrana" && (
          <>
            <Section title="Preferencije">
              <View
                style={[
                  styles.pillRow,
                  fieldErrors.dietPreference ? styles.pillRowError : undefined,
                ]}
              >
                {dietOptions.map((option) => (
                  <OptionPill
                    key={option.value}
                    label={option.label}
                    selected={form.dietPreference === option.value}
                    onPress={() => {
                      clearFieldError("dietPreference");
                      setForm((prev) => ({
                        ...prev,
                        dietPreference: option.value,
                      }));
                    }}
                  />
                ))}
              </View>
              {fieldErrors.dietPreference ? (
                <Text style={styles.fieldError}>
                  {fieldErrors.dietPreference}
                </Text>
              ) : null}
            </Section>

            <Section title="Alergije">
              <View style={styles.inlineInput}>
                <TextInput
                  placeholder="npr. kikiriki"
                  value={allergyInput}
                  onChangeText={setAllergyInput}
                  style={[styles.input, styles.inlineField]}
                />
                <TouchableOpacity
                  style={styles.inlineButton}
                  onPress={() => handleAddItem("allergies")}
                >
                  <Text style={styles.inlineButtonLabel}>Dodaj</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tagContainer}>
                {form.allergies.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => handleRemoveItem("allergies", item)}
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
                  onPress={() => handleAddItem("dislikedFoods")}
                >
                  <Text style={styles.inlineButtonLabel}>Dodaj</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.tagContainer}>
                {form.dislikedFoods.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => handleRemoveItem("dislikedFoods", item)}
                    style={styles.tag}
                  >
                    <Text style={styles.tagText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Section>
          </>
        )}

        {activeStep === "Logistika" && (
          <>
            <Section title="Gde treniras?">
              <View
                style={[
                  styles.pillRow,
                  fieldErrors.equipmentLocation
                    ? styles.pillRowError
                    : undefined,
                ]}
              >
                <OptionPill
                  label="Kuci"
                  selected={form.equipment.location === "home"}
                  onPress={() => {
                    clearFieldError("equipmentLocation");
                    setForm((prev) => ({
                      ...prev,
                      equipment: {
                        ...prev.equipment,
                        location: "home",
                        items: [],
                      },
                    }));
                  }}
                />
                <OptionPill
                  label="Teretana"
                  selected={form.equipment.location === "gym"}
                  onPress={() => {
                    clearFieldError("equipmentLocation");
                    setForm((prev) => ({
                      ...prev,
                      equipment: {
                        ...prev.equipment,
                        location: "gym",
                        items: [],
                      },
                    }));
                  }}
                />
              </View>
              {fieldErrors.equipmentLocation ? (
                <Text style={styles.fieldError}>
                  {fieldErrors.equipmentLocation}
                </Text>
              ) : null}
            </Section>

            <Section title="Dostupna oprema">
              <View
                style={[
                  styles.tagContainer,
                  fieldErrors.equipmentItems
                    ? styles.tagContainerError
                    : undefined,
                ]}
              >
                {equipmentItems.map((item) => {
                  const selected = form.equipment.items.includes(item);
                  return (
                    <TouchableOpacity
                      key={item}
                      onPress={() =>
                        setForm((prev) => {
                          const nextItems = selected
                            ? prev.equipment.items.filter(
                                (option) => option !== item,
                              )
                            : [...prev.equipment.items, item];
                          if (nextItems.length > 0) {
                            clearFieldError("equipmentItems");
                          }
                          return {
                            ...prev,
                            equipment: {
                              ...prev.equipment,
                              items: nextItems,
                            },
                          };
                        })
                      }
                      style={[
                        styles.tag,
                        selected ? styles.tagSelected : undefined,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          selected ? styles.tagTextSelected : undefined,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {fieldErrors.equipmentItems ? (
                <Text style={styles.fieldError}>
                  {fieldErrors.equipmentItems}
                </Text>
              ) : null}
            </Section>

            <Section title="Koliko dana mozes da treniras?">
              <View
                style={[
                  styles.pillRow,
                  fieldErrors.daysPerWeek ? styles.pillRowError : undefined,
                ]}
              >
                {[2, 3, 4, 5].map((day) => (
                  <OptionPill
                    key={day}
                    label={`${day}x nedeljno`}
                    selected={form.daysPerWeek === day}
                    onPress={() => {
                      clearFieldError("daysPerWeek");
                      setForm((prev) => ({
                        ...prev,
                        daysPerWeek: day as UserProfile["daysPerWeek"],
                      }));
                    }}
                  />
                ))}
              </View>
              {fieldErrors.daysPerWeek ? (
                <Text style={styles.fieldError}>{fieldErrors.daysPerWeek}</Text>
              ) : null}
            </Section>

            <Section title="Spremna si!">
              <Text style={styles.summaryText}>
                Posle zavrsetka generisemo treninge, rotaciju kalorija i navike
                uskladjene sa tvojim ulaznim podacima. Plan mozes dodatno
                prilagoditi kasnije.
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
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleContinue}
            >
              <Text style={styles.primaryButtonLabel}>Nastavi</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSubmit}
            >
              <Text style={styles.primaryButtonLabel}>Zavrsi onboarding</Text>
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
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 28,
    color: Colors.light.text,
    marginBottom: 8,
  },
  subhead: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#5C5C5C",
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.light.border,
    borderRadius: 999,
    marginBottom: 24,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.light.tint,
    borderRadius: 999,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stepIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.tint,
    color: Colors.light.background,
    textAlign: "center",
    textAlignVertical: "center",
    fontFamily: "Inter_600SemiBold",
    marginRight: 12,
  },
  stepTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    marginBottom: 12,
    color: Colors.light.text,
  },
  sectionHint: {
    fontFamily: "Inter_400Regular",
    color: "#8C8C8C",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#6B5E58",
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    color: Colors.light.text,
  },
  inputError: {
    borderColor: "#B12E38",
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  pillRowError: {
    borderColor: "#B12E38",
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
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
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  pillLabelSelected: {
    color: Colors.light.background,
  },
  inlineInput: {
    flexDirection: "row",
    alignItems: "center",
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
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.background,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
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
  tagContainerError: {
    borderColor: "#B12E38",
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  tagText: {
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
  tagTextSelected: {
    color: Colors.light.background,
  },
  summaryText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#5C5C5C",
    lineHeight: 22,
  },
  error: {
    color: "#AF1F1F",
    fontFamily: "Inter_500Medium",
    marginBottom: 16,
  },
  fieldError: {
    color: "#B12E38",
    fontFamily: "Inter_500Medium",
    marginTop: 6,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonLabel: {
    color: Colors.light.background,
    fontFamily: "Inter_600SemiBold",
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
    fontFamily: "Inter_500Medium",
    color: Colors.light.text,
  },
});
