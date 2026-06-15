import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "../../theme";

export type AppTab = "home" | "groups" | "contacts" | "diagnostics";

const tabs: Array<{ id: AppTab; label: string }> = [
  { id: "home", label: "Home" },
  { id: "groups", label: "Groups" },
  { id: "contacts", label: "People" },
  { id: "diagnostics", label: "Diagnostics" },
];

export function BottomNav({
  activeTab,
  onChange,
}: {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nav}>
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(tab.id)}
              style={[styles.item, active && styles.itemActive]}
            >
              <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.background,
    paddingBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  nav: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: 5,
  },
  item: {
    alignItems: "center",
    borderRadius: theme.radii.pill,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: theme.spacing.lg,
  },
  itemActive: {
    backgroundColor: theme.colors.textPrimary,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "800",
  },
  labelActive: {
    color: theme.colors.surface,
  },
});
