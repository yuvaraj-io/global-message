import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, getErrorMessage } from "../services/api";
import { User } from "../types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (email: string, token: string, password: string) => Promise<string>;
  updateUser: (user: User) => void;
  logout: () => void;
  forceLogout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState(() => localStorage.getItem("global-space-token"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const loggingOut = useRef(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem("global-space-token");
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const saveSession = (nextToken: string, nextUser: User) => {
    localStorage.setItem("global-space-token", nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const clearSession = useCallback(() => {
    localStorage.removeItem("global-space-token");
    setToken(null);
    setUser(null);
  }, []);

  const forceLogout = useCallback(() => {
    if (loggingOut.current) return;
    loggingOut.current = true;
    clearSession();
    loggingOut.current = false;
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login: async (email, password) => {
        try {
          const res = await api.post("/auth/login", { email, password });
          saveSession(res.data.token, res.data.user);
        } catch (error) {
          throw new Error(getErrorMessage(error));
        }
      },
      register: async (username, email, password) => {
        try {
          const res = await api.post("/auth/register", { username, email, password });
          saveSession(res.data.token, res.data.user);
        } catch (error) {
          throw new Error(getErrorMessage(error));
        }
      },
      googleLogin: async (idToken: string) => {
        try {
          const res = await api.post("/auth/google", { idToken });
          saveSession(res.data.token, res.data.user);
        } catch (error) {
          throw new Error(getErrorMessage(error));
        }
      },
      forgotPassword: async (email: string) => {
        try {
          const res = await api.post("/auth/forgot-password", { email });
          return res.data.message;
        } catch (error) {
          throw new Error(getErrorMessage(error));
        }
      },
      resetPassword: async (email: string, resetToken: string, password: string) => {
        try {
          const res = await api.post("/auth/reset-password", { email, token: resetToken, password });
          return res.data.message;
        } catch (error) {
          throw new Error(getErrorMessage(error));
        }
      },
      updateUser: (nextUser) => setUser(nextUser),
      logout: () => {
        api.post("/auth/logout").catch(() => {});
        clearSession();
      },
      forceLogout
    }),
    [loading, token, user, clearSession, forceLogout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
