import { StatusBar } from 'expo-status-bar';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';

export default function LegalModal() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Fitkofer pravni okvir</Text>
      <Text style={styles.copy}>
        Fitkofer aplikacija pruža edukativne smernice za trening, ishranu i navike. Informacije nisu zamena za
        medicinski savet. Pre početka programa konsultuj lekara, posebno ako imaš IR, Hashimoto ili PCOS.
      </Text>

      <View style={styles.section}>
        <Text style={styles.title}>Privatnost & podaci</Text>
        <Text style={styles.copy}>
          Lični podaci čuvaju se u Supabase (Postgres) sa RLS pravilima. Možeš zatražiti izvoz ili brisanje
          naloga u bilo kom trenutku putem podrške.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Pretplata</Text>
        <Text style={styles.copy}>
          Pretplatu (mesečna/godišnja) upravlja RevenueCat. Besplatni period traje 7 dana, možeš otkazati pre isteka u App
          Store / Play Store nalogu.
        </Text>
      </View>

      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 18,
    backgroundColor: Colors.light.background,
  },
  heading: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    color: Colors.light.text,
  },
  section: {
    gap: 8,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.light.text,
  },
  copy: {
    fontFamily: 'Inter_400Regular',
    color: '#5C5C5C',
    lineHeight: 20,
  },
});
