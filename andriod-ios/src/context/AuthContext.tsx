import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, TOKEN_KEY } from "../services/api";
import { User } from "../types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  updateUser: (user: User) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
      updateUser: setUser,
      logout: async () => {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        router.replace("/login");
      }
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
