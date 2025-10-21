import { Redirect } from 'expo-router';

import { useAppState } from '@/state/AppStateContext';

export default function IndexRoute() {
  const { profile, plan } = useAppState();

  if (!profile) {
    return <Redirect href="/onboarding" />;
  }

  if (!plan) {
    return <Redirect href="/plan-preview" />;
  }

  return <Redirect href="/(tabs)" />;
}
