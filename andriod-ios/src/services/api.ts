import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

const getExpoHostApiUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  const host = typeof hostUri === "string" ? hostUri.split(":")[0] : "";
  return host ? `http://${host}:5001` : "";
};

export const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://discuss.yuvaraj.io";

export const TOKEN_KEY = "global-space-token";

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export const apiRequest = async <T,>(path: string, options: RequestOptions = {}): Promise<T> => {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (options.auth !== false && token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}/api${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) throw new Error(data.message || "Something went wrong");
  return data as T;
};

export const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");
