import { colors } from "./colors";
import { animation } from "./animation";
import { branding } from "./branding";
import { darkColors } from "./dark";
import { lightColors } from "./light";

export const theme = {
  colors,
  colorModes: {
    light: lightColors,
    dark: darkColors,
  },
  animation,
  branding,
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 18,
    xl: 26,
  },
  radii: {
    sm: 6,
    md: 12,
    lg: 20,
    pill: 999,
  },
  typography: {
    title: 44,
    heading: 22,
    body: 16,
    caption: 13,
  },
  shadows: {
    card: {
      shadowColor: "#1F1F1F",
      shadowOpacity: 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 1,
    },
  },
} as const;

export { animation, branding, darkColors, lightColors };
