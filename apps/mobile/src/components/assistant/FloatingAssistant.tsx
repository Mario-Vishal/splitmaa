import { useState } from "react";
import {
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { formatMoney, type AppAction } from "@splitmaa/core";
import {
  exampleCommands,
  useSplitmaaStore,
  type AssistantMessage,
} from "../../stores/useSplitmaaStore";
import { theme } from "../../theme";

export function FloatingAssistant() {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const messages = useSplitmaaStore((store) => store.assistantMessages);
  const pendingAction = useSplitmaaStore((store) => store.pendingAction);
  const parseCommand = useSplitmaaStore((store) => store.parseCommand);
  const confirmPendingAction = useSplitmaaStore((store) => store.confirmPendingAction);
  const cancelPendingAction = useSplitmaaStore((store) => store.cancelPendingAction);
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 8,
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 42) {
        setExpanded(false);
      }
    },
  });

  async function submit(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setDraft("");
    await parseCommand(clean);
  }

  if (!expanded) {
    return (
      <Pressable style={styles.dock} onPress={() => setExpanded(true)}>
        <View style={styles.spark} />
        <Text style={styles.dockText}>Ask</Text>
      </Pressable>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.sheetWrap}
    >
      <View style={styles.sheet}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close assistant"
          onPress={() => setExpanded(false)}
          style={styles.grabberHit}
          {...panResponder.panHandlers}
        >
          <View style={styles.grabber} />
        </Pressable>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Splitmaa</Text>
            <Text style={styles.subtitle}>Local command layer</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close assistant"
            style={styles.closeIcon}
            onPress={() => setExpanded(false)}
          >
            <Text style={styles.closeIconText}>×</Text>
          </Pressable>
        </View>

        <View style={styles.inputShell}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add dinner, ask a balance..."
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={() => void submit(draft)}
          />
          <Pressable style={styles.sendButton} onPress={() => void submit(draft)}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {exampleCommands.slice(0, 4).map((command) => (
            <Pressable key={command} style={styles.chip} onPress={() => void submit(command)}>
              <Text style={styles.chipText}>{command}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {pendingAction ? (
          <View style={styles.confirmation}>
            <Text style={styles.confirmEyebrow}>Review before saving</Text>
            <Text style={styles.confirmTitle}>{actionTitle(pendingAction)}</Text>
            <Text style={styles.confirmText}>{describeAction(pendingAction)}</Text>
            <View style={styles.confirmActions}>
              <Pressable style={styles.confirmButton} onPress={() => void confirmPendingAction()}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </Pressable>
              <Pressable style={styles.cancelButton} onPress={cancelPendingAction}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
            {messages.slice(-4).map((message) => (
              <MessageLine key={message.id} message={message} />
            ))}
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageLine({ message }: { message: AssistantMessage }) {
  return (
    <View style={styles.messageLine}>
      <Text style={styles.messageRole}>{message.role === "user" ? "You" : "Splitmaa"}</Text>
      <Text style={styles.messageText}>{message.text}</Text>
    </View>
  );
}

function actionTitle(action: AppAction): string {
  return action.type.toLowerCase().replaceAll("_", " ");
}

function describeAction(action: AppAction): string {
  switch (action.type) {
    case "ADD_EXPENSE":
      return `${action.description} | ${formatMoney(action.amountCents, action.currency)} | paid by ${action.paidByName} | split with ${action.participantNames.join(", ")}`;
    case "CREATE_GROUP":
      return `${action.groupName} with ${action.memberNames.join(", ")}`;
    case "CREATE_CONTACT":
      return action.displayName;
    case "SETTLE_UP":
      return `${action.fromName} pays ${action.toName} ${formatMoney(action.amountCents, action.currency)}`;
    case "QUERY_BALANCE":
      return "Answer from local balances.";
    case "CLARIFICATION_REQUIRED":
      return action.question;
    case "UNSUPPORTED_REQUEST":
      return action.reason;
  }
}

const styles = StyleSheet.create({
  dock: {
    alignItems: "center",
    backgroundColor: theme.colors.textPrimary,
    borderRadius: theme.radii.pill,
    bottom: 78,
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    position: "absolute",
    right: theme.spacing.lg,
    ...theme.shadows.card,
  },
  spark: {
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  dockText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: "900",
  },
  sheetWrap: {
    bottom: 64,
    left: 0,
    position: "absolute",
    right: 0,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    gap: theme.spacing.sm,
    maxHeight: 420,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  grabber: {
    alignSelf: "center",
    backgroundColor: theme.colors.border,
    borderRadius: theme.radii.pill,
    height: 4,
    width: 44,
  },
  grabberHit: {
    alignSelf: "stretch",
    paddingBottom: theme.spacing.xs,
    paddingTop: 2,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  closeIcon: {
    alignItems: "center",
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  closeIconText: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 24,
  },
  inputShell: {
    alignItems: "center",
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    padding: 6,
  },
  input: {
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 15,
    minHeight: 42,
    paddingHorizontal: theme.spacing.md,
  },
  sendButton: {
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 14,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  sendText: {
    color: theme.colors.surface,
    fontWeight: "900",
  },
  chips: {
    gap: theme.spacing.sm,
  },
  chip: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radii.pill,
    maxWidth: 230,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  chipText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  messages: {
    maxHeight: 96,
  },
  messagesContent: {
    gap: theme.spacing.sm,
  },
  messageLine: {
    gap: 2,
  },
  messageRole: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  messageText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  confirmation: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  confirmEyebrow: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  confirmTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  confirmText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  confirmButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: 14,
    flex: 1,
    padding: theme.spacing.md,
  },
  confirmButtonText: {
    color: theme.colors.surface,
    fontWeight: "900",
  },
  cancelButton: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    padding: theme.spacing.md,
  },
  cancelButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: "900",
  },
});
