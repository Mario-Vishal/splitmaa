import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatMoney } from "@splitmaa/core";
import { ContactCard } from "../components/ui/EntityCards";
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
      <ScreenShell title={selectedContact.displayName} subtitle="Balance and shared expenses">
        <Pressable style={styles.backButton} onPress={() => selectContact(undefined)}>
          <Text style={styles.backText}>Back to contacts</Text>
        </Pressable>
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
      <View style={styles.segment}>
        <Text style={styles.segmentActive}>All people</Text>
        <Text style={styles.segmentText}>Owe you</Text>
        <Text style={styles.segmentText}>You owe</Text>
      </View>
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
