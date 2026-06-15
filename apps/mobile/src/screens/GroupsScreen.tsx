import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatMoney } from "@splitmaa/core";
import { GroupCard } from "../components/ui/EntityCards";
import { ScreenCard } from "../components/ui/ScreenCard";
import { ScreenShell } from "../components/ui/ScreenShell";
import { useSplitmaaStore } from "../stores/useSplitmaaStore";
import { theme } from "../theme";

export function GroupsScreen() {
  const state = useSplitmaaStore((store) => store.state);
  const selectedGroupId = useSplitmaaStore((store) => store.selectedGroupId);
  const selectGroup = useSplitmaaStore((store) => store.selectGroup);
  const selectedGroup = state.groups.find((group) => group.id === selectedGroupId);

  if (selectedGroup) {
    const expenses = state.expenses.filter((expense) => expense.groupId === selectedGroup.id);
    const total = expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
    const members = selectedGroup.memberIds
      .map((id) => state.contacts.find((contact) => contact.id === id)?.displayName)
      .filter(Boolean);

    return (
      <ScreenShell title={selectedGroup.name} subtitle="Members and expenses">
        <Pressable style={styles.backButton} onPress={() => selectGroup(undefined)}>
          <Text style={styles.backText}>Back to groups</Text>
        </Pressable>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Group total</Text>
          <Text style={styles.heroAmount}>{formatMoney(total, selectedGroup.defaultCurrency)}</Text>
          <Text style={styles.heroMeta}>{members.join(", ")}</Text>
        </View>

        <ScreenCard title="Members">
          <View style={styles.chipWrap}>
            {members.map((member) => (
              <Text key={member} style={styles.memberChip}>
                {member}
              </Text>
            ))}
          </View>
        </ScreenCard>

        <ScreenCard title="Expense feed">
          {expenses.map((expense) => (
            <View key={expense.id} style={styles.expenseRow}>
              <View>
                <Text style={styles.expenseTitle}>{expense.description}</Text>
                <Text style={styles.expenseMeta}>{expense.category} | {expense.paymentType}</Text>
              </View>
              <Text style={styles.expenseAmount}>{formatMoney(expense.amountCents, expense.currency)}</Text>
            </View>
          ))}
        </ScreenCard>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title="Groups"
      subtitle="Expense spaces"
    >
      <View style={styles.segment}>
        <Text style={styles.segmentActive}>All groups</Text>
        <Text style={styles.segmentText}>Recent</Text>
        <Text style={styles.segmentText}>Balances</Text>
      </View>
      <View style={styles.stack}>
        {state.groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            expenses={state.expenses.filter((expense) => expense.groupId === group.id)}
            onPress={() => selectGroup(group.id)}
          />
        ))}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  backText: {
    color: theme.colors.textPrimary,
    fontWeight: "900",
  },
  hero: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 22,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
  },
  heroLabel: {
    color: "rgba(255,255,255,0.7)",
    fontWeight: "800",
  },
  heroAmount: {
    color: theme.colors.surface,
    fontSize: 34,
    fontWeight: "900",
  },
  heroMeta: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 14,
    lineHeight: 20,
  },
  segment: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  segmentActive: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: theme.radii.pill,
    color: theme.colors.surface,
    flex: 1,
    fontSize: 13,
    fontWeight: "900",
    overflow: "hidden",
    paddingVertical: theme.spacing.sm,
    textAlign: "center",
  },
  segmentText: {
    color: theme.colors.textSecondary,
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    paddingVertical: theme.spacing.sm,
    textAlign: "center",
  },
  stack: {
    gap: 8,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  memberChip: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radii.pill,
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  expenseRow: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radii.md,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  expenseTitle: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },
  expenseMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  expenseAmount: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },
});
