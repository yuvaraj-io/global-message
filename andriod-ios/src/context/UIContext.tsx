import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, shadow } from "../utils/theme";

type SnackbarTone = "success" | "error" | "info";
type ConfirmOptions = { title: string; message: string; confirmLabel?: string; tone?: "danger" | "default" };
type PendingConfirm = ConfirmOptions & { resolve: (value: boolean) => void };

export type ActionItem = { label: string; tone?: "default" | "danger"; onPress: () => void };
type ActionSheetOptions = { title: string; message?: string; actions: ActionItem[] };

type Snackbar = {
  message: string;
  tone: SnackbarTone;
  onPress?: () => void;
};

type UIContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  showSnackbar: (message: string, tone?: SnackbarTone, onPress?: () => void) => void;
  chooseAction: (options: ActionSheetOptions) => void;
};

const UIContext = createContext<UIContextValue | null>(null);

export const UIProvider = ({ children }: PropsWithChildren) => {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [snackbar, setSnackbar] = useState<Snackbar | null>(null);
  const [actionSheet, setActionSheet] = useState<ActionSheetOptions | null>(null);

  const chooseAction = (options: ActionSheetOptions) => setActionSheet(options);

  const showSnackbar = (message: string, tone: SnackbarTone = "info", onPress?: () => void) => {
    setSnackbar({ message, tone, onPress });
    setTimeout(() => setSnackbar(null), 2800);
  };

  const confirm = (options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });

  const resolve = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  const value = useMemo(() => ({ confirm, showSnackbar, chooseAction }), []);

  return (
    <UIContext.Provider value={value}>
      {children}
      <Modal visible={Boolean(pending)} transparent animationType="fade">
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{pending?.title}</Text>
            <Text style={styles.modalMessage}>{pending?.message}</Text>
            <View style={styles.actions}>
              <Pressable style={styles.secondaryButton} onPress={() => resolve(false)}>
                <Text style={styles.secondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.primaryButton, pending?.tone === "danger" && styles.dangerButton]} onPress={() => resolve(true)}>
                <Text style={styles.primaryText}>{pending?.confirmLabel || "Confirm"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={Boolean(actionSheet)} transparent animationType="fade" onRequestClose={() => setActionSheet(null)}>
        <Pressable style={styles.backdrop} onPress={() => setActionSheet(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{actionSheet?.title}</Text>
            {actionSheet?.message ? <Text style={styles.modalMessage}>{actionSheet.message}</Text> : null}
            <View style={styles.sheetActions}>
              {actionSheet?.actions.map((action) => (
                <Pressable
                  key={action.label}
                  style={styles.sheetButton}
                  onPress={() => {
                    setActionSheet(null);
                    action.onPress();
                  }}
                >
                  <Text style={[styles.sheetButtonText, action.tone === "danger" && styles.sheetDangerText]}>{action.label}</Text>
                </Pressable>
              ))}
              <Pressable style={[styles.sheetButton, styles.sheetCancel]} onPress={() => setActionSheet(null)}>
                <Text style={styles.sheetButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      {snackbar && (
        <Pressable
          style={[styles.snackbar, snackbar.tone === "success" && styles.success, snackbar.tone === "error" && styles.error]}
          onPress={() => {
            snackbar.onPress?.();
            setSnackbar(null);
          }}
        >
          <Text style={styles.snackbarText}>{snackbar.message}</Text>
        </Pressable>
      )}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used inside UIProvider");
  return context;
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "rgba(0,0,0,0.65)" },
  modal: { padding: 20, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, ...shadow },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: "800" },
  modalMessage: { color: colors.muted, marginTop: 8, lineHeight: 21 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 22 },
  secondaryButton: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  secondaryText: { color: colors.text, fontWeight: "700" },
  primaryButton: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10, backgroundColor: colors.cyan },
  dangerButton: { backgroundColor: colors.danger },
  primaryText: { color: colors.bg, fontWeight: "800" },
  snackbar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 90,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow
  },
  success: { borderColor: "rgba(16,185,129,0.45)" },
  error: { borderColor: "rgba(239,68,68,0.45)" },
  snackbarText: { color: colors.text, fontWeight: "700" },
  sheet: { padding: 18, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, ...shadow },
  sheetActions: { marginTop: 14, gap: 8 },
  sheetButton: { paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  sheetCancel: { borderColor: "transparent", backgroundColor: colors.bg },
  sheetButtonText: { color: colors.text, fontWeight: "800", fontSize: 15 },
  sheetDangerText: { color: colors.rose }
});
