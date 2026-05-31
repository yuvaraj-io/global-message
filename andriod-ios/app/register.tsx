import { Link, Redirect } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { GoogleSignInButton } from "@/src/components/GoogleSignInButton";
import { Screen } from "@/src/components/Screen";
import { useAuth } from "@/src/context/AuthContext";
import { useUI } from "@/src/context/UIContext";
import { getErrorMessage } from "@/src/services/api";
import { GOOGLE_ENABLED } from "@/src/utils/googleAuth";
import { colors, shadow } from "@/src/utils/theme";

export default function RegisterScreen() {
  const { user, register } = useAuth();
  const { showSnackbar } = useUI();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

          {GOOGLE_ENABLED && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>
              <GoogleSignInButton />
            </>
          )}
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
  switchText: { color: colors.dim, textAlign: "center", marginTop: 18 },
  link: { color: colors.cyan, fontWeight: "800" }
});
