import { useEffect, type ReactNode } from "react";
import { BackHandler, Pressable, StyleSheet, Text, View } from "react-native";
import { selectDashboardSnapshot, useSplitmaaStore } from "../../stores/useSplitmaaStore";
import { theme } from "../../theme";

export function AccountPanel({
  visible,
  onClose,
  onOpenDiagnostics,
}: {
  visible: boolean;
  onClose: () => void;
  onOpenDiagnostics: () => void;
}) {
  const state = useSplitmaaStore((store) => store.state);
  const diagnostics = useSplitmaaStore((store) => store.diagnostics);
  const persistenceStatus = useSplitmaaStore((store) => store.persistenceStatus);
  const resetLocalState = useSplitmaaStore((store) => store.resetLocalState);
  const dashboard = selectDashboardSnapshot(state);

  useEffect(() => {
    if (!visible) return undefined;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });

    return () => subscription.remove();
  }, [onClose, visible]);

  if (!visible) return null;

  const currentUser = state.contacts.find((contact) => contact.id === state.currentUserContactId);

  return (
    <View style={styles.overlay}>
      <Pressable accessibilityRole="button" accessibilityLabel="Close account" style={styles.scrim} onPress={onClose} />
      <View style={styles.panel}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{currentUser?.displayName.slice(0, 1).toUpperCase() ?? "M"}</Text>
          </View>
          <View style={styles.identity}>
            <Text style={styles.name}>{currentUser?.displayName ?? "Mario"}</Text>
            <Text style={styles.meta}>Local account</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close account" hitSlop={8} onPress={onClose} style={styles.close}>
            <View style={[styles.closeStroke, styles.closeForward]} />
            <View style={[styles.closeStroke, styles.closeBack]} />
          </Pressable>
        </View>

        <View style={styles.balanceStrip}>
          <Metric label="Owed" value={dashboard.youAreOwed} tone="success" />
          <Metric label="Owe" value={dashboard.youOwe} tone="danger" />
        </View>

        <Section title="Account">
          <Row label="Profile" value="Mario" />
          <Row label="Currency" value="USD" />
          <Row label="Sync" value="Local only" />
        </Section>

        <Section title="Data">
          <Row label="Groups" value={`${dashboard.groupCount}`} />
          <Row label="Contacts" value={`${dashboard.contactCount}`} />
          <Row label="Storage" value={persistenceStatus} />
        </Section>

        <Section title="AI runtime">
          <Row label="Parser" value={diagnostics.parserName} />
          <Row label="Model" value={diagnostics.modelStatus} />
        </Section>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.primaryAction, pressed && styles.actionPressed]}
            onPress={() => {
              onClose();
              onOpenDiagnostics();
            }}
          >
            <Text style={styles.primaryActionText}>Open status</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.actionPressed]}
            onPress={() => void resetLocalState()}
          >
            <Text style={styles.secondaryActionText}>Reset local data</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "success" | "danger" }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, tone === "success" ? styles.successText : styles.dangerText]}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionRows}>{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  scrim: {
    backgroundColor: "rgba(31,31,31,0.18)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    bottom: 0,
    gap: theme.spacing.md,
    left: 0,
    paddingBottom: 28,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    position: "absolute",
    right: 0,
    ...theme.shadows.card,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  avatarText: {
    color: theme.colors.surface,
    fontSize: 20,
    fontWeight: "900",
  },
  identity: {
    flex: 1,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: 19,
    fontWeight: "900",
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  close: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  closeStroke: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 999,
    height: 2.5,
    position: "absolute",
    width: 17,
  },
  closeForward: {
    transform: [{ rotate: "45deg" }],
  },
  closeBack: {
    transform: [{ rotate: "-45deg" }],
  },
  balanceStrip: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  metric: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    flex: 1,
    gap: 2,
    padding: theme.spacing.md,
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  metricValue: {
    fontSize: 19,
    fontWeight: "900",
  },
  successText: {
    color: theme.colors.success,
  },
  dangerText: {
    color: theme.colors.danger,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },
  sectionRows: {
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    borderBottomColor: theme.colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 42,
    paddingHorizontal: theme.spacing.md,
  },
  rowLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  rowValue: {
    color: theme.colors.textPrimary,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "900",
    marginLeft: theme.spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 16,
    flex: 1,
    paddingVertical: theme.spacing.md,
  },
  primaryActionText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: "900",
  },
  secondaryAction: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 16,
    flex: 1,
    paddingVertical: theme.spacing.md,
  },
  secondaryActionText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: "900",
  },
  actionPressed: {
    opacity: 0.78,
  },
});
