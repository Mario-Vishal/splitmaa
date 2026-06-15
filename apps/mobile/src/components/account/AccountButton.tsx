import { Pressable, StyleSheet, View } from "react-native";
import { theme } from "../../theme";

export function AccountButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open account"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <View style={styles.head} />
      <View style={styles.shoulders} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
    ...theme.shadows.card,
  },
  buttonPressed: {
    opacity: 0.82,
  },
  head: {
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    height: 11,
    marginBottom: 3,
    width: 11,
  },
  shoulders: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    height: 9,
    width: 22,
  },
});
