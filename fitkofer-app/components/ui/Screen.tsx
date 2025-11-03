import React from "react";
import { SafeAreaView, ScrollView, ViewProps } from "react-native";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

type ScreenProps = ViewProps & {
  scroll?: boolean;
  contentPadding?: number;
};

export default function Screen({
  children,
  style,
  scroll = false,
  contentPadding = 24,
  ...rest
}: ScreenProps) {
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];

  if (scroll) {
    return (
      <ScrollView
        {...(rest as any)}
        style={[{ flex: 1, backgroundColor: theme.background }, style]}
        contentContainerStyle={{ padding: contentPadding, paddingBottom: 100 }}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView
      {...(rest as any)}
      style={[
        { flex: 1, backgroundColor: theme.background, padding: contentPadding },
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}
