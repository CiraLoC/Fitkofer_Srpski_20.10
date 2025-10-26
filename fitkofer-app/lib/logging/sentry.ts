import Constants from "expo-constants";
import * as Sentry from "sentry-expo";

let initialized = false;

function getExtra() {
  const manifest2Extra = (
    Constants as unknown as { manifest2?: { extra?: Record<string, unknown> } }
  )?.manifest2?.extra;

  return (
    Constants.expoConfig?.extra ??
    (
      Constants.manifest as
        | { extra?: Record<string, unknown> }
        | null
        | undefined
    )?.extra ??
    manifest2Extra ??
    {}
  );
}

export function initSentry() {
  if (initialized) return;
  const extra = getExtra();
  const dsn =
    (extra?.sentryDsn as string | undefined) ??
    process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.info(
        "[sentry] EXPO_PUBLIC_SENTRY_DSN not set, skipping Sentry initialization.",
      );
    }
    return;
  }

  Sentry.init({
    dsn,
    enableInExpoDevelopment: false,
    debug: __DEV__,
    tracesSampleRate: 0.05,
  });
  initialized = true;
}

export { Sentry };
