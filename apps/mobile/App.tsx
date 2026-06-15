import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  BackHandler,
  Platform,
  SafeAreaView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AccountPanel } from "./src/components/account/AccountPanel";
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
  const [accountOpen, setAccountOpen] = useState(false);
  const hydrate = useSplitmaaStore((store) => store.hydrate);
  const guidedExecution = useSplitmaaStore((store) => store.guidedExecution);
  const selectedGroupId = useSplitmaaStore((store) => store.selectedGroupId);
  const selectedContactId = useSplitmaaStore((store) => store.selectedContactId);
  const selectGroup = useSplitmaaStore((store) => store.selectGroup);
  const selectContact = useSplitmaaStore((store) => store.selectContact);
  const isExecuting = guidedExecution.status === "running";

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (accountOpen) {
        setAccountOpen(false);
        return true;
      }

      if (activeTab === "groups" && selectedGroupId) {
        selectGroup(undefined);
        return true;
      }

      if (activeTab === "contacts" && selectedContactId) {
        selectContact(undefined);
        return true;
      }

      if (activeTab !== "home") {
        setActiveTab("home");
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [accountOpen, activeTab, selectContact, selectGroup, selectedContactId, selectedGroupId]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>{renderScreen(activeTab, setActiveTab, () => setAccountOpen(true))}</View>
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
        {isExecuting ? <ExecutionBlocker /> : null}
        <FloatingAssistant onOpenGroups={() => setActiveTab("groups")} />
        <AccountPanel
          visible={accountOpen}
          onClose={() => setAccountOpen(false)}
          onOpenDiagnostics={() => setActiveTab("diagnostics")}
        />
      </SafeAreaView>
      <ExpoStatusBar style="dark" />
    </View>
  );
}

function ExecutionBlocker() {
  return (
    <View style={styles.blocker} pointerEvents="auto">
      <Text style={styles.blockerText}>Working...</Text>
    </View>
  );
}

function renderScreen(activeTab: AppTab, setActiveTab: (tab: AppTab) => void, onOpenAccount: () => void) {
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
          onOpenAccount={onOpenAccount}
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
    paddingTop: Platform.OS === "android" ? NativeStatusBar.currentHeight ?? 0 : 0,
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
