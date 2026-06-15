import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { formatMoney } from '@splitmaa/core';
import { AppWordmark } from './src/components/branding/AppWordmark';
import { selectDashboardSnapshot, useSplitmaaStore } from './src/stores/useSplitmaaStore';
import { theme } from './src/theme';

export default function App() {
  const {
    addSampleExpense,
    hydrate,
    hydrated,
    lastMessage,
    lastPersistenceSource,
    persistenceStatus,
    resetLocalState,
    state,
  } = useSplitmaaStore();
  const dashboard = selectDashboardSnapshot(state);
  const topBalanceName = dashboard.topBalance
    ? state.contacts.find((contact) => contact.id === dashboard.topBalance?.contactId)?.displayName
    : undefined;

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <AppWordmark />

          <View style={styles.header}>
            <Text style={styles.kicker}>Edge LLM expense assistant</Text>
            <Text style={styles.title}>Local actions, confirmed first.</Text>
            <Text style={styles.subtitle}>
              Splitmaa stores validated local expense state on device. The model boundary is still mocked; deterministic app code owns persistence.
            </Text>
          </View>

          <View style={styles.grid}>
            <MetricCard label="Expenses" value={String(dashboard.expenseCount)} />
            <MetricCard label="Contacts" value={String(dashboard.contactCount)} />
            <MetricCard label="Groups" value={String(dashboard.groupCount)} />
            <MetricCard label="Total logged" value={dashboard.totalExpenses} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Local persistence</Text>
            <Text style={styles.cardText}>
              Status: {hydrated ? persistenceStatus : 'hydrating'} · Source: {lastPersistenceSource ?? 'pending'}
            </Text>
            <Text style={styles.cardText}>{lastMessage ?? 'Loading local Splitmaa state.'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Balance snapshot</Text>
            <Text style={styles.cardText}>
              {topBalanceName && dashboard.topBalance
                ? `${topBalanceName}: ${formatMoney(dashboard.topBalance.amountCents, dashboard.topBalance.currency)}`
                : 'No open balances.'}
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.primaryButton} onPress={() => void addSampleExpense()}>
              <Text style={styles.primaryButtonText}>Persist sample expense</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => void resetLocalState()}>
              <Text style={styles.secondaryButtonText}>Reset local data</Text>
            </Pressable>
          </View>

          <View style={styles.commandPill}>
            <Text style={styles.commandText}>Next: floating assistant + confirmation cards</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
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
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.sm,
  },
  kicker: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 38,
    fontWeight: '800',
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 17,
    lineHeight: 25,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    ...theme.shadows.card,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  cardText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  commandPill: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  commandText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metricCard: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    minWidth: '47%',
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  metricValue: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  metricLabel: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    gap: theme.spacing.sm,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.md,
    padding: theme.spacing.md,
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  secondaryButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
});
