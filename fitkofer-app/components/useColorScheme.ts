import { useThemeContext } from "@/state/ThemeContext";

export function useColorScheme() {
  const { theme } = useThemeContext();
  return theme;
}

export function useThemePreference() {
  const { preference, setPreference, toggleTheme } = useThemeContext();
  return { preference, setPreference, toggleTheme };
}
