import { useState } from "react";
import {
  KeyboardAvoidingView,
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
  const executionPlan = useSplitmaaStore((store) => store.executionPlan);
  const parseCommand = useSplitmaaStore((store) => store.parseCommand);
  const confirmPendingAction = useSplitmaaStore((store) => store.confirmPendingAction);
  const cancelPendingAction = useSplitmaaStore((store) => store.cancelPendingAction);

  if (!expanded) {
    return (
      <Pressable style={styles.collapsed} onPress={() => setExpanded(true)}>
        <Text style={styles.collapsedText}>Ask Splitmaa</Text>
      </Pressable>
    );
  }

  async function submit(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setDraft("");
    await parseCommand(clean);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.overlay}
    >
      <View style={styles.panel}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Splitmaa Assistant</Text>
            <Text style={styles.subtitle}>Local parser | confirm before mutation</Text>
          </View>
          <Pressable style={styles.closeButton} onPress={() => setExpanded(false)}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
          {messages.slice(-8).map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {pendingAction ? (
            <View style={styles.confirmation}>
              <Text style={styles.confirmTitle}>Confirm action</Text>
              <Text style={styles.confirmText}>{describeAction(pendingAction)}</Text>
              <View style={styles.steps}>
                {executionPlan.map((step) => (
                  <Text key={step.id} style={styles.step}>
                    {step.label}
                  </Text>
                ))}
              </View>
              <View style={styles.confirmActions}>
                <Pressable style={styles.confirmButton} onPress={() => void confirmPendingAction()}>
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </Pressable>
                <Pressable style={styles.cancelButton} onPress={cancelPendingAction}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {exampleCommands.map((command) => (
            <Pressable key={command} style={styles.chip} onPress={() => void submit(command)}>
              <Text style={styles.chipText}>{command}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add 8 dollars for milk..."
            placeholderTextColor={theme.colors.textSecondary}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={() => void submit(draft)}
          />
          <Pressable style={styles.sendButton} onPress={() => void submit(draft)}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
      <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
        {message.text}
      </Text>
    </View>
  );
}

function describeAction(action: AppAction): string {
  switch (action.type) {
    case "ADD_EXPENSE":
      return `Add ${action.description} for ${formatMoney(action.amountCents, action.currency)} paid by ${action.paidByName}, split equally with ${action.participantNames.join(", ")}.`;
    case "CREATE_GROUP":
      return `Create ${action.groupName} with ${action.memberNames.join(", ")}.`;
    case "CREATE_CONTACT":
      return `Create contact ${action.displayName}.`;
    case "SETTLE_UP":
      return `Record ${action.fromName} paying ${action.toName} ${formatMoney(action.amountCents, action.currency)}.`;
    case "QUERY_BALANCE":
      return "Answer a balance question from local data.";
    case "CLARIFICATION_REQUIRED":
      return action.question;
    case "UNSUPPORTED_REQUEST":
      return action.reason;
  }
}

const styles = StyleSheet.create({
  collapsed: {
    alignItems: "center",
    backgroundColor: theme.colors.textPrimary,
    borderRadius: theme.radii.pill,
    bottom: 74,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    position: "absolute",
    right: theme.spacing.lg,
    ...theme.shadows.card,
  },
  collapsedText: {
    color: theme.colors.surface,
    fontSize: 14,
    fontWeight: "900",
  },
  overlay: {
    bottom: 68,
    left: theme.spacing.sm,
    position: "absolute",
    right: theme.spacing.sm,
  },
  panel: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    maxHeight: 620,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  closeButton: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  closeText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  messages: {
    maxHeight: 265,
  },
  messagesContent: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  bubble: {
    borderRadius: theme.radii.md,
    maxWidth: "88%",
    padding: theme.spacing.md,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: theme.colors.accent,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: theme.colors.surfaceMuted,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: theme.colors.surface,
    fontWeight: "700",
  },
  assistantText: {
    color: theme.colors.textPrimary,
  },
  confirmation: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  confirmTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "900",
  },
  confirmText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  steps: {
    gap: theme.spacing.xs,
  },
  step: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  confirmActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  confirmButton: {
    alignItems: "center",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radii.md,
    flex: 1,
    padding: theme.spacing.md,
  },
  confirmButtonText: {
    color: theme.colors.surface,
    fontWeight: "900",
  },
  cancelButton: {
    alignItems: "center",
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    flex: 1,
    padding: theme.spacing.md,
  },
  cancelButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: "900",
  },
  chips: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  chip: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radii.pill,
    maxWidth: 260,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  chipText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: "800",
  },
  inputRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    color: theme.colors.textPrimary,
    flex: 1,
    fontSize: 14,
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: theme.colors.textPrimary,
    borderRadius: theme.radii.md,
    justifyContent: "center",
    minWidth: 64,
    paddingHorizontal: theme.spacing.md,
  },
  sendText: {
    color: theme.colors.surface,
    fontWeight: "900",
  },
});
