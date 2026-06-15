import { Pressable, StyleSheet, Text } from "react-native";
import { theme } from "../../theme";

export function IconBackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onPress} style={styles.button}>
      <Text style={styles.icon}>{"<"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceRaised,
    borderColor: "rgba(31,31,31,0.06)",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  icon: {
    color: theme.colors.textPrimary,
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 20,
  },
});
