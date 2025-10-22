import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Colors from '@/constants/Colors';

export default function NutritionPlanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Plan ishrane spreman!</Text>
      <Text style={styles.copy}>
        Pogledaj personalizovanu rotaciju obroka, makroe i listu za kupovinu za narednih 7 dana.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => router.replace('/(tabs)/nutrition')}
      >
        <Text style={styles.primaryLabel}>Otvori panel za ishranu</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/plan-preview')}>
        <Text style={styles.secondaryLabel}>Ipak želim ceo paket</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 24,
    justifyContent: 'center',
    gap: 20,
  },
  heading: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.light.text,
  },
  copy: {
    fontFamily: 'Inter_400Regular',
    color: '#5C5C5C',
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryLabel: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.background,
    fontSize: 16,
  },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  secondaryLabel: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
});
