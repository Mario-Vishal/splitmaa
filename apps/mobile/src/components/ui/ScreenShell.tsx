import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "../../theme";

export function ScreenShell({
  title,
  subtitle,
  leading,
  children,
}: PropsWithChildren<{ title: string; subtitle: string; leading?: ReactNode }>) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {leading ? <View style={styles.topBar}>{leading}</View> : null}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  header: {
    gap: 3,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 44,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: "900",
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 19,
  },
  bottomSpacer: {
    height: 86,
  },
});
