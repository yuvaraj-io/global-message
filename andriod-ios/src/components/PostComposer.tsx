import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { Avatar } from "./Avatar";
import { colors, shadow } from "../utils/theme";

export const PostComposer = () => {
  const [content, setContent] = useState("");
  const { user } = useAuth();
  const { socket } = useSocket();

  const submit = () => {
    const trimmed = content.trim();
    if (!trimmed || !socket) return;
    socket.emit("post:create", { content: trimmed });
    setContent("");
  };

  return (
    <View style={styles.card}>
      {user && <Avatar user={user} />}
      <View style={styles.body}>
        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          placeholder="Start a global discussion..."
          placeholderTextColor={colors.dim}
          multiline
          maxLength={420}
        />
        <View style={styles.footer}>
          <Text style={styles.count}>{content.length}/420</Text>
          <Pressable style={[styles.button, !content.trim() && styles.disabled]} onPress={submit}>
            <Ionicons name="send" color={colors.bg} size={16} />
            <Text style={styles.buttonText}>Publish</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: 12, margin: 16, padding: 14, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, ...shadow },
  body: { flex: 1 },
  input: { minHeight: 86, color: colors.text, fontSize: 15, textAlignVertical: "top" },
  footer: { marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  count: { color: colors.dim, fontSize: 12 },
  button: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.cyan },
  disabled: { opacity: 0.45 },
  buttonText: { color: colors.bg, fontWeight: "800" }
});
