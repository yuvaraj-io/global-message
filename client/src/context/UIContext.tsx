import { createContext, PropsWithChildren, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

type SnackbarTone = "success" | "error" | "info";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
};

type Snackbar = {
  id: number;
  message: string;
  tone: SnackbarTone;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

type UIContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  showSnackbar: (message: string, tone?: SnackbarTone) => void;
};

const MAX_SNACKBARS = 4;
const SNACKBAR_DURATION_MS = 3500;

const UIContext = createContext<UIContextValue | null>(null);

export const UIProvider = ({ children }: PropsWithChildren) => {
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [snackbars, setSnackbars] = useState<Snackbar[]>([]);
  const lastMessageRef = useRef<{ message: string; tone: SnackbarTone; at: number } | null>(null);

  const removeSnackbar = useCallback((id: number) => {
    setSnackbars((current) => current.filter((item) => item.id !== id));
  }, []);

  const showSnackbar = useCallback((message: string, tone: SnackbarTone = "info") => {
    // Dedupe identical message+tone fired within 800ms
    const now = Date.now();
    const last = lastMessageRef.current;
    if (last && last.message === message && last.tone === tone && now - last.at < 800) return;
    lastMessageRef.current = { message, tone, at: now };

    const id = now + Math.floor(Math.random() * 1000);
    setSnackbars((current) => {
      const next = [...current, { id, message, tone }];
      // Cap stack
      if (next.length > MAX_SNACKBARS) next.splice(0, next.length - MAX_SNACKBARS);
      return next;
    });
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setPendingConfirm({ ...options, resolve });
      }),
    []
  );

  const closeConfirm = (result: boolean) => {
    pendingConfirm?.resolve(result);
    setPendingConfirm(null);
  };

  // Esc closes confirm
  useEffect(() => {
    if (!pendingConfirm) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeConfirm(false);
      if (event.key === "Enter") closeConfirm(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pendingConfirm]);

  const value = useMemo(() => ({ confirm, showSnackbar }), [confirm, showSnackbar]);

  return (
    <UIContext.Provider value={value}>
      {children}
      {pendingConfirm && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={() => closeConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-wa-border bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
                  pendingConfirm.tone === "danger" ? "bg-red-50 text-red-500" : "bg-wa-green/10 text-wa-green"
                }`}
              >
                <FiAlertTriangle />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-wa-text">{pendingConfirm.title}</h2>
                <p className="mt-1 text-sm leading-6 text-wa-subtext">{pendingConfirm.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="button-ghost" onClick={() => closeConfirm(false)}>
                {pendingConfirm.cancelLabel || "Cancel"}
              </button>
              <button
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
                  pendingConfirm.tone === "danger" ? "bg-red-500 hover:bg-red-600" : "bg-wa-green hover:bg-wa-greenDark"
                }`}
                onClick={() => closeConfirm(true)}
                autoFocus
              >
                {pendingConfirm.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        className="pointer-events-none fixed bottom-24 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0"
        role="region"
        aria-live="polite"
      >
        {snackbars.map((snackbar) => (
          <SnackbarItem key={snackbar.id} snackbar={snackbar} onClose={() => removeSnackbar(snackbar.id)} />
        ))}
      </div>
    </UIContext.Provider>
  );
};

const SnackbarItem = ({ snackbar, onClose }: { snackbar: Snackbar; onClose: () => void }) => {
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(SNACKBAR_DURATION_MS);
  const startedAtRef = useRef(Date.now());
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        remainingRef.current -= Date.now() - startedAtRef.current;
      }
      return;
    }
    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(onClose, Math.max(500, remainingRef.current));
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [paused, onClose]);

  const toneStyle = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-700",
    info: "border-wa-border bg-white text-wa-text"
  }[snackbar.tone];

  const iconColor = {
    success: "text-emerald-500",
    error: "text-red-500",
    info: "text-wa-green"
  }[snackbar.tone];

  const icon: Record<SnackbarTone, ReactNode> = {
    success: <FiCheckCircle />,
    error: <FiAlertTriangle />,
    info: <FiInfo />
  };

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-card ${toneStyle}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      role="status"
    >
      <span className={`text-lg ${iconColor}`}>{icon[snackbar.tone]}</span>
      <span className="min-w-0 flex-1 break-words">{snackbar.message}</span>
      <button
        className="rounded-md p-1 text-wa-subtext transition hover:bg-black/5"
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        <FiX />
      </button>
    </div>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error("useUI must be used inside UIProvider");
  return context;
};
