import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { formatMoney } from "@splitmaa/core";
import { GroupCard } from "../components/ui/EntityCards";
import { IconBackButton } from "../components/ui/IconBackButton";
import { ScreenCard } from "../components/ui/ScreenCard";
import { ScreenShell } from "../components/ui/ScreenShell";
import { useSplitmaaStore } from "../stores/useSplitmaaStore";
import { theme } from "../theme";

export function GroupsScreen() {
  const state = useSplitmaaStore((store) => store.state);
  const selectedGroupId = useSplitmaaStore((store) => store.selectedGroupId);
  const selectGroup = useSplitmaaStore((store) => store.selectGroup);
  const selectedGroup = state.groups.find((group) => group.id === selectedGroupId);
  const reveal = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!selectedGroupId) return;
    reveal.setValue(0);
    Animated.timing(reveal, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [reveal, selectedGroupId]);

  if (selectedGroup) {
    const expenses = state.expenses.filter((expense) => expense.groupId === selectedGroup.id);
    const total = expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
    const members = selectedGroup.memberIds
      .map((id) => state.contacts.find((contact) => contact.id === id)?.displayName)
      .filter(Boolean);

    return (
      <ScreenShell title={selectedGroup.name} subtitle="Members and expenses">
        <IconBackButton onPress={() => selectGroup(undefined)} />
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: reveal,
              transform: [
                {
                  scale: reveal.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.sparkleRow}>
            <View style={styles.sparkle} />
            <View style={[styles.sparkle, styles.sparkleSmall]} />
            <View style={styles.sparkle} />
          </View>
          <Text style={styles.heroLabel}>Group total</Text>
          <Text style={styles.heroAmount}>{formatMoney(total, selectedGroup.defaultCurrency)}</Text>
          <Text style={styles.heroMeta}>{members.join(", ")}</Text>
        </Animated.View>

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
  hero: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 22,
    gap: theme.spacing.xs,
    overflow: "hidden",
    padding: theme.spacing.md,
  },
  sparkleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "flex-end",
  },
  sparkle: {
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    height: 8,
    opacity: 0.9,
    width: 8,
  },
  sparkleSmall: {
    height: 5,
    opacity: 0.72,
    width: 5,
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
