import { createContext, PropsWithChildren, ReactNode, useContext, useMemo, useState } from "react";
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

const UIContext = createContext<UIContextValue | null>(null);

export const UIProvider = ({ children }: PropsWithChildren) => {
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [snackbars, setSnackbars] = useState<Snackbar[]>([]);

  const showSnackbar = (message: string, tone: SnackbarTone = "info") => {
    const id = Date.now();
    setSnackbars((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setSnackbars((current) => current.filter((item) => item.id !== id));
    }, 2800);
  };

  const confirm = (options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      setPendingConfirm({ ...options, resolve });
    });

  const closeConfirm = (result: boolean) => {
    pendingConfirm?.resolve(result);
    setPendingConfirm(null);
  };

  const value = useMemo(() => ({ confirm, showSnackbar }), []);

  return (
    <UIContext.Provider value={value}>
      {children}
      {pendingConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="panel w-full max-w-sm rounded-xl p-5">
            <div className="flex items-start gap-3">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${pendingConfirm.tone === "danger" ? "bg-red-500/15 text-red-200" : "bg-space-cyan/15 text-space-cyan"}`}>
                <FiAlertTriangle />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-white">{pendingConfirm.title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">{pendingConfirm.message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="button-ghost" onClick={() => closeConfirm(false)}>
                {pendingConfirm.cancelLabel || "Cancel"}
              </button>
              <button
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  pendingConfirm.tone === "danger" ? "bg-red-500 text-white hover:bg-red-400" : "bg-space-cyan text-space-950 hover:bg-cyan-300"
                }`}
                onClick={() => closeConfirm(true)}
              >
                {pendingConfirm.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="fixed bottom-24 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0">
        {snackbars.map((snackbar) => (
          <SnackbarItem key={snackbar.id} snackbar={snackbar} onClose={() => setSnackbars((current) => current.filter((item) => item.id !== snackbar.id))} />
        ))}
      </div>
    </UIContext.Provider>
  );
};

const SnackbarItem = ({ snackbar, onClose }: { snackbar: Snackbar; onClose: () => void }) => {
  const toneClass = {
    success: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
    error: "border-red-400/30 bg-red-500/15 text-red-100",
    info: "border-space-cyan/30 bg-space-cyan/15 text-cyan-100"
  }[snackbar.tone];

  const icon: Record<SnackbarTone, ReactNode> = {
    success: <FiCheckCircle />,
    error: <FiAlertTriangle />,
    info: <FiInfo />
  };

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl shadow-black/30 backdrop-blur ${toneClass}`}>
      <span className="text-lg">{icon[snackbar.tone]}</span>
      <span className="min-w-0 flex-1">{snackbar.message}</span>
      <button className="rounded-md p-1 transition hover:bg-white/10" onClick={onClose} aria-label="Dismiss notification">
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
