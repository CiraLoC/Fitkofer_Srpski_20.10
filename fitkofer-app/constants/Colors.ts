// Brand palette inspired by business card and program cover
// Primary terracotta with warm neutrals
export const palette = {
  terracotta: "#B2554E", // primary brand color
  terracottaDark: "#8F3F39",
  terracottaSoft: "#C9756F",
  sand: "#E9D9CB", // cards / surfaces
  cream: "#FCF6F0", // app background
  charcoal: "#232323", // text on light
  cocoa: "#5C4F48", // secondary text for light
  outline: "#D8C8B8", // borders / dividers
  night: "#14110F", // dark background
  nightCard: "#1D1916",
  nightOutline: "#342B25",
  nightText: "#F5ECE4",
  nightMuted: "#C9B8AE",
  success: "#2F9E6E",
  warning: "#D68A22",
  error: "#C13B2A",
};

export default {
  palette,
  light: {
    text: palette.charcoal,
    mutedText: palette.cocoa,
    background: palette.cream,
    tint: palette.terracotta,
    tabIconDefault: "#9F9C93",
    tabIconSelected: palette.terracotta,
    card: palette.sand,
    border: palette.outline,
    success: palette.success,
    warning: palette.warning,
    error: palette.error,
  },
  dark: {
    text: palette.nightText,
    mutedText: palette.nightMuted,
    background: palette.night,
    tint: palette.terracottaSoft,
    tabIconDefault: "#807369",
    tabIconSelected: palette.terracottaSoft,
    card: palette.nightCard,
    border: palette.nightOutline,
    success: palette.success,
    warning: palette.warning,
    error: palette.error,
  },
};
