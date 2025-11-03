import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import {
  ColorSchemeName,
  useColorScheme as useDeviceColorScheme,
} from "react-native";

type ThemePreference = "system" | "light" | "dark";
type ThemeValue = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeValue;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
};

const STORAGE_KEY = "fitkofer_theme_preference";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveTheme(
  preference: ThemePreference,
  system: ColorSchemeName,
): ThemeValue {
  if (preference === "system") {
    return (system as ThemeValue) ?? "light";
  }
  return preference;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useDeviceColorScheme();
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "light" || stored === "dark" || stored === "system") {
          setPreference(stored);
        }
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const theme = useMemo<ThemeValue>(() => {
    return resolveTheme(preference, systemScheme);
  }, [preference, systemScheme]);

  const handleSetPreference = useCallback((value: ThemePreference) => {
    setPreference(value);
    AsyncStorage.setItem(STORAGE_KEY, value).catch(() => undefined);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === "light" ? "dark" : "light";
    handleSetPreference(next);
  }, [theme, handleSetPreference]);

  const value = useMemo(
    () => ({
      theme,
      preference,
      setPreference: handleSetPreference,
      toggleTheme,
    }),
    [theme, preference, handleSetPreference, toggleTheme],
  );

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useThemeContext must be used within ThemeProvider");
  }
  return value;
}
