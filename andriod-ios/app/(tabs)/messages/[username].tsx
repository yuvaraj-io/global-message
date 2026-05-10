import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Avatar } from "@/src/components/Avatar";
import { Header } from "@/src/components/Header";
import { Screen } from "@/src/components/Screen";
import { useAuth } from "@/src/context/AuthContext";
import { useNotifications } from "@/src/context/NotificationContext";
import { useSocket } from "@/src/context/SocketContext";
import { apiRequest } from "@/src/services/api";
import { Conversation, Message, User } from "@/src/types";
import { timeAgo } from "@/src/utils/time";
import { colors, shadow } from "@/src/utils/theme";

export default function MessagesScreen() {
  const { username } = useLocalSearchParams<{ username?: string }>();
  const { user } = useAuth();
  const { socket, online } = useSocket();
  const { unreadMessages, clearMessageUnread } = useNotifications();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [typing, setTyping] = useState("");

  useEffect(() => {
    apiRequest<{ conversations: Conversation[] }>("/messages/conversations").then((res) => {
      setConversations(res.conversations);
      if (!username) {
        setActive(null);
        setMessages([]);
      }
    });
  }, [username]);

  useEffect(() => {
    if (!username) return;
    apiRequest<{ user: User; messages: Message[] }>(`/messages/${username}`).then((res) => {
      setActive(res.user);
      setMessages(res.messages);
      clearMessageUnread(res.user.id);
    });
  }, [username]);

  useEffect(() => {
    if (!active || username) return;
    apiRequest<{ user: User; messages: Message[] }>(`/messages/${active.username}`).then((res) => {
      setMessages(res.messages);
      clearMessageUnread(res.user.id);
    });
  }, [active, username]);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (message: Message) => setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
    const onTyping = ({ username: typingUsername, typing: isTyping }: { username: string; typing: boolean }) => {
      setTyping(isTyping ? typingUsername : "");
      if (isTyping) setTimeout(() => setTyping(""), 1600);
    };
    socket.on("message:new", onMessage);
    socket.on("message:typing", onTyping);
    return () => {
      socket.off("message:new", onMessage);
      socket.off("message:typing", onTyping);
    };
  }, [socket]);

  const visibleMessages = useMemo(() => {
    if (!active || !user) return [];
    return messages.filter((item) => (item.senderId === user.id && item.receiverId === active.id) || (item.senderId === active.id && item.receiverId === user.id));
  }, [active, messages, user]);

  const send = () => {
    const trimmed = content.trim();
    if (!trimmed || !socket || !active) return;
    socket.emit("message:send", { receiverId: active.id, content: trimmed });
    setContent("");
  };

  const type = (value: string) => {
    setContent(value);
    if (socket && active) socket.emit("message:typing", { receiverId: active.id, typing: Boolean(value) });
  };

  return (
    <Screen>
      <Header title="Messages" />
      {!active && (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.user.id}
          contentContainerStyle={styles.conversationList}
          ListEmptyComponent={<Text style={styles.empty}>Search a profile and tap Message to start a conversation.</Text>}
          renderItem={({ item }) => (
            <Pressable style={styles.conversation} onPress={() => router.push(`/(tabs)/messages/${item.user.username}` as never)}>
              <View>
                <Avatar user={item.user} online={online[item.user.id]} />
                {Boolean(unreadMessages[item.user.id] || item.unread) && <View style={styles.greenDot} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.username}>@{item.user.username}</Text>
                <Text style={styles.preview} numberOfLines={1}>{item.latest.content}</Text>
              </View>
              {(unreadMessages[item.user.id] || item.unread) > 0 && <Text style={styles.badge}>{unreadMessages[item.user.id] || item.unread}</Text>}
            </Pressable>
          )}
        />
      )}
      {active && (
        <View style={styles.chat}>
          <View style={styles.chatHeader}>
            <Pressable
              onPress={() => {
                setActive(null);
                setMessages([]);
                router.replace("/(tabs)/messages" as never);
              }}
            >
              <Ionicons name="chevron-back" color={colors.text} size={24} />
            </Pressable>
            <Avatar user={active} online={online[active.id]} />
            <View>
              <Text style={styles.username}>@{active.username}</Text>
              <Text style={styles.preview}>{online[active.id] ? "Online" : "Offline"}</Text>
            </View>
          </View>
          <FlatList
            data={visibleMessages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            renderItem={({ item }) => {
              const mine = item.senderId === user?.id;
              return (
                <View style={[styles.messageWrap, mine && styles.mineWrap]}>
                  <View style={[styles.bubble, mine && styles.mineBubble]}>
                    <Text style={[styles.messageText, mine && styles.mineText]}>{item.content}</Text>
                    <Text style={[styles.messageTime, mine && styles.mineTime]}>{timeAgo(item.createdAt)}{mine && item.seen ? " · seen" : ""}</Text>
                  </View>
                </View>
              );
            }}
          />
          {typing ? <Text style={styles.typing}>@{typing} is typing...</Text> : null}
          <View style={styles.inputRow}>
            <TextInput style={styles.input} value={content} onChangeText={type} placeholder="Send a private message" placeholderTextColor={colors.dim} />
            <Pressable style={styles.sendButton} onPress={send}><Ionicons name="send" color={colors.bg} size={18} /></Pressable>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  conversationList: { padding: 16, gap: 12 },
  conversation: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, ...shadow },
  username: { color: colors.text, fontWeight: "900" },
  preview: { color: colors.dim, marginTop: 2 },
  badge: { minWidth: 22, textAlign: "center", overflow: "hidden", borderRadius: 11, paddingHorizontal: 7, paddingVertical: 2, color: colors.text, backgroundColor: colors.rose },
  greenDot: { position: "absolute", right: -2, top: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.lime, borderWidth: 2, borderColor: colors.panel },
  empty: { color: colors.dim, textAlign: "center", marginTop: 36 },
  chat: { flex: 1 },
  chatHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  messageList: { padding: 16, gap: 10 },
  messageWrap: { flexDirection: "row", justifyContent: "flex-start" },
  mineWrap: { justifyContent: "flex-end" },
  bubble: { maxWidth: "80%", padding: 12, borderRadius: 16, backgroundColor: colors.panel2 },
  mineBubble: { backgroundColor: colors.cyan },
  messageText: { color: colors.text },
  mineText: { color: colors.bg },
  messageTime: { color: colors.dim, fontSize: 11, marginTop: 4, textAlign: "right" },
  mineTime: { color: "rgba(8,11,18,0.65)" },
  typing: { color: colors.dim, paddingHorizontal: 16, paddingBottom: 8 },
  inputRow: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border },
  input: { flex: 1, minHeight: 44, borderRadius: 13, paddingHorizontal: 12, color: colors.text, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  sendButton: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan }
});
