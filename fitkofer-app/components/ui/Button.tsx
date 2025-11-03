import React from "react";
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleProp,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { Text } from "@/components/Themed";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

type ButtonBaseProps = {
  title: string;
  onPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  loading?: boolean;
};

export function PrimaryButton({
  title,
  onPress,
  style,
  textStyle,
  disabled,
  loading,
}: ButtonBaseProps) {
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        {
          backgroundColor: theme.tint,
          paddingVertical: 16,
          borderRadius: 16,
          alignItems: "center",
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.background} />
      ) : (
        <Text
          style={[
            {
              fontFamily: "Inter_600SemiBold",
              color: theme.background,
              fontSize: 16,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export function SecondaryButton({
  title,
  onPress,
  style,
  textStyle,
  disabled,
}: ButtonBaseProps) {
  const scheme = useColorScheme() ?? "light";
  const theme = Colors[scheme];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        {
          borderWidth: 1,
          borderColor: theme.tint,
          paddingVertical: 16,
          borderRadius: 16,
          alignItems: "center",
          backgroundColor: theme.background,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          { fontFamily: "Inter_600SemiBold", color: theme.tint, fontSize: 16 },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
