import type { PropsWithChildren, ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "../../theme";

export function ScreenShell({
  title,
  subtitle,
  leading,
  trailing,
  children,
}: PropsWithChildren<{ title: string; subtitle: string; leading?: ReactNode; trailing?: ReactNode }>) {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {leading ? (
        <View style={styles.topBar}>
          {leading}
        </View>
      ) : null}
      <View style={[styles.header, trailing ? styles.headerWithAction : null]}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {trailing ? <View style={styles.headerAction}>{trailing}</View> : null}
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
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 3,
    justifyContent: "space-between",
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
  },
  headerWithAction: {
    alignItems: "center",
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  headerAction: {
    alignItems: "center",
    marginLeft: theme.spacing.md,
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
