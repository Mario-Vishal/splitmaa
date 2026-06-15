import { Pressable, StyleSheet, View } from "react-native";
import { theme } from "../../theme";

export function IconBackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
    >
      <View style={styles.chevron}>
        <View style={[styles.chevronStroke, styles.chevronTop]} />
        <View style={[styles.chevronStroke, styles.chevronBottom]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  buttonPressed: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  chevron: {
    height: 18,
    justifyContent: "center",
    width: 18,
  },
  chevronStroke: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 999,
    height: 3,
    left: 2,
    position: "absolute",
    width: 13,
  },
  chevronTop: {
    top: 4,
    transform: [{ rotate: "-45deg" }],
  },
  chevronBottom: {
    bottom: 4,
    transform: [{ rotate: "45deg" }],
  },
});
