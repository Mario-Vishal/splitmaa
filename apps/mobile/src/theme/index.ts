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
    md: 16,
    lg: 24,
    xl: 32,
  },
  radii: {
    sm: 6,
    md: 8,
    lg: 16,
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
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
  },
} as const;

export { animation, branding, darkColors, lightColors };
