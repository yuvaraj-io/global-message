import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text } from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { useUI } from "@/src/context/UIContext";
import { getErrorMessage } from "@/src/services/api";
import { GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "@/src/utils/googleAuth";
import { colors } from "@/src/utils/theme";

WebBrowser.maybeCompleteAuthSession();

/**
 * Isolated Google sign-in button. Only mount this inside a development build
 * (or production APK) — NOT Expo Go, which can't perform native OAuth.
 */
export const GoogleSignInButton = () => {
  const { googleLogin } = useAuth();
  const { showSnackbar } = useUI();
  const [loading, setLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ["openid", "profile", "email"]
  });

  useEffect(() => {
    if (response?.type !== "success") return;
    const idToken = response.authentication?.idToken;
    const accessToken = response.authentication?.accessToken;
    if (idToken) {
      setLoading(true);
      googleLogin(idToken)
        .catch((error) => showSnackbar(getErrorMessage(error), "error"))
        .finally(() => setLoading(false));
    } else if (accessToken) {
      setLoading(true);
      fetch("https://www.googleapis.com/userinfo/v2/me", {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
        .then((res) => res.json())
        .then((userInfo) => googleLogin(accessToken, userInfo))
        .catch((error) => showSnackbar(getErrorMessage(error), "error"))
        .finally(() => setLoading(false));
    }
  }, [response]);

  return (
    <Pressable
      style={[styles.googleButton, (loading || !request) && styles.disabled]}
      onPress={() => promptAsync()}
      disabled={loading || !request}
    >
      <Image source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }} style={styles.googleIcon} />
      <Text style={styles.googleText}>{loading ? "Signing in..." : "Continue with Google"}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  googleButton: { flexDirection: "row", height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, gap: 10 },
  googleIcon: { width: 20, height: 20 },
  googleText: { color: colors.text, fontWeight: "800", fontSize: 14 },
  disabled: { opacity: 0.6 }
});
