import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FloatingAssistant } from "./src/components/assistant/FloatingAssistant";
import { BottomNav, type AppTab } from "./src/components/navigation/BottomNav";
import { ContactsScreen } from "./src/screens/ContactsScreen";
import { DiagnosticsScreen } from "./src/screens/DiagnosticsScreen";
import { GroupsScreen } from "./src/screens/GroupsScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { useSplitmaaStore } from "./src/stores/useSplitmaaStore";
import { theme } from "./src/theme";

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const hydrate = useSplitmaaStore((store) => store.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>{renderScreen(activeTab)}</View>
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
        <FloatingAssistant />
      </SafeAreaView>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

function renderScreen(activeTab: AppTab) {
  switch (activeTab) {
    case "groups":
      return <GroupsScreen />;
    case "contacts":
      return <ContactsScreen />;
    case "diagnostics":
      return <DiagnosticsScreen />;
    case "home":
      return <HomeScreen />;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
