import { StyleSheet, Text, View } from "react-native";
import { formatMoney } from "@splitmaa/core";
import { ScreenCard } from "../components/ui/ScreenCard";
import { ScreenShell } from "../components/ui/ScreenShell";
import { useSplitmaaStore } from "../stores/useSplitmaaStore";
import { theme } from "../theme";

export function GroupsScreen() {
  const state = useSplitmaaStore((store) => store.state);

  return (
    <ScreenShell
      title="Groups"
      subtitle="Groups and expense feeds are backed by the same persisted local state the assistant updates."
    >
      {state.groups.map((group) => {
        const expenses = state.expenses.filter((expense) => expense.groupId === group.id);
        const total = expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
        return (
          <ScreenCard key={group.id} title={group.name} subtitle={`${group.memberIds.length} members`}>
            <Text style={styles.total}>{formatMoney(total, group.defaultCurrency)}</Text>
            <View style={styles.list}>
              {expenses.slice(0, 4).map((expense) => (
                <Text key={expense.id} style={styles.row}>
                  {expense.description} | {formatMoney(expense.amountCents, expense.currency)}
                </Text>
              ))}
            </View>
          </ScreenCard>
        );
      })}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  total: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: "900",
  },
  list: {
    gap: theme.spacing.xs,
  },
  row: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
});
