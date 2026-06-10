import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Avatar } from "@/src/components/Avatar";
import { LoadingState } from "@/src/components/LoadingState";
import { Screen } from "@/src/components/Screen";
import { useAuth } from "@/src/context/AuthContext";
import { useSocket } from "@/src/context/SocketContext";
import { useUI } from "@/src/context/UIContext";
import { useModeration } from "@/src/hooks/useModeration";
import { apiRequest, getErrorMessage } from "@/src/services/api";
import { Post, Reply } from "@/src/types";
import { timeAgo } from "@/src/utils/time";
import { colors, shadow } from "@/src/utils/theme";

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { confirm, showSnackbar, chooseAction } = useUI();
  const { report, block } = useModeration();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ post: Post }>(`/posts/${id}`)
      .then((res) => setPost(res.post))
      .catch(() => showSnackbar("Failed to load post.", "error"))
      .finally(() => setLoading(false));
    apiRequest<{ replies: Reply[] }>(`/posts/${id}/replies`)
      .then((res) => setReplies(res.replies))
      .catch(() => undefined);
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    const onNewReply = ({ postId, reply: nextReply }: { postId: string; reply: Reply }) => {
      if (postId !== id) return;
      setReplies((current) => {
        if (current.some((item) => item.id === nextReply.id)) return current;
        const optimisticIndex = current.findIndex((item) => item.clientId && item.clientId === nextReply.clientId);
        if (optimisticIndex >= 0) return current.map((item, index) => (index === optimisticIndex ? nextReply : item));
        setPost((p) => p ? { ...p, repliesCount: p.repliesCount + 1 } : p);
        return [...current, nextReply];
      });
    };
    socket.on("reply:new", onNewReply);
    return () => { socket.off("reply:new", onNewReply); };
  }, [id, socket]);

  const topLevelReplies = useMemo(() => replies.filter((item) => !item.parentReplyId), [replies]);

  const submitReply = () => {
    const content = reply.trim();
    if (!content || !socket || !user) return;
    setSending(true);
    const clientId = `reply-${Date.now()}`;
    setReplies((current) => [
      ...current,
      { id: clientId, clientId, content, postId: id!, parentReplyId: null, createdAt: new Date().toISOString(), user }
    ]);
    setPost((p) => p ? { ...p, repliesCount: p.repliesCount + 1 } : p);
    setReply("");
    socket.emit("reply:create", { postId: id, content, clientId });
    setTimeout(() => setSending(false), 600);
  };

  const deleteReply = async (replyId: string) => {
    const accepted = await confirm({ title: "Delete comment?", message: "This comment and nested replies will be removed.", confirmLabel: "Delete comment", tone: "danger" });
    if (!accepted) return;
    try {
      const res = await apiRequest<{ deletedIds: string[] }>(`/posts/${id}/replies/${replyId}`, { method: "DELETE" });
      setReplies((current) => current.filter((item) => !res.deletedIds.includes(item.id)));
      setPost((p) => p ? { ...p, repliesCount: Math.max(0, p.repliesCount - res.deletedIds.length) } : p);
      showSnackbar("Comment deleted.", "success");
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    }
  };

  const deletePost = async () => {
    const accepted = await confirm({ title: "Delete post?", message: "This will remove the post and all replies.", confirmLabel: "Delete post", tone: "danger" });
    if (!accepted) return;
    try {
      await apiRequest(`/posts/${id}`, { method: "DELETE" });
      showSnackbar("Post deleted.", "success");
      router.back();
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    }
  };

  const openPostMenu = () => {
    if (!post) return;
    chooseAction({
      title: `@${post.user.username}`,
      actions: [
        { label: "Report post", onPress: () => report({ targetType: "post", targetId: post.id, targetUsername: post.user.username, label: "post" }) },
        { label: `Block @${post.user.username}`, tone: "danger", onPress: () => block(post.user.username, () => router.back()) }
      ]
    });
  };

  const openReplyMenu = (item: Reply) => {
    chooseAction({
      title: `@${item.user.username}`,
      actions: [
        { label: "Report comment", onPress: () => report({ targetType: "reply", targetId: item.id, targetUsername: item.user.username, label: "comment" }) },
        { label: `Block @${item.user.username}`, tone: "danger", onPress: () => block(item.user.username, () => setReplies((current) => current.filter((r) => r.user.id !== item.user.id))) }
      ]
    });
  };

  if (loading) return <Screen><LoadingState label="Loading post" /></Screen>;
  if (!post) return <Screen><Text style={styles.empty}>Post not found.</Text></Screen>;

  const isOwner = user?.id === post.user.id;

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" color={colors.text} size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={topLevelReplies}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.postCard}>
              <View style={styles.row}>
                <Pressable onPress={() => router.push(`/profile/${post.user.username}` as never)}>
                  <Avatar user={post.user} size={48} />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <View style={styles.metaRow}>
                    <Pressable onPress={() => router.push(`/profile/${post.user.username}` as never)}>
                      <Text style={styles.username}>@{post.user.username}</Text>
                    </Pressable>
                    <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
                  </View>
                </View>
                {isOwner ? (
                  <Pressable style={styles.deleteButton} onPress={deletePost}>
                    <Ionicons name="trash-outline" color={colors.rose} size={16} />
                  </Pressable>
                ) : (
                  <Pressable style={styles.deleteButton} onPress={openPostMenu} hitSlop={8}>
                    <Ionicons name="ellipsis-horizontal" color={colors.dim} size={18} />
                  </Pressable>
                )}
              </View>
              <Text style={styles.content}>{post.content}</Text>
              <View style={styles.stats}>
                <View style={styles.statBadge}>
                  <Ionicons name="chatbubble" color={colors.green} size={14} />
                  <Text style={styles.statText}>{post.repliesCount} {post.repliesCount === 1 ? "reply" : "replies"}</Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={<Text style={styles.empty}>No replies yet. Be the first to reply!</Text>}
          renderItem={({ item }) => (
            <View style={styles.replyCard}>
              <Pressable onPress={() => router.push(`/profile/${item.user.username}` as never)}>
                <Avatar user={item.user} size={36} />
              </Pressable>
              <View style={styles.replyBody}>
                <View style={styles.metaRow}>
                  <Text style={styles.replyUser}>@{item.user.username}</Text>
                  <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                  {user?.id === item.user.id ? (
                    <Pressable onPress={() => deleteReply(item.id)} style={styles.deleteButton}>
                      <Ionicons name="trash-outline" color={colors.rose} size={14} />
                    </Pressable>
                  ) : (
                    <Pressable onPress={() => openReplyMenu(item)} style={styles.deleteButton} hitSlop={8}>
                      <Ionicons name="ellipsis-horizontal" color={colors.dim} size={16} />
                    </Pressable>
                  )}
                </View>
                <Text style={styles.replyContent}>{item.content}</Text>
              </View>
            </View>
          )}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={reply}
            onChangeText={setReply}
            placeholder="Write a reply..."
            placeholderTextColor={colors.dim}
          />
          <Pressable style={[styles.sendButton, (!reply.trim() || sending) && styles.disabled]} onPress={submitReply} disabled={!reply.trim() || sending}>
            {sending ? <ActivityIndicator color="#fff" size={16} /> : <Ionicons name="send" color="#fff" size={16} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.panel },
  headerTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
  list: { padding: 16, paddingBottom: 8 },
  postCard: { padding: 16, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, marginBottom: 16, ...shadow },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  username: { color: colors.text, fontWeight: "800", fontSize: 15 },
  time: { color: colors.dim, fontSize: 12 },
  content: { color: colors.text, marginTop: 14, lineHeight: 24, fontSize: 16 },
  stats: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: "row" },
  statBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "rgba(0,168,132,0.1)" },
  statText: { color: colors.green, fontSize: 13, fontWeight: "800" },
  deleteButton: { marginLeft: "auto", padding: 4 },
  replyCard: { flexDirection: "row", gap: 10, padding: 12, marginBottom: 8, borderRadius: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  replyBody: { flex: 1 },
  replyUser: { color: colors.text, fontWeight: "700", fontSize: 13 },
  replyContent: { color: colors.text, marginTop: 4, lineHeight: 20 },
  empty: { color: colors.dim, textAlign: "center", padding: 28 },
  inputRow: { flexDirection: "row", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.panel },
  input: { flex: 1, minHeight: 44, borderRadius: 22, paddingHorizontal: 16, color: colors.text, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  sendButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan },
  disabled: { opacity: 0.45 }
});
