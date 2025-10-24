import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect, type Href, useRouter } from 'expo-router';

import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase/client';
import { useAppState } from '@/state/AppStateContext';

export default function IndexRoute() {
  const { plan, session, isHydrated, hasCompletedOnboarding } = useAppState();
  const dashboardHref = '/(tabs)/dashboard' satisfies Href;

  if (!isHydrated) {
    return null;
  }

  if (!session) {
    return <LandingScreen />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (!plan) {
    return <Redirect href="/plan-options" />;
  }

  return <Redirect href={dashboardHref} />;
}

function LandingScreen() {
  const router = useRouter();
  const [loginVisible, setLoginVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Nedostaju podaci', 'Unesi email adresu i lozinku.');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        throw error;
      }
      setLoginVisible(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      Alert.alert(
        'Prijava nije uspela',
        error instanceof Error ? error.message : 'Pokušaj ponovo.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    router.push('/auth?mode=signUp' as Href);
  };

  const handleOpenLogin = () => {
    setEmail('');
    setPassword('');
    setLoginVisible(true);
  };

  return (
    <View style={styles.landingContainer}>
      <ScrollView contentContainerStyle={styles.landingContent}>
        <Text style={styles.appName}>FitkoferApp</Text>
        <Text style={styles.tagline}>
          Unapredite vaše zdravlje uz održive rutine i personalizovane programe treninga i ishrane.
        </Text>

        <View style={styles.buttonStack}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleCreateAccount}>
            <Text style={styles.primaryLabel}>Kreiraj nalog</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleOpenLogin}>
            <Text style={styles.secondaryLabel}>Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={loginVisible} transparent animationType="fade" onRequestClose={() => setLoginVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Prijavi se</Text>
            <Text style={styles.modalCopy}>Unesi email adresu i lozinku kako bi nastavio la sa planom.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Email adresa"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Lozinka"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.light.background} />
              ) : (
                <Text style={styles.primaryLabel}>Prijavi se</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalSecondaryButton} onPress={() => setLoginVisible(false)}>
              <Text style={styles.modalSecondaryLabel}>Zatvori</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  landingContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  landingContent: {
    flexGrow: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  appName: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 42,
    color: Colors.light.text,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: 18,
    color: '#5C5C5C',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },
  buttonStack: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
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
    borderWidth: 1,
    borderColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  secondaryLabel: {
    fontFamily: 'Inter_600SemiBold',
    color: Colors.light.tint,
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: Colors.light.text,
  },
  modalCopy: {
    fontFamily: 'Inter_400Regular',
    color: '#6B5E58',
  },
  modalInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
  modalSecondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalSecondaryLabel: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
