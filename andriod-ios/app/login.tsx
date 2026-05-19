import { Ionicons } from "@expo/vector-icons";
import { Link, Redirect } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen } from "@/src/components/Screen";
import { useAuth } from "@/src/context/AuthContext";
import { useUI } from "@/src/context/UIContext";
import { getErrorMessage } from "@/src/services/api";
import { colors, shadow } from "@/src/utils/theme";

export default function LoginScreen() {
  const { user, login } = useAuth();
  const { showSnackbar } = useUI();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Redirect href="/(tabs)" />;

  const submit = async () => {
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.wrap}>
        <View style={styles.brand}>
          <View style={styles.logo}><Ionicons name="planet" color={colors.bg} size={28} /></View>
          <Text style={styles.title}>Global Space</Text>
          <Text style={styles.subtitle}>Realtime conversations, everywhere.</Text>
        </View>
        <View style={styles.card}>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email" placeholderTextColor={colors.dim} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="password" placeholderTextColor={colors.dim} secureTextEntry />
          <Pressable style={[styles.button, loading && styles.disabled]} onPress={submit}>
            <Text style={styles.buttonText}>{loading ? "Logging in..." : "Login"}</Text>
          </Pressable>
        </View>
        <Text style={styles.switchText}>New around here? <Link href="/register" style={styles.link}>Register</Link></Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 20 },
  brand: { marginBottom: 28 },
  logo: { width: 54, height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan, marginBottom: 14 },
  title: { color: colors.text, fontSize: 34, fontWeight: "900" },
  subtitle: { color: colors.dim, marginTop: 4 },
  card: { gap: 12, padding: 18, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, ...shadow },
  input: { height: 50, borderRadius: 12, paddingHorizontal: 14, color: colors.text, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  button: { height: 50, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "900" },
  switchText: { color: colors.dim, textAlign: "center", marginTop: 18 },
  link: { color: colors.cyan, fontWeight: "800" }
});
