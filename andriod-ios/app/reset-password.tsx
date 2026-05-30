import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "@/src/components/Screen";
import { useAuth } from "@/src/context/AuthContext";
import { useUI } from "@/src/context/UIContext";
import { getErrorMessage } from "@/src/services/api";
import { colors, shadow } from "@/src/utils/theme";

export default function ResetPasswordScreen() {
  const { resetPassword } = useAuth();
  const { showSnackbar } = useUI();
  const params = useLocalSearchParams<{ token: string; email: string }>();
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (password.length < 6) return showSnackbar("Password must be at least 6 characters.", "error");
    if (password !== confirmPw) return showSnackbar("Passwords don't match.", "error");
    if (!params.token || !params.email) return showSnackbar("Invalid reset link.", "error");

    setLoading(true);
    try {
      await resetPassword(params.email, params.token, password);
      setDone(true);
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
        {done ? (
          <View style={styles.card}>
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.text} style={{ alignSelf: "center" }} />
            <Text style={styles.doneText}>Password reset successfully! You can now log in with your new password.</Text>
            <Link href="/login" style={styles.linkCenter}>
              <Text style={styles.link}>Go to login</Text>
            </Link>
          </View>
        ) : (
          <>
            <Text style={styles.title}>New password</Text>
            <Text style={styles.subtitle}>Choose a strong password (at least 6 characters).</Text>
            <View style={styles.card}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="new password"
                placeholderTextColor={colors.dim}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                value={confirmPw}
                onChangeText={setConfirmPw}
                placeholder="confirm password"
                placeholderTextColor={colors.dim}
                secureTextEntry
              />
              <Pressable style={[styles.button, loading && styles.disabled]} onPress={submit} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? "Resetting..." : "Reset password"}</Text>
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 20 },
  title: { color: colors.text, fontSize: 32, fontWeight: "900", marginBottom: 6 },
  subtitle: { color: colors.dim, marginBottom: 22 },
  card: { gap: 12, padding: 18, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, ...shadow },
  input: { height: 50, borderRadius: 12, paddingHorizontal: 14, color: colors.text, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  button: { height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "900" },
  doneText: { color: colors.text, textAlign: "center", lineHeight: 22 },
  linkCenter: { alignSelf: "center" },
  link: { color: colors.cyan, fontWeight: "800", textAlign: "center" }
});
