import { StyleSheet, Text } from "react-native";
import { formatMoney } from "@splitmaa/core";
import { ScreenCard } from "../components/ui/ScreenCard";
import { ScreenShell } from "../components/ui/ScreenShell";
import { selectDashboardSnapshot, useSplitmaaStore } from "../stores/useSplitmaaStore";
import { theme } from "../theme";

export function ContactsScreen() {
  const state = useSplitmaaStore((store) => store.state);
  const balances = selectDashboardSnapshot(state).balances;

  return (
    <ScreenShell
      title="Contacts"
      subtitle="Contacts include aliases and optional email/phone fields for later reminders and sync."
    >
      {state.contacts.map((contact) => {
        const balance = balances.find((item) => item.contactId === contact.id);
        return (
          <ScreenCard key={contact.id} title={contact.displayName} subtitle={contact.email ?? "Local contact"}>
            <Text style={styles.text}>
              {balance
                ? `${balance.amountCents > 0 ? "Owes you" : "You owe"} ${formatMoney(Math.abs(balance.amountCents), balance.currency)}`
                : "No open balance"}
            </Text>
            {contact.aliases.length ? (
              <Text style={styles.meta}>Aliases: {contact.aliases.join(", ")}</Text>
            ) : null}
          </ScreenCard>
        );
      })}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  text: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
});
