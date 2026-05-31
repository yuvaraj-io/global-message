import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes
} from "@react-native-google-signin/google-signin";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text } from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { useUI } from "@/src/context/UIContext";
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "@/src/utils/googleAuth";
import { getErrorMessage } from "@/src/services/api";
import { colors } from "@/src/utils/theme";

/**
 * Native Google sign-in button. Uses the Android/iOS native account picker
 * (no browser redirect). Only works in a development build / standalone APK —
 * NOT Expo Go.
 */
export const GoogleSignInButton = () => {
  const { googleLogin } = useAuth();
  const { showSnackbar } = useUI();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      // webClientId is what stamps the returned idToken's audience.
      webClientId: GOOGLE_WEB_CLIENT_ID,
      iosClientId: GOOGLE_IOS_CLIENT_ID,
      scopes: ["openid", "profile", "email"]
    });
  }, []);

  const signIn = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Clear the cached Google session so the account chooser always appears,
      // letting the user pick a different account each time. This only clears
      // the Google SDK cache, NOT the Global Space app session.
      await GoogleSignin.signOut();
      const result = await GoogleSignin.signIn();
      const idToken = result.data?.idToken;
      if (!idToken) throw new Error("No ID token returned from Google");
      await googleLogin(idToken);
    } catch (error) {
      if (isErrorWithCode(error)) {
        // User cancelled or dismissed — not a real error, stay quiet.
        if (
          error.code === statusCodes.SIGN_IN_CANCELLED ||
          error.code === statusCodes.IN_PROGRESS
        ) {
          return;
        }
      }
      showSnackbar(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable style={[styles.googleButton, loading && styles.disabled]} onPress={signIn} disabled={loading}>
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
