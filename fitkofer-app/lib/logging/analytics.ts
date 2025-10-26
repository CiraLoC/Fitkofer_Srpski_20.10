import Constants from "expo-constants";

type AnalyticsConfig = {
  apiKey: string;
  host: string;
};

let config: AnalyticsConfig | null = null;
let distinctId: string = "anonymous";
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

export function initAnalytics() {
  if (initialized) return;
  const extra = getExtra();
  const apiKey =
    (extra?.posthogApiKey as string | undefined) ??
    process.env.EXPO_PUBLIC_POSTHOG_KEY;
  if (!apiKey) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.info(
        "[analytics] EXPO_PUBLIC_POSTHOG_KEY not set, analytics disabled.",
      );
    }
    initialized = true;
    return;
  }

  const host =
    (extra?.posthogHost as string | undefined) ??
    process.env.EXPO_PUBLIC_POSTHOG_HOST ??
    "https://app.posthog.com";

  config = { apiKey, host };
  initialized = true;
}

export function setAnalyticsUser(id: string | null) {
  distinctId = id ?? "anonymous";
}

export async function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>,
) {
  if (!initialized) {
    initAnalytics();
  }
  if (!config) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.debug("[analytics] Event skipped", eventName, properties);
    }
    return;
  }

  try {
    await fetch(`${config.host}/capture/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: config.apiKey,
        event: eventName,
        properties: {
          distinct_id: distinctId,
          $lib: "fitkofer-app",
          ...properties,
        },
      }),
    });
  } catch (error) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn("[analytics] Failed to send event", eventName, error);
    }
  }
}
