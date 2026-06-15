import { Pressable, StyleSheet, Text } from "react-native";
import { ScreenCard } from "../components/ui/ScreenCard";
import { ScreenShell } from "../components/ui/ScreenShell";
import { useSplitmaaStore } from "../stores/useSplitmaaStore";
import { theme } from "../theme";

export function DiagnosticsScreen() {
  const diagnostics = useSplitmaaStore((store) => store.diagnostics);
  const state = useSplitmaaStore((store) => store.state);
  const executionPlan = useSplitmaaStore((store) => store.executionPlan);
  const executionCommentary = useSplitmaaStore((store) => store.executionCommentary);
  const refreshModelStatus = useSplitmaaStore((store) => store.refreshModelStatus);

  return (
    <ScreenShell
      title="Diagnostics"
      subtitle="Parser, context, and logs"
    >
      <ScreenCard title="Runtime">
        <Text style={styles.row}>Parser: {diagnostics.parserName}</Text>
        <Text style={styles.row}>Model status: {diagnostics.modelStatus}</Text>
        <Text style={styles.row}>Context: {diagnostics.contextSizeChars} chars</Text>
        <Text style={styles.row}>Latency: {diagnostics.latencyMs} ms</Text>
        <Text style={styles.row}>Offline ready: {diagnostics.offlineReady ? "yes" : "no"}</Text>
        <Text style={styles.row}>Updated: {diagnostics.updatedAt}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Check model"
          onPress={() => void refreshModelStatus()}
          style={({ pressed }) => [styles.refreshButton, pressed && styles.refreshButtonPressed]}
        >
          <Text style={styles.refreshButtonText}>Check model</Text>
        </Pressable>
      </ScreenCard>

      <ScreenCard title="Execution plan">
        {executionPlan.length ? (
          executionPlan.map((step) => (
            <Text key={step.id} style={styles.row}>
              {step.status}: {step.label}
            </Text>
          ))
        ) : (
          <Text style={styles.row}>No pending execution.</Text>
        )}
      </ScreenCard>

      <ScreenCard title="Commentary">
        {executionCommentary.length ? (
          executionCommentary.map((line) => (
            <Text key={line} style={styles.row}>
              {line}
            </Text>
          ))
        ) : (
          <Text style={styles.row}>Confirmed actions will appear here.</Text>
        )}
      </ScreenCard>

      <ScreenCard title="Audit logs">
        {state.aiActionLogs.length ? (
          state.aiActionLogs.slice(0, 6).map((log) => (
            <Text key={log.id} style={styles.row}>
              {log.parsedActionType} | {log.executionStatus}
            </Text>
          ))
        ) : (
          <Text style={styles.row}>No assistant actions confirmed yet.</Text>
        )}
      </ScreenCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  row: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  refreshButton: {
    alignItems: "center",
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 14,
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  refreshButtonPressed: {
    opacity: 0.82,
  },
  refreshButtonText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: "900",
  },
});
