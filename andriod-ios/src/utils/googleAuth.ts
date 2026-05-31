import Constants, { ExecutionEnvironment } from "expo-constants";

// Native Google OAuth only works in a dev build / standalone APK, never in Expo Go.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const extra = Constants.expoConfig?.extra ?? {};

// Read from app.json `extra` (guaranteed bundled into standalone builds) and
// fall back to EXPO_PUBLIC_* env vars (works in `expo start` / Expo Go dev).
export const GOOGLE_ANDROID_CLIENT_ID =
  (extra.googleClientId as string | undefined) || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";
export const GOOGLE_WEB_CLIENT_ID =
  (extra.googleWebClientId as string | undefined) || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
export const GOOGLE_IOS_CLIENT_ID =
  (extra.googleIosClientId as string | undefined) || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";

// Show the Google button in any non-Expo-Go build that has a client id configured.
export const GOOGLE_ENABLED = !isExpoGo && Boolean(GOOGLE_ANDROID_CLIENT_ID);
