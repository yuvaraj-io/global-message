import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useUI } from "../context/UIContext";
import { apiRequest, getErrorMessage } from "../services/api";
import { Post, Reply } from "../types";
import { timeAgo } from "../utils/time";
import { colors, shadow } from "../utils/theme";
import { Avatar } from "./Avatar";

type Props = {
  post: Post;
  onDelete?: (postId: string) => void;
};

export const PostCard = ({ post, onDelete }: Props) => {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [reply, setReply] = useState("");
  const [count, setCount] = useState(post.repliesCount);
  const { user } = useAuth();
  const { socket } = useSocket();
  const { confirm, showSnackbar } = useUI();
  const isOwner = user?.id === post.user.id;

  useEffect(() => setCount(post.repliesCount), [post.repliesCount]);

  useEffect(() => {
    if (!open) return;
    apiRequest<{ replies: Reply[] }>(`/posts/${post.id}/replies`).then((res) => setReplies(res.replies)).catch(() => undefined);
  }, [open, post.id]);

  useEffect(() => {
    if (!socket) return;
    const onNewReply = ({ postId, reply: nextReply }: { postId: string; reply: Reply }) => {
      if (postId !== post.id) return;
      setReplies((current) => {
        if (current.some((item) => item.id === nextReply.id)) return current;
        const optimisticIndex = current.findIndex((item) => item.clientId && item.clientId === nextReply.clientId);
        if (optimisticIndex >= 0) return current.map((item, index) => (index === optimisticIndex ? nextReply : item));
        setCount((value) => value + 1);
        return [...current, nextReply];
      });
    };
    socket.on("reply:new", onNewReply);
    return () => {
      socket.off("reply:new", onNewReply);
    };
  }, [post.id, socket]);

  const topLevelReplies = useMemo(() => replies.filter((item) => !item.parentReplyId), [replies]);

  const submitReply = () => {
    const content = reply.trim();
    if (!content || !socket || !user) return;
    const clientId = `reply-${Date.now()}`;
    setReplies((current) => [
      ...current,
      { id: clientId, clientId, content, postId: post.id, parentReplyId: null, createdAt: new Date().toISOString(), user }
    ]);
    setCount((value) => value + 1);
    setReply("");
    socket.emit("reply:create", { postId: post.id, content, clientId });
  };

  const deletePost = async () => {
    const accepted = await confirm({ title: "Delete post?", message: "This will remove the post and all replies.", confirmLabel: "Delete post", tone: "danger" });
    if (!accepted) return;
    try {
      await apiRequest(`/posts/${post.id}`, { method: "DELETE" });
      onDelete?.(post.id);
      showSnackbar("Post deleted successfully.", "success");
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    }
  };

  const deleteReply = async (replyId: string) => {
    const accepted = await confirm({ title: "Delete comment?", message: "This comment and nested replies will be removed.", confirmLabel: "Delete comment", tone: "danger" });
    if (!accepted) return;
    try {
      const res = await apiRequest<{ deletedIds: string[] }>(`/posts/${post.id}/replies/${replyId}`, { method: "DELETE" });
      setReplies((current) => current.filter((item) => !res.deletedIds.includes(item.id)));
      setCount((value) => Math.max(0, value - res.deletedIds.length));
      showSnackbar("Comment deleted successfully.", "success");
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Pressable onPress={() => router.push(`/profile/${post.user.username}` as never)}>
          <Avatar user={post.user} />
        </Pressable>
        <View style={styles.body}>
          <View style={styles.metaRow}>
            <Pressable onPress={() => router.push(`/profile/${post.user.username}` as never)}>
              <Text style={styles.username}>@{post.user.username}</Text>
            </Pressable>
            <Text style={styles.time}>{timeAgo(post.createdAt)}</Text>
            {isOwner && (
              <Pressable style={styles.deleteButton} onPress={deletePost}>
                <Ionicons name="trash-outline" color={colors.rose} size={15} />
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            )}
          </View>
          <Text style={styles.content}>{post.content}</Text>
          <Pressable style={styles.replyButton} onPress={() => setOpen((value) => !value)}>
            <Ionicons name="chatbubble-outline" color={colors.muted} size={16} />
            <Text style={styles.replyText}>{count} replies</Text>
          </Pressable>
        </View>
      </View>
      {open && (
        <View style={styles.replies}>
          <View style={styles.replyInputRow}>
            <TextInput style={styles.replyInput} value={reply} onChangeText={setReply} placeholder="Reply..." placeholderTextColor={colors.dim} />
            <Pressable style={styles.sendButton} onPress={submitReply}>
              <Ionicons name="send" color="#fff" size={16} />
            </Pressable>
          </View>
          {topLevelReplies.map((item) => (
            <ReplyRow key={item.id} reply={item} canDelete={user?.id === item.user.id} onDelete={deleteReply} />
          ))}
        </View>
      )}
    </View>
  );
};

const ReplyRow = ({ reply, canDelete, onDelete }: { reply: Reply; canDelete?: boolean; onDelete: (id: string) => void }) => (
  <View style={styles.replyRow}>
    <Avatar user={reply.user} size={34} />
    <View style={styles.replyBody}>
      <View style={styles.metaRow}>
        <Text style={styles.replyUser}>@{reply.user.username}</Text>
        <Text style={styles.time}>{timeAgo(reply.createdAt)}</Text>
        {canDelete && (
          <Pressable onPress={() => onDelete(reply.id)} style={styles.deleteButton}>
            <Ionicons name="trash-outline" color={colors.rose} size={14} />
          </Pressable>
        )}
      </View>
      <Text style={styles.replyContent}>{reply.content}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, ...shadow },
  row: { flexDirection: "row", gap: 12 },
  body: { flex: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  username: { color: colors.text, fontWeight: "800" },
  time: { color: colors.dim, fontSize: 12 },
  content: { color: colors.text, marginTop: 8, lineHeight: 22, fontSize: 15 },
  deleteButton: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 4 },
  deleteText: { color: colors.rose, fontSize: 12, fontWeight: "700" },
  replyButton: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 6 },
  replyText: { color: colors.muted, fontSize: 13 },
  replies: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border, gap: 10 },
  replyInputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  replyInput: { flex: 1, minHeight: 42, borderRadius: 12, paddingHorizontal: 12, color: colors.text, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  sendButton: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.cyan },
  replyRow: { flexDirection: "row", gap: 10, padding: 10, borderRadius: 12, backgroundColor: colors.bg },
  replyBody: { flex: 1 },
  replyUser: { color: colors.text, fontWeight: "700", fontSize: 13 },
  replyContent: { color: colors.muted, marginTop: 4, lineHeight: 19 }
});
