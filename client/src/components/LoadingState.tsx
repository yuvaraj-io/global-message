import { FiLoader } from "react-icons/fi";

export const LoadingState = ({ label = "Loading" }: { label?: string }) => (
  <div className="flex items-center justify-center gap-3 py-12 text-sm text-wa-subtext">
    <FiLoader className="animate-spin" />
    {label}
  </div>
);
