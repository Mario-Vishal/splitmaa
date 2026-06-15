import { StyleSheet, Text, View } from "react-native";
import { formatMoney } from "@splitmaa/core";
import { ContactCard } from "../components/ui/EntityCards";
import { IconBackButton } from "../components/ui/IconBackButton";
import { ScreenCard } from "../components/ui/ScreenCard";
import { ScreenShell } from "../components/ui/ScreenShell";
import { selectDashboardSnapshot, useSplitmaaStore } from "../stores/useSplitmaaStore";
import { theme } from "../theme";

export function ContactsScreen() {
  const state = useSplitmaaStore((store) => store.state);
  const selectedContactId = useSplitmaaStore((store) => store.selectedContactId);
  const selectContact = useSplitmaaStore((store) => store.selectContact);
  const dashboard = selectDashboardSnapshot(state);
  const selectedContact = state.contacts.find((contact) => contact.id === selectedContactId);

  if (selectedContact) {
    const balance = dashboard.balances.find((item) => item.contactId === selectedContact.id);
    const sharedExpenses = state.expenses.filter((expense) =>
      expense.splitWithContactIds.includes(selectedContact.id),
    );

    return (
      <ScreenShell
        title={selectedContact.displayName}
        subtitle="Balance and shared expenses"
        leading={<IconBackButton onPress={() => selectContact(undefined)} />}
      >
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>
            {balance && balance.amountCents < 0 ? "You owe" : "Owes you"}
          </Text>
          <Text style={styles.heroAmount}>
            {formatMoney(Math.abs(balance?.amountCents ?? 0), balance?.currency ?? "USD")}
          </Text>
          <Text style={styles.heroMeta}>{selectedContact.email ?? "Local-only contact"}</Text>
        </View>

        <ScreenCard title="Profile">
          <Text style={styles.row}>Phone: {selectedContact.phone ?? "not set"}</Text>
          <Text style={styles.row}>
            Aliases: {selectedContact.aliases.length ? selectedContact.aliases.join(", ") : "none"}
          </Text>
        </ScreenCard>

        <ScreenCard title="Shared expenses">
          {sharedExpenses.length ? (
            sharedExpenses.map((expense) => (
              <View key={expense.id} style={styles.expenseRow}>
                <Text style={styles.expenseTitle}>{expense.description}</Text>
                <Text style={styles.expenseAmount}>{formatMoney(expense.amountCents, expense.currency)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.row}>No shared expenses yet.</Text>
          )}
        </ScreenCard>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title="Contacts"
      subtitle="People and balances"
    >
      <View style={styles.stack}>
        {state.contacts
          .filter((contact) => contact.id !== state.currentUserContactId)
          .map((contact) => {
            const balance = dashboard.balances.find((item) => item.contactId === contact.id);
            return (
              <ContactCard
                key={contact.id}
                contact={contact}
                amountCents={balance?.amountCents ?? 0}
                onPress={() => selectContact(contact.id)}
              />
            );
          })}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
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
  },
  stack: {
    gap: 8,
  },
  row: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
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
  expenseAmount: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "900",
  },
});
