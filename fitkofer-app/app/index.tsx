import { Redirect, type Href } from 'expo-router';

import { useAppState } from '@/state/AppStateContext';

export default function IndexRoute() {
  const { profile, plan, session, isHydrated } = useAppState();
  const dashboardHref = '/(tabs)/dashboard' satisfies Href;

  if (!isHydrated) {
    return null;
  }

  if (!session) {
    return <Redirect href="/auth" />;
  }

  if (!profile) {
    return <Redirect href="/onboarding" />;
  }

  if (!plan) {
    return <Redirect href="/plan-preview" />;
  }

  return <Redirect href={dashboardHref} />;
}
