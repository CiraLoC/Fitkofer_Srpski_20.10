import { router, type Href } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';

import Colors from '@/constants/Colors';

const options = [
  {
    id: 'nutrition',
    title: 'Generisi plan Ishrane',
    subtitle: 'Personalizovana sedmična rotacija obroka i lista za kupovinu.',
    route: '/plan-selection/nutrition',
  },
  {
    id: 'training',
    title: 'Generisi plan treninga',
    subtitle: 'Pametno raspoređeni treninzi sa tvojom dostupnom opremom.',
    route: '/plan-selection/training',
  },
  {
    id: 'habits',
    title: 'Generisi plan uvodjenja zdravih navika',
    subtitle: 'Dnevni i nedeljni izazovi koji grade doslednost.',
    route: '/plan-selection/habits',
  },
  {
    id: 'full',
    title: 'Generisi ceo paket',
    subtitle: 'Ishrana + trening + navike u jednoj kontrolnoj tabli.',
    route: '/plan-preview',
  },
];

export default function PlanOptionsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Dobrodošla!</Text>
      <Text style={styles.subheading}>
        Izaberi kako želiš da nastaviš i preuzmi kontrolu nad zdravljem uz personalizovane planove.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Šta želiš da personalizuješ?</Text>
        <Text style={styles.cardCopy}>
          Svaki plan možeš aktivirati zasebno ili uzeti komplet. U sledećem koraku pokazaćemo pogodnosti
          i opcije pretplate.
        </Text>
      </View>

      <View style={styles.optionList}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionButton}
            onPress={() => router.replace(option.route as Href)}
          >
            <Text style={styles.optionTitle}>{option.title}</Text>
            <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
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
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 30,
    color: Colors.light.text,
  },
  subheading: {
    fontFamily: 'Inter_400Regular',
    color: '#5C5C5C',
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
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.light.text,
  },
  cardCopy: {
    fontFamily: 'Inter_400Regular',
    color: '#5C5C5C',
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
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.light.text,
  },
  optionSubtitle: {
    fontFamily: 'Inter_400Regular',
    color: '#6B5E58',
    lineHeight: 20,
  },
});


