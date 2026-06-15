import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { theme } from './src/theme';

export default function App() {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Edge LLM expense assistant</Text>
          <Text style={styles.title}>Splitmaa</Text>
          <Text style={styles.subtitle}>
            Split + Gemma. A mobile showcase for local function calling, validation-first execution, and confirmation-led product actions.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>System rule</Text>
          <Text style={styles.cardText}>
            The model proposes structured actions. The app validates, confirms, executes, and logs them.
          </Text>
        </View>

        <View style={styles.commandPill}>
          <Text style={styles.commandText}>Assistant foundation coming next</Text>
        </View>
      </SafeAreaView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  header: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xl,
  },
  kicker: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 44,
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
});
