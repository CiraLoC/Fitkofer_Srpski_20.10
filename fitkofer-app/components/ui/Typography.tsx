import React from "react";
import { TextStyle } from "react-native";
import { Text, TextProps } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

type VariantProps = TextProps & { style?: TextStyle | TextStyle[] };

export function H1(props: VariantProps) {
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: "PlayfairDisplay_700Bold",
          fontSize: 28,
          color: theme.text,
        },
        props.style as any,
      ]}
    />
  );
}

export function H2(props: VariantProps) {
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];
  return (
    <Text
      {...props}
      style={[
        { fontFamily: "Inter_600SemiBold", fontSize: 20, color: theme.text },
        props.style as any,
      ]}
    />
  );
}

export function Subtitle(props: VariantProps) {
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];
  return (
    <Text
      {...props}
      style={[
        { fontFamily: "Inter_600SemiBold", fontSize: 16, color: theme.tint },
        props.style as any,
      ]}
    />
  );
}

export function Body(props: VariantProps) {
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: "Inter_400Regular",
          fontSize: 16,
          lineHeight: 22,
          color: theme.mutedText ?? theme.text,
        },
        props.style as any,
      ]}
    />
  );
}

export function Label(props: VariantProps) {
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: "Inter_500Medium",
          fontSize: 14,
          color: theme.mutedText ?? theme.text,
        },
        props.style as any,
      ]}
    />
  );
}
