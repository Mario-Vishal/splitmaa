import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../theme";

export function ScreenCard({
  title,
  subtitle,
  children,
}: PropsWithChildren<{ title?: string; subtitle?: string }>) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(31,31,31,0.05)",
    borderRadius: theme.radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
