export const palette = {
  terracotta: "#AF4D49",
  sand: "#EADFCF",
  olive: "#7E8B6A",
  charcoal: "#232323",
  cream: "#FDF8F2",
};

export default {
  palette,
  light: {
    text: palette.charcoal,
    background: palette.cream,
    tint: palette.terracotta,
    tabIconDefault: "#9F9C93",
    tabIconSelected: palette.terracotta,
    card: palette.sand,
    border: "#D6C9B6",
  },
  dark: {
    text: palette.cream,
    background: "#121212",
    tint: palette.sand,
    tabIconDefault: "#666",
    tabIconSelected: palette.sand,
    card: "#1E1E1E",
    border: "#2A2A2A",
  },
};
