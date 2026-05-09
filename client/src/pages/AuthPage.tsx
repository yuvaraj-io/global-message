import { FormEvent, useState } from "react";
import { FiArrowRight, FiGlobe } from "react-icons/fi";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const AuthPage = ({ mode }: { mode: "login" | "register" }) => {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <main className="grid min-h-screen place-items-center px-4 py-10 text-slate-100">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-space-cyan text-2xl text-space-950">
            <FiGlobe />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Global Space</h1>
            <p className="text-sm text-slate-500">Realtime conversations, everywhere.</p>
          </div>
        </div>

        <form onSubmit={submit} className="panel rounded-xl p-6">
          <h2 className="text-xl font-bold text-white">{mode === "register" ? "Create your account" : "Welcome back"}</h2>
          <div className="mt-6 space-y-4">
            {mode === "register" && <input className="input" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="username" required />}
            <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email" required />
            <input className="input" type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="password" required />
          </div>
          {error && <div className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
          <button className="button-primary mt-6 w-full" disabled={loading}>
            {mode === "register" ? "Register" : "Login"}
            <FiArrowRight />
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          {mode === "register" ? "Already have an account?" : "New around here?"}{" "}
          <Link className="font-semibold text-space-cyan" to={mode === "register" ? "/login" : "/register"}>
            {mode === "register" ? "Login" : "Register"}
          </Link>
        </p>
      </div>
    </main>
  );
};
