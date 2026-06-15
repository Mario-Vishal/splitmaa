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
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
