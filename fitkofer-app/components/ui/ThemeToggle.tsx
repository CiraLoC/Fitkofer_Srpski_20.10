import React from "react";
import { Pressable, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useThemeContext } from "@/state/ThemeContext";

type ThemeToggleProps = {
  variant?: "header" | "floating";
};

export default function ThemeToggle({ variant = "header" }: ThemeToggleProps) {
  const scheme = useColorScheme();
  const { toggleTheme } = useThemeContext();
  const theme = Colors[scheme];
  const isDark = scheme === "dark";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Promeni temu"
      onPress={toggleTheme}
      style={[
        styles.base,
        variant === "floating" ? styles.floating : styles.header,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <MaterialCommunityIcons
        name={isDark ? "white-balance-sunny" : "moon-waning-crescent"}
        size={18}
        color={isDark ? theme.tint : theme.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 8,
  },
  header: {
    marginRight: 16,
  },
  floating: {
    position: "absolute",
    top: 0,
    right: 0,
    marginTop: -8,
    transform: [{ translateY: -8 }],
  },
});
