import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest, TOKEN_KEY } from "../services/api";
import { User } from "../types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string, userInfo?: any) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (email: string, token: string, password: string) => Promise<string>;
  updateUser: (user: User) => void;
  logout: () => Promise<void>;
  forceLogout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const loggingOut = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY)
      .then(async (storedToken) => {
        setToken(storedToken);
        if (storedToken) {
          const res = await apiRequest<{ user: User }>("/auth/me");
          setUser(res.user);
        }
      })
      .catch(() => AsyncStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = async (nextToken: string, nextUser: User) => {
    await AsyncStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const clearSession = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    router.replace("/login");
  }, []);

  /** Called when server pushes session:expired (another device logged in) */
  const forceLogout = useCallback(() => {
    if (loggingOut.current) return;
    loggingOut.current = true;
    clearSession().finally(() => { loggingOut.current = false; });
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login: async (email, password) => {
        const res = await apiRequest<{ token: string; user: User }>("/auth/login", {
          method: "POST",
          auth: false,
          body: JSON.stringify({ email, password })
        });
        await saveSession(res.token, res.user);
      },
      register: async (username, email, password) => {
        const res = await apiRequest<{ token: string; user: User }>("/auth/register", {
          method: "POST",
          auth: false,
          body: JSON.stringify({ username, email, password })
        });
        await saveSession(res.token, res.user);
      },
      googleLogin: async (idToken: string, userInfo?: any) => {
        const res = await apiRequest<{ token: string; user: User }>("/auth/google", {
          method: "POST",
          auth: false,
          body: JSON.stringify({ idToken, userInfo })
        });
        await saveSession(res.token, res.user);
      },
      forgotPassword: async (email: string) => {
        const res = await apiRequest<{ message: string }>("/auth/forgot-password", {
          method: "POST",
          auth: false,
          body: JSON.stringify({ email })
        });
        return res.message;
      },
      resetPassword: async (email: string, resetToken: string, password: string) => {
        const res = await apiRequest<{ message: string }>("/auth/reset-password", {
          method: "POST",
          auth: false,
          body: JSON.stringify({ email, token: resetToken, password })
        });
        return res.message;
      },
      updateUser: setUser,
      logout: async () => {
        try {
          await apiRequest("/auth/logout", { method: "POST" });
        } catch {
          // even if server call fails, clear local session
        }
        await clearSession();
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
