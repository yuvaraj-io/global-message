import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { Link, Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "@/src/components/Screen";
import { useAuth } from "@/src/context/AuthContext";
import { useUI } from "@/src/context/UIContext";
import { getErrorMessage } from "@/src/services/api";
import { colors, shadow } from "@/src/utils/theme";

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const { user, register, googleLogin } = useAuth();
  const { showSnackbar } = useUI();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ["openid", "profile", "email"]
  });

  useEffect(() => {
    if (response?.type === "success") {
      const idToken = response.authentication?.idToken;
      const accessToken = response.authentication?.accessToken;
      if (idToken) {
        setGoogleLoading(true);
        googleLogin(idToken)
          .catch((error) => showSnackbar(getErrorMessage(error), "error"))
          .finally(() => setGoogleLoading(false));
      } else if (accessToken) {
        setGoogleLoading(true);
        fetch("https://www.googleapis.com/userinfo/v2/me", {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
          .then((res) => res.json())
          .then((userInfo) => googleLogin(accessToken, userInfo))
          .catch((error) => showSnackbar(getErrorMessage(error), "error"))
          .finally(() => setGoogleLoading(false));
      }
    }
  }, [response]);

  if (user) return <Redirect href="/(tabs)" />;

  const submit = async () => {
    setLoading(true);
    try {
      await register(username, email, password);
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
        <Text style={styles.title}>Create your account</Text>
        <View style={styles.card}>
          <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="username" placeholderTextColor={colors.dim} autoCapitalize="none" />
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email" placeholderTextColor={colors.dim} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="password" placeholderTextColor={colors.dim} secureTextEntry />
          <Pressable style={[styles.button, loading && styles.disabled]} onPress={submit} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Creating..." : "Register"}</Text>
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={[styles.googleButton, (googleLoading || !request) && styles.disabled]}
            onPress={() => promptAsync()}
            disabled={googleLoading || !request}
          >
            <Image source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }} style={styles.googleIcon} />
            <Text style={styles.googleText}>{googleLoading ? "Signing in..." : "Continue with Google"}</Text>
          </Pressable>
        </View>
        <Text style={styles.switchText}>Already have an account? <Link href="/login" style={styles.link}>Login</Link></Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 20 },
  title: { color: colors.text, fontSize: 32, fontWeight: "900", marginBottom: 22 },
  card: { gap: 12, padding: 18, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, ...shadow },
  input: { height: 50, borderRadius: 12, paddingHorizontal: 14, color: colors.text, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  button: { height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "900" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.dim, marginHorizontal: 12, fontSize: 13 },
  googleButton: { flexDirection: "row", height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, gap: 10 },
  googleIcon: { width: 20, height: 20 },
  googleText: { color: colors.text, fontWeight: "800", fontSize: 14 },
  switchText: { color: colors.dim, textAlign: "center", marginTop: 18 },
  link: { color: colors.cyan, fontWeight: "800" }
});
