import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppWordmark } from "../branding/AppWordmark";
import { theme } from "../../theme";

export function ScreenShell({
  title,
  subtitle,
  children,
}: PropsWithChildren<{ title: string; subtitle: string }>) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <AppWordmark />
      <View style={styles.header}>
        <Text style={styles.kicker}>Splitmaa local demo</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {children}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.sm,
  },
  kicker: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 34,
    fontWeight: "900",
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    lineHeight: 23,
  },
  bottomSpacer: {
    height: 96,
  },
});
