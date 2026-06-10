import { useUI } from "../context/UIContext";
import { apiRequest, getErrorMessage } from "../services/api";

export type ReportTargetType = "post" | "reply" | "message" | "user";

type ReportTarget = {
  targetType: ReportTargetType;
  targetId: string;
  targetUsername?: string;
  label?: string;
};

const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "child_safety", label: "Child safety" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "nudity", label: "Nudity or sexual content" },
  { value: "violence", label: "Violence or threats" },
  { value: "hate", label: "Hate speech" },
  { value: "spam", label: "Spam or scam" },
  { value: "other", label: "Something else" }
];

export const useModeration = () => {
  const { chooseAction, confirm, showSnackbar } = useUI();

  const submitReport = async (target: ReportTarget, reason: string) => {
    try {
      const res = await apiRequest<{ message: string }>("/reports", {
        method: "POST",
        body: JSON.stringify({
          targetType: target.targetType,
          targetId: target.targetId,
          targetUsername: target.targetUsername,
          reason
        })
      });
      showSnackbar(res.message || "Report submitted. Thank you.", "success");
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    }
  };

  const report = (target: ReportTarget) => {
    chooseAction({
      title: `Report ${target.label || "content"}`,
      message: "Why are you reporting this?",
      actions: REPORT_REASONS.map((reason) => ({
        label: reason.label,
        tone: reason.value === "child_safety" ? "danger" : "default",
        onPress: () => submitReport(target, reason.value)
      }))
    });
  };

  const block = async (username: string, onChange?: (blocked: boolean) => void) => {
    const accepted = await confirm({
      title: `Block @${username}?`,
      message: "You won't see their posts or messages, and they can't message you. You can unblock them later.",
      confirmLabel: "Block",
      tone: "danger"
    });
    if (!accepted) return;
    try {
      const res = await apiRequest<{ message: string }>(`/users/${username}/block`, { method: "POST" });
      showSnackbar(res.message, "success");
      onChange?.(true);
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    }
  };

  const unblock = async (username: string, onChange?: (blocked: boolean) => void) => {
    try {
      const res = await apiRequest<{ message: string }>(`/users/${username}/block`, { method: "DELETE" });
      showSnackbar(res.message, "success");
      onChange?.(false);
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    }
  };

  return { report, block, unblock };
};
