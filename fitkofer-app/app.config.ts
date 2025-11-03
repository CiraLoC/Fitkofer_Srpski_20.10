import type { ExpoConfig, ConfigContext } from "expo/config";
import "dotenv/config";

const defineConfig = ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "fitkofer-app",
  slug: "fitkofer-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/logo-full-color.png",
  scheme: "fitkoferapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#B2554E",
  },
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/logo-full-color.png",
      backgroundColor: "#B2554E",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    ...(process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
      ? [
          [
            "sentry-expo",
            {
              organization: process.env.SENTRY_ORG,
              project: process.env.SENTRY_PROJECT,
            },
          ],
        ]
      : []),
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    whopCheckoutUrl: process.env.EXPO_PUBLIC_WHOP_CHECKOUT_URL,
    supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL,
  },
});

export default defineConfig;
