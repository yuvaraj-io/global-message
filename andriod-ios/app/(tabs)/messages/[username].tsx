import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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
  const { unreadMessages, clearMessageUnread, setActiveMessageUser } = useNotifications();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [typing, setTyping] = useState("");

  useEffect(() => {
    if (!username) {
      setActive(null);
      setMessages([]);
      apiRequest<{ conversations: Conversation[] }>("/messages/conversations").then((res) => {
        setConversations(res.conversations);
      });
    }
  }, [username]);

  useEffect(() => {
    if (!username) return;
    apiRequest<{ user: User; messages: Message[] }>(`/messages/${username}`).then((res) => {
      setActive(res.user);
      setMessages(res.messages);
      clearMessageUnread(res.user.id);
      setConversations((current) => current.map((c) => (c.user.id === res.user.id ? { ...c, unread: 0 } : c)));
    });
  }, [username]);

  useFocusEffect(
    useCallback(() => {
      if (username) {
        apiRequest<{ user: User; messages: Message[] }>(`/messages/${username}`).then((res) => {
          setActive(res.user);
          setMessages(res.messages);
          clearMessageUnread(res.user.id);
          setConversations((current) => current.map((c) => (c.user.id === res.user.id ? { ...c, unread: 0 } : c)));
        });
      } else {
        apiRequest<{ conversations: Conversation[] }>("/messages/conversations").then((res) => {
          setConversations(res.conversations);
        });
      }
    }, [username, clearMessageUnread])
  );


  useEffect(() => {
    setActiveMessageUser(active?.id || null);
    return () => setActiveMessageUser(null);
  }, [active?.id, setActiveMessageUser]);

  useEffect(() => {
    if (!socket || !active || !user) return;
    const hasUnseenFromOther = messages.some((m) => m.senderId === active.id && !m.seen);
    if (hasUnseenFromOther) {
      socket.emit("message:seen", { senderId: active.id });
    }
  }, [socket, active, user, messages]);

  useEffect(() => {
    if (!socket || !user) return;
    const onMessage = (message: Message) => {
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));

      const otherUser = message.senderId === user.id ? message.receiver : message.sender;
      if (otherUser) {
        setConversations((current) => {
          const unreadIncrement = message.senderId !== user.id && active?.id !== message.senderId ? 1 : 0;
          const existing = current.find((item) => item.user.id === otherUser.id);
          const nextConversation: Conversation = {
            user: otherUser,
            latest: message,
            unread: existing ? existing.unread + unreadIncrement : unreadIncrement
          };
          return [nextConversation, ...current.filter((item) => item.user.id !== otherUser.id)];
        });
      }

      if (active?.id === message.senderId) clearMessageUnread(message.senderId);
    };
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
  }, [active?.id, clearMessageUnread, socket, user]);

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
            <Pressable style={styles.conversation} onPress={() => router.push(`/messages/${item.user.username}` as never)}>
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
        <KeyboardAvoidingView style={styles.chat} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.chatHeader}>
            <Pressable
              onPress={() => {
                setActive(null);
                setMessages([]);
                router.replace("/messages" as never);
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
            keyboardShouldPersistTaps="handled"
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
            <Pressable style={styles.sendButton} onPress={send}><Ionicons name="send" color="#fff" size={18} /></Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  conversationList: { padding: 16, gap: 12 },
  conversation: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, ...shadow },
  username: { color: colors.text, fontWeight: "900" },
  preview: { color: colors.dim, marginTop: 2 },
  badge: { minWidth: 22, textAlign: "center", overflow: "hidden", borderRadius: 11, paddingHorizontal: 7, paddingVertical: 2, color: "#fff", backgroundColor: colors.unread },
  greenDot: { position: "absolute", right: -2, top: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.unread, borderWidth: 2, borderColor: colors.panel },
  empty: { color: colors.dim, textAlign: "center", marginTop: 36 },
  chat: { flex: 1, backgroundColor: colors.chatBg },
  chatHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.panel },
  messageList: { padding: 16, gap: 6 },
  messageWrap: { flexDirection: "row", justifyContent: "flex-start" },
  mineWrap: { justifyContent: "flex-end" },
  bubble: { maxWidth: "80%", padding: 10, paddingHorizontal: 12, borderRadius: 16, borderBottomLeftRadius: 4, backgroundColor: colors.bubbleIn, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  mineBubble: { backgroundColor: colors.bubbleOut, borderBottomLeftRadius: 16, borderBottomRightRadius: 4 },
  messageText: { color: colors.text, fontSize: 15, lineHeight: 20 },
  mineText: { color: colors.text },
  messageTime: { color: colors.muted, fontSize: 11, marginTop: 4, textAlign: "right" },
  mineTime: { color: colors.muted },
  typing: { color: colors.muted, paddingHorizontal: 16, paddingBottom: 8, fontStyle: "italic" },
  inputRow: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.panel },
  input: { flex: 1, minHeight: 44, borderRadius: 22, paddingHorizontal: 16, color: colors.text, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan }
});
