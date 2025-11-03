import React from "react";
import { View, ViewProps } from "react-native";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function Card({ style, ...props }: ViewProps) {
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];

  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: theme.card,
          borderRadius: 20,
          padding: 20,
          borderWidth: 1,
          borderColor: theme.border,
        },
        style,
      ]}
    />
  );
}
