import { Redirect, type Href } from 'expo-router';

import { useAppState } from '@/state/AppStateContext';

export default function IndexRoute() {
  const { plan, session, isHydrated, hasCompletedOnboarding } = useAppState();
  const dashboardHref = '/(tabs)/dashboard' satisfies Href;

  if (!isHydrated) {
    return null;
  }

  if (!session) {
    return <Redirect href="/auth" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (!plan) {
    return <Redirect href="/plan-options" />;
  }

  return <Redirect href={dashboardHref} />;
}
