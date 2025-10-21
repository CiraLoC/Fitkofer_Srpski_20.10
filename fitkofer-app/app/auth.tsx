import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase/client';
import { useAppState } from '@/state/AppStateContext';

type AuthMode = 'signIn' | 'signUp';

export default function AuthScreen() {
  const router = useRouter();
  const { session, isHydrated } = useAppState();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (isHydrated && session) {
      router.replace('/');
    }
  }, [isHydrated, router, session]);

  const disabled = !email || !password || loading;
  const buttonLabel = useMemo(
    () => (mode === 'signIn' ? 'Prijavi se' : 'Registruj se'),
    [mode],
  );

  const toggleLabel = useMemo(
    () => (mode === 'signIn' ? 'Nemaš nalog? Registruj se' : 'Već imaš nalog? Prijavi se'),
    [mode],
  );

  const handleSubmit = async () => {
    if (disabled) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signIn') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          throw signInError;
        }
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          throw signUpError;
        }
        if (!data.session) {
          setInfo('Proveri email za potvrdu naloga pre prijavljivanja.');
        }
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : String(authError));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setMode((prev) => (prev === 'signIn' ? 'signUp' : 'signIn'));
    setError(null);
    setInfo(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{mode === 'signIn' ? 'Dobrodošla nazad' : 'Kreiraj nalog'}</Text>
        <Text style={styles.subtitle}>
          {mode === 'signIn'
            ? 'Unesi email i lozinku za nastavak.'
            : 'Registruj se da bi sačuvala svoj plan i napredak.'}
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#B0A8A2"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Lozinka</Text>
          <TextInput
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            placeholder="********"
            placeholderTextColor="#B0A8A2"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          disabled={disabled}
          style={({ pressed }) => [
            styles.primaryButton,
            disabled ? styles.buttonDisabled : undefined,
            pressed ? styles.buttonPressed : undefined,
          ]}
        >
          {loading ? <ActivityIndicator color={Colors.light.background} /> : <Text style={styles.primaryLabel}>{buttonLabel}</Text>}
        </Pressable>

        <Pressable onPress={handleToggleMode}>
          <Text style={styles.toggle}>{toggleLabel}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.light.card,
    padding: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 18,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    color: Colors.light.text,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    color: '#6B5E58',
    lineHeight: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
  error: {
    color: '#B12E38',
    fontFamily: 'Inter_500Medium',
  },
  info: {
    color: Colors.palette.olive,
    fontFamily: 'Inter_500Medium',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  primaryLabel: {
    color: Colors.light.background,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  toggle: {
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Inter_500Medium',
    color: Colors.light.text,
  },
});
