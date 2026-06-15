import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../../theme";

export type AppTab = "home" | "groups" | "contacts" | "diagnostics";

const tabs: Array<{ id: AppTab; label: string }> = [
  { id: "home", label: "Home" },
  { id: "groups", label: "Groups" },
  { id: "contacts", label: "Contacts" },
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
    <View style={styles.nav}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  item: {
    alignItems: "center",
    borderRadius: theme.radii.md,
    flex: 1,
    minHeight: 44,
    justifyContent: "center",
  },
  itemActive: {
    backgroundColor: theme.colors.accentSoft,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  labelActive: {
    color: theme.colors.textPrimary,
  },
});
