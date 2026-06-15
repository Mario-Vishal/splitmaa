import { useState } from "react";
import {
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { formatMoney, type AppAction } from "@splitmaa/core";
import {
  useSplitmaaStore,
  type AssistantMessage,
  type GuidedSummaryNode,
} from "../../stores/useSplitmaaStore";
import { theme } from "../../theme";

export function FloatingAssistant({ onOpenGroups }: { onOpenGroups: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState("");
  const messages = useSplitmaaStore((store) => store.assistantMessages);
  const pendingAction = useSplitmaaStore((store) => store.pendingAction);
  const guidedExecution = useSplitmaaStore((store) => store.guidedExecution);
  const parseCommand = useSplitmaaStore((store) => store.parseCommand);
  const runGuidedCommand = useSplitmaaStore((store) => store.runGuidedCommand);
  const confirmPendingAction = useSplitmaaStore((store) => store.confirmPendingAction);
  const cancelPendingAction = useSplitmaaStore((store) => store.cancelPendingAction);
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 8,
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 42) setExpanded(false);
    },
  });

  async function submit(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setDraft("");
    const handled = await runGuidedCommand(clean, { onOpenGroups });
    if (!handled) {
      await parseCommand(clean);
    }
    setExpanded(true);
  }

  if (guidedExecution.status === "running") {
    return <ProgressToast progress={guidedExecution.progress} commentary={guidedExecution.commentary} />;
  }

  if (!expanded) {
    return (
      <Pressable style={styles.dock} onPress={() => setExpanded(true)}>
        <View style={styles.spark} />
        <Text style={styles.dockText}>Ask</Text>
      </Pressable>
    );
  }

  const latestMessage = messages[messages.length - 1];

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
          <Text style={styles.title}>Splitmaa</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close assistant"
            style={styles.closeIcon}
            onPress={() => setExpanded(false)}
          >
            <Text style={styles.closeIconText}>X</Text>
          </Pressable>
        </View>

        {pendingAction ? (
          <ActionCard
            action={pendingAction}
            onConfirm={() => void confirmPendingAction()}
            onCancel={cancelPendingAction}
          />
        ) : guidedExecution.status === "complete" ? (
          <SummaryGraph title={guidedExecution.summaryTitle ?? "Done"} nodes={guidedExecution.summaryNodes} />
        ) : latestMessage ? (
          <MessageLine message={latestMessage} />
        ) : null}

        <View style={styles.inputShell}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Create a group called California add Sai and Deepak"
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

function ProgressToast({ progress, commentary }: { progress: number; commentary: string }) {
  return (
    <View style={styles.toast}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { height: `${Math.max(8, progress * 100)}%` }]} />
      </View>
      <View style={styles.toastBody}>
        <Text style={styles.toastTitle}>Working</Text>
        <Text style={styles.toastText}>{commentary}</Text>
      </View>
    </View>
  );
}

function ActionCard({
  action,
  onConfirm,
  onCancel,
}: {
  action: AppAction;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.actionCard}>
      <Text style={styles.cardKicker}>Review</Text>
      <Text style={styles.cardTitle}>{actionTitle(action)}</Text>
      <Text style={styles.cardText}>{describeAction(action)}</Text>
      <View style={styles.confirmActions}>
        <Pressable style={styles.confirmButton} onPress={onConfirm}>
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

function SummaryGraph({ title, nodes }: { title: string; nodes: GuidedSummaryNode[] }) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.cardKicker}>Completed</Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <View style={styles.graphRow}>
        {nodes.map((node, index) => (
          <View key={node.id} style={styles.graphItem}>
            <View style={[styles.graphNode, node.tone === "success" && styles.graphNodeSuccess]}>
              <Text style={styles.graphNodeText}>{node.label.slice(0, 1).toUpperCase()}</Text>
            </View>
            {index < nodes.length - 1 ? <View style={styles.graphLink} /> : null}
          </View>
        ))}
      </View>
      <View style={styles.summaryList}>
        {nodes.map((node) => (
          <Text key={`${node.id}_label`} style={styles.summaryLine}>
            {node.detail}: {node.label}
          </Text>
        ))}
      </View>
    </View>
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
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 20,
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
    fontSize: 14,
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
  actionCard: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderRadius: 18,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  cardKicker: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  cardText: {
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
  messageLine: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 14,
    gap: 2,
    padding: theme.spacing.sm,
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
  toast: {
    alignItems: "center",
    backgroundColor: theme.colors.textPrimary,
    borderRadius: 18,
    bottom: 78,
    flexDirection: "row",
    gap: theme.spacing.md,
    left: theme.spacing.md,
    padding: theme.spacing.md,
    position: "absolute",
    right: theme.spacing.md,
    ...theme.shadows.card,
  },
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    height: 44,
    overflow: "hidden",
    width: 5,
  },
  progressFill: {
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    bottom: 0,
    position: "absolute",
    width: 5,
  },
  toastBody: {
    flex: 1,
  },
  toastTitle: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  toastText: {
    color: theme.colors.surface,
    fontSize: 15,
    fontWeight: "800",
  },
  summaryCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 18,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  summaryHeader: {
    gap: 2,
  },
  graphRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  graphItem: {
    alignItems: "center",
    flexDirection: "row",
  },
  graphNode: {
    alignItems: "center",
    backgroundColor: theme.colors.accentSoft,
    borderRadius: 16,
    height: 34,
    justifyContent: "center",
    width: 34,
  },
  graphNodeSuccess: {
    backgroundColor: theme.colors.successSoft,
  },
  graphNodeText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: "900",
  },
  graphLink: {
    backgroundColor: theme.colors.border,
    height: 2,
    width: 18,
  },
  summaryList: {
    gap: 2,
  },
  summaryLine: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
});
