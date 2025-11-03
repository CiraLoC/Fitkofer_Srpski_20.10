import React from "react";
import { Image, ImageProps } from "react-native";

export default function Logo(props: Omit<ImageProps, "source">) {
  return (
    <Image
      accessibilityRole="image"
      source={require("@/assets/images/logo-full-color.png")}
      resizeMode="contain"
      {...props}
    />
  );
}
