import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatMoney, type Contact, type Expense, type Group } from "@splitmaa/core";
import { theme } from "../../theme";

export function GroupCard({
  group,
  expenses,
  onPress,
  highlighted,
}: {
  group: Group;
  expenses: Expense[];
  onPress: () => void;
  highlighted?: boolean;
}) {
  const total = expenses.reduce((sum, expense) => sum + expense.amountCents, 0);
  const latest = expenses[0];

  return (
    <Pressable style={[styles.card, highlighted && styles.highlightedCard]} onPress={onPress}>
      <View style={styles.iconBlock}>
        <Text style={styles.iconText}>{group.name.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>{group.name}</Text>
          <Text style={styles.amount}>{formatMoney(total, group.defaultCurrency)}</Text>
        </View>
        <Text style={styles.meta}>
          {group.memberIds.length} members{latest ? ` | latest: ${latest.description}` : ""}
        </Text>
      </View>
    </Pressable>
  );
}

export function ContactCard({
  contact,
  amountCents,
  onPress,
  highlighted,
}: {
  contact: Contact;
  amountCents: number;
  onPress: () => void;
  highlighted?: boolean;
}) {
  const status =
    amountCents > 0 ? "owes you" : amountCents < 0 ? "you owe" : "settled up";

  return (
    <Pressable style={[styles.card, highlighted && styles.highlightedCard]} onPress={onPress}>
      <View style={[styles.iconBlock, styles.contactIcon]}>
        <Text style={styles.iconText}>{contact.displayName.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.rowBetween}>
          <Text style={styles.title}>{contact.displayName}</Text>
          <Text style={amountCents < 0 ? styles.oweAmount : styles.amount}>
            {formatMoney(Math.abs(amountCents), "USD")}
          </Text>
        </View>
        <Text style={styles.meta}>{status}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(31,31,31,0.05)",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: theme.spacing.sm,
    minHeight: 64,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  highlightedCard: {
    borderColor: theme.colors.accent,
    borderWidth: 2,
  },
  iconBlock: {
    alignItems: "center",
    backgroundColor: theme.colors.accentSoft,
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  contactIcon: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  iconText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  body: {
    flex: 1,
    gap: 3,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "space-between",
  },
  title: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
  },
  amount: {
    color: theme.colors.success,
    backgroundColor: theme.colors.successSoft,
    borderRadius: theme.radii.pill,
    fontSize: 13,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  oweAmount: {
    color: theme.colors.danger,
    backgroundColor: theme.colors.dangerSoft,
    borderRadius: theme.radii.pill,
    fontSize: 13,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
});
