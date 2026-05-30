import { FormEvent, useState } from "react";
import { FiCheck } from "react-icons/fi";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPw) { setError("Passwords don't match."); return; }
    if (!tokenParam || !emailParam) { setError("Invalid reset link."); return; }

    setLoading(true);
    try {
      await resetPassword(emailParam, tokenParam, password);
      setDone(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-wa-chatBg px-4 py-10 text-wa-text">
      <div className="w-full max-w-md">
        {done ? (
          <div className="panel rounded-xl p-6 text-center">
            <FiCheck className="mx-auto mb-4 text-4xl text-wa-green" />
            <p className="mb-4 text-wa-text">Password reset successfully! You can now log in with your new password.</p>
            <Link to="/login" className="font-semibold text-wa-greenDark">Go to login</Link>
          </div>
        ) : (
          <>
            <h1 className="mb-2 text-3xl font-black">New password</h1>
            <p className="mb-6 text-sm text-wa-subtext">Choose a strong password (at least 6 characters).</p>
            <form onSubmit={submit} className="panel rounded-xl p-6">
              <div className="space-y-4">
                <input
                  className="input"
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="new password"
                  required
                />
                <input
                  className="input"
                  type="password"
                  minLength={6}
                  value={confirmPw}
                  onChange={(event) => setConfirmPw(event.target.value)}
                  placeholder="confirm password"
                  required
                />
              </div>
              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
              )}
              <button className="button-primary mt-6 w-full" disabled={loading}>
                {loading ? "Resetting..." : "Reset password"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
};
