import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../theme";
import { AppLogo } from "./AppLogo";

export function AppWordmark() {
  return (
    <View style={styles.row}>
      <AppLogo size={42} />
      <View>
        <Text style={styles.name}>Splitmaa</Text>
        <Text style={styles.caption}>Split + Gemma</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: "800",
  },
  caption: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
});
