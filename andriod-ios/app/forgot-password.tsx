import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "@/src/components/Screen";
import { useAuth } from "@/src/context/AuthContext";
import { useUI } from "@/src/context/UIContext";
import { getErrorMessage } from "@/src/services/api";
import { colors, shadow } from "@/src/utils/theme";

export default function ForgotPasswordScreen() {
  const { forgotPassword } = useAuth();
  const { showSnackbar } = useUI();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!email.trim()) return showSnackbar("Please enter your email.", "error");
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
        <Pressable onPress={() => {}} style={styles.back}>
          <Link href="/login"><Ionicons name="arrow-back" size={22} color={colors.text} /></Link>
        </Pressable>

        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>We'll send a reset link to your email address.</Text>

        {sent ? (
          <View style={styles.card}>
            <Ionicons name="mail-outline" size={42} color={colors.text} style={{ alignSelf: "center" }} />
            <Text style={styles.sentText}>If that email is registered, you'll receive a reset link shortly. Check your inbox (and spam folder).</Text>
            <Link href="/login" style={styles.linkCenter}>
              <Text style={styles.link}>Back to login</Text>
            </Link>
          </View>
        ) : (
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email"
              placeholderTextColor={colors.dim}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Pressable style={[styles.button, loading && styles.disabled]} onPress={submit} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? "Sending..." : "Send reset link"}</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 20 },
  back: { position: "absolute", top: 54, left: 20, zIndex: 10 },
  title: { color: colors.text, fontSize: 32, fontWeight: "900", marginBottom: 6 },
  subtitle: { color: colors.dim, marginBottom: 22 },
  card: { gap: 12, padding: 18, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, ...shadow },
  input: { height: 50, borderRadius: 12, paddingHorizontal: 14, color: colors.text, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  button: { height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "900" },
  sentText: { color: colors.text, textAlign: "center", lineHeight: 22 },
  linkCenter: { alignSelf: "center" },
  link: { color: colors.cyan, fontWeight: "800", textAlign: "center" }
});
