import { FormEvent, useCallback, useEffect, useState } from "react";
import { FiArrowRight, FiGlobe } from "react-icons/fi";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export const AuthPage = ({ mode }: { mode: "login" | "register" }) => {
  const { user, login, register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      setError("");
      setLoading(true);
      try {
        await googleLogin(response.credential);
        navigate("/");
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Google sign-in failed");
      } finally {
        setLoading(false);
      }
    },
    [googleLogin, navigate]
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    // Load Google Identity Services script
    const existing = document.getElementById("google-gsi-script");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      script.onload = () => renderButton();
    } else {
      renderButton();
    }

    function renderButton() {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse
      });

      const container = document.getElementById("google-signin-button");
      if (container) {
        container.innerHTML = "";
        google.accounts.id.renderButton(container, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "continue_with",
          shape: "pill"
        });
      }
    }
  }, [mode, handleGoogleResponse]);

  if (user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") await register(username, email, password);
      else await login(email, password);
      navigate("/");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-wa-chatBg px-4 py-10 text-wa-text">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-wa-green text-2xl text-white">
            <FiGlobe />
          </div>
          <div>
            <h1 className="text-3xl font-black text-wa-text">Global Space</h1>
            <p className="text-sm text-wa-subtext">Realtime conversations, everywhere.</p>
          </div>
        </div>

        <form onSubmit={submit} className="panel rounded-xl p-6">
          <h2 className="text-xl font-bold text-wa-text">{mode === "register" ? "Create your account" : "Welcome back"}</h2>
          <div className="mt-6 space-y-4">
            {mode === "register" && (
              <input
                className="input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="username"
                required
              />
            )}
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email"
              required
            />
            <input
              className="input"
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="password"
              required
            />
          </div>
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <button className="button-primary mt-6 w-full" disabled={loading}>
            {mode === "register" ? "Register" : "Login"}
            <FiArrowRight />
          </button>
          {mode === "login" && (
            <Link to="/forgot-password" className="mt-3 block text-center text-sm text-wa-subtext hover:text-wa-text">
              Forgot password?
            </Link>
          )}
        </form>

        {GOOGLE_CLIENT_ID && (
          <>
            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-wa-border" />
              <span className="text-sm text-wa-muted">or</span>
              <div className="h-px flex-1 bg-wa-border" />
            </div>
            <div id="google-signin-button" className="flex justify-center" />
          </>
        )}

        <p className="mt-5 text-center text-sm text-wa-subtext">
          {mode === "register" ? "Already have an account?" : "New around here?"}{" "}
          <Link className="font-semibold text-wa-greenDark" to={mode === "register" ? "/login" : "/register"}>
            {mode === "register" ? "Login" : "Register"}
          </Link>
        </p>
      </div>
    </main>
  );
};
