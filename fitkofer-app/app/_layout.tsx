import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import {
  PlayfairDisplay_700Bold,
  PlayfairDisplay_600SemiBold,
} from "@expo-google-fonts/playfair-display";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";

import { initSentry } from "@/lib/logging/sentry";
import { initAnalytics } from "@/lib/logging/analytics";
import { AppStateProvider } from "@/state/AppStateContext";
import { ThemeProvider } from "@/state/ThemeContext";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

initSentry();
initAnalytics();

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_600SemiBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <ThemeProvider>
      <AppStateProvider>
        <ThemedNavigation />
      </AppStateProvider>
    </ThemeProvider>
  );
}

function ThemedNavigation() {
  const colorScheme = useColorScheme();
  const surface = Colors[colorScheme];
  const navigationTheme =
    colorScheme === "dark" ? { ...DarkTheme } : { ...DefaultTheme };
  navigationTheme.colors = {
    ...navigationTheme.colors,
    background: surface.background,
    card: surface.card,
    text: surface.text,
    border: surface.border,
    primary: surface.tint,
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="onboarding/index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="plan-preview"
          options={{
            title: "Plan pregled",
            headerTitleStyle: {
              fontFamily: "Inter_600SemiBold",
              fontSize: 18,
            },
          }}
        />
        <Stack.Screen
          name="plan-options"
          options={{
            title: "Izaberi plan",
            headerTitleStyle: {
              fontFamily: "Inter_600SemiBold",
              fontSize: 18,
            },
          }}
        />
        <Stack.Screen
          name="plan-selection"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="membership-required"
          options={{
            title: "Članstvo",
            headerTitleStyle: {
              fontFamily: "Inter_600SemiBold",
              fontSize: 18,
            },
          }}
        />
        <Stack.Screen
          name="profile-edit"
          options={{
            title: "Uredi profil",
            headerTitleStyle: {
              fontFamily: "Inter_600SemiBold",
              fontSize: 18,
            },
          }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}
