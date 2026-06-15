import Svg, { Circle, Path } from "react-native-svg";
import { theme } from "../../theme";

type AppLogoProps = {
  size?: number;
  variant?: "accent" | "mono";
};

export function AppLogo({ size = 48, variant = "accent" }: AppLogoProps) {
  const accent = variant === "accent" ? theme.colors.accent : theme.colors.textPrimary;
  const soft = variant === "accent" ? theme.colors.accentSoft : theme.colors.surfaceMuted;

  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" accessibilityLabel="Splitmaa logo">
      <Circle cx="24" cy="24" r="22" fill={soft} />
      <Path
        d="M14 14h20c-1 8-5 13-10 13S15 22 14 14Z"
        fill={accent}
        opacity={0.95}
      />
      <Path
        d="M14 34c1-8 5-13 10-13s9 5 10 13H14Z"
        fill={theme.colors.surface}
      />
      <Path
        d="M17 34c1-5 3-8 7-8s6 3 7 8"
        fill="none"
        stroke={accent}
        strokeLinecap="round"
        strokeWidth={3}
      />
    </Svg>
  );
}
