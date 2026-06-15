import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ContactCard, GroupCard } from "../components/ui/EntityCards";
import { ScreenCard } from "../components/ui/ScreenCard";
import { ScreenShell } from "../components/ui/ScreenShell";
import { selectDashboardSnapshot, useSplitmaaStore } from "../stores/useSplitmaaStore";
import { theme } from "../theme";

export function HomeScreen({
  onOpenGroups,
  onOpenContacts,
}: {
  onOpenGroups: () => void;
  onOpenContacts: () => void;
}) {
  const state = useSplitmaaStore((store) => store.state);
  const selectGroup = useSplitmaaStore((store) => store.selectGroup);
  const selectContact = useSplitmaaStore((store) => store.selectContact);
  const dashboard = selectDashboardSnapshot(state);

  return (
    <ScreenShell
      title="Hello, Mario"
      subtitle="Balances, groups, and contacts"
    >
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>You are owed</Text>
        <Text style={styles.summaryAmount}>{dashboard.youAreOwed}</Text>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.miniLabel}>You owe</Text>
            <Text style={styles.miniAmountDanger}>{dashboard.youOwe}</Text>
          </View>
          <View>
            <Text style={styles.miniLabel}>Total logged</Text>
            <Text style={styles.miniAmount}>{dashboard.totalExpenses}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Groups</Text>
        <Pressable onPress={onOpenGroups}>
          <Text style={styles.link}>View all</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalCards}>
        {state.groups.map((group) => (
          <View key={group.id} style={styles.wideCard}>
            <GroupCard
              group={group}
              expenses={state.expenses.filter((expense) => expense.groupId === group.id)}
              onPress={() => {
                selectGroup(group.id);
                onOpenGroups();
              }}
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Contacts</Text>
        <Pressable onPress={onOpenContacts}>
          <Text style={styles.link}>View all</Text>
        </Pressable>
      </View>
      <View style={styles.stack}>
        {state.contacts
          .filter((contact) => contact.id !== state.currentUserContactId)
          .slice(0, 3)
          .map((contact) => {
            const balance = dashboard.balances.find((item) => item.contactId === contact.id);
            return (
              <ContactCard
                key={contact.id}
                contact={contact}
                amountCents={balance?.amountCents ?? 0}
                onPress={() => {
                  selectContact(contact.id);
                  onOpenContacts();
                }}
              />
            );
          })}
      </View>

      <ScreenCard title="Recent activity">
        {state.aiActionLogs.length ? (
          state.aiActionLogs.slice(0, 3).map((log) => (
            <Text key={log.id} style={styles.activity}>
              {log.parsedActionType} | {log.executionStatus}
            </Text>
          ))
        ) : (
          <Text style={styles.activity}>No confirmed assistant actions yet.</Text>
        )}
      </ScreenCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 24,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "800",
  },
  summaryAmount: {
    color: theme.colors.surface,
    fontSize: 36,
    fontWeight: "900",
  },
  summaryDivider: {
    backgroundColor: "rgba(255,255,255,0.14)",
    height: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  miniLabel: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    fontWeight: "800",
  },
  miniAmount: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: "900",
  },
  miniAmountDanger: {
    color: "#FFB8A6",
    fontSize: 18,
    fontWeight: "900",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },
  link: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: "900",
  },
  horizontalCards: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.lg,
  },
  wideCard: {
    width: 292,
  },
  stack: {
    gap: 7,
  },
  activity: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
});
