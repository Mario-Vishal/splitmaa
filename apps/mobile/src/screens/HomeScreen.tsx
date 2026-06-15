import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatMoney } from "@splitmaa/core";
import { ScreenCard } from "../components/ui/ScreenCard";
import { ScreenShell } from "../components/ui/ScreenShell";
import { selectDashboardSnapshot, useSplitmaaStore } from "../stores/useSplitmaaStore";
import { theme } from "../theme";

export function HomeScreen() {
  const state = useSplitmaaStore((store) => store.state);
  const hydrated = useSplitmaaStore((store) => store.hydrated);
  const persistenceStatus = useSplitmaaStore((store) => store.persistenceStatus);
  const lastPersistenceSource = useSplitmaaStore((store) => store.lastPersistenceSource);
  const lastMessage = useSplitmaaStore((store) => store.lastMessage);
  const resetLocalState = useSplitmaaStore((store) => store.resetLocalState);
  const dashboard = selectDashboardSnapshot(state);
  const topBalanceName = dashboard.topBalance
    ? state.contacts.find((contact) => contact.id === dashboard.topBalance?.contactId)?.displayName
    : undefined;

  return (
    <ScreenShell
      title="Local actions, confirmed first."
      subtitle="Use the floating assistant to turn commands into validated local expense actions."
    >
      <View style={styles.grid}>
        <MetricCard label="Expenses" value={String(dashboard.expenseCount)} />
        <MetricCard label="Contacts" value={String(dashboard.contactCount)} />
        <MetricCard label="Groups" value={String(dashboard.groupCount)} />
        <MetricCard label="Total logged" value={dashboard.totalExpenses} />
      </View>

      <ScreenCard title="Local persistence">
        <Text style={styles.cardText}>
          Status: {hydrated ? persistenceStatus : "hydrating"} | Source: {lastPersistenceSource ?? "pending"}
        </Text>
        <Text style={styles.cardText}>{lastMessage ?? "Loading local Splitmaa state."}</Text>
      </ScreenCard>

      <ScreenCard title="Balance snapshot">
        <Text style={styles.cardText}>
          {topBalanceName && dashboard.topBalance
            ? `${topBalanceName}: ${formatMoney(dashboard.topBalance.amountCents, dashboard.topBalance.currency)}`
            : "No open balances."}
        </Text>
      </ScreenCard>

      <Pressable style={styles.secondaryButton} onPress={() => void resetLocalState()}>
        <Text style={styles.secondaryButtonText}>Reset local demo data</Text>
      </Pressable>
    </ScreenShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  metricCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.xs,
    minWidth: "47%",
    padding: theme.spacing.md,
  },
  metricValue: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: "900",
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "800",
  },
  cardText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "800",
  },
});
