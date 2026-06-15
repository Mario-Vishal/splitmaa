import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../../theme";

export type AppTab = "home" | "groups" | "contacts" | "diagnostics";

const tabs: Array<{ id: AppTab; label: string }> = [
  { id: "home", label: "Home" },
  { id: "groups", label: "Groups" },
  { id: "contacts", label: "People" },
  { id: "diagnostics", label: "Status" },
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
      <View style={styles.nav}>
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onChange(tab.id)}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <View style={[styles.indicator, active && styles.indicatorActive]} />
              <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.background,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingTop: 6,
  },
  nav: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    flexDirection: "row",
    justifyContent: "center",
    maxWidth: 430,
    padding: 5,
    width: "100%",
    ...theme.shadows.card,
  },
  item: {
    alignItems: "center",
    borderRadius: 19,
    flex: 1,
    gap: 4,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 2,
  },
  itemPressed: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  indicator: {
    backgroundColor: "transparent",
    borderRadius: 999,
    height: 4,
    width: 18,
  },
  indicatorActive: {
    backgroundColor: theme.colors.accent,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
  },
  labelActive: {
    color: theme.colors.textPrimary,
  },
});
