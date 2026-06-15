import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
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
  const guidedExecution = useSplitmaaStore((store) => store.guidedExecution);
  const isExecuting = guidedExecution.status === "running";

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>{renderScreen(activeTab, setActiveTab)}</View>
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
        {isExecuting ? <ExecutionBlocker /> : null}
        <FloatingAssistant onOpenGroups={() => setActiveTab("groups")} />
      </SafeAreaView>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}

function ExecutionBlocker() {
  return (
    <View style={styles.blocker} pointerEvents="auto">
      <Text style={styles.blockerText}>Working...</Text>
    </View>
  );
}

function renderScreen(activeTab: AppTab, setActiveTab: (tab: AppTab) => void) {
  switch (activeTab) {
    case "groups":
      return <GroupsScreen />;
    case "contacts":
      return <ContactsScreen />;
    case "diagnostics":
      return <DiagnosticsScreen />;
    case "home":
      return (
        <HomeScreen
          onOpenGroups={() => setActiveTab("groups")}
          onOpenContacts={() => setActiveTab("contacts")}
        />
      );
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
  blocker: {
    alignItems: "center",
    backgroundColor: "rgba(251,247,240,0.72)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  blockerText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
});
