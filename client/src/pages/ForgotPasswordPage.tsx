import { FormEvent, useState } from "react";
import { FiArrowLeft, FiMail } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-wa-chatBg px-4 py-10 text-wa-text">
      <div className="w-full max-w-md">
        <Link to="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-wa-subtext hover:text-wa-text">
          <FiArrowLeft /> Back to login
        </Link>

        <h1 className="mb-2 text-3xl font-black">Reset password</h1>
        <p className="mb-6 text-sm text-wa-subtext">We'll send a reset link to your email address.</p>

        {sent ? (
          <div className="panel rounded-xl p-6 text-center">
            <FiMail className="mx-auto mb-4 text-4xl text-wa-green" />
            <p className="text-wa-text">If that email is registered, you'll receive a reset link shortly. Check your inbox (and spam folder).</p>
            <Link to="/login" className="mt-4 inline-block font-semibold text-wa-greenDark">Back to login</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="panel rounded-xl p-6">
            <div className="space-y-4">
              <input
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email"
                required
              />
            </div>
            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            )}
            <button className="button-primary mt-6 w-full" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
};
