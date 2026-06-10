import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useUI } from "../context/UIContext";
import { useModeration } from "../hooks/useModeration";
import { apiRequest, getErrorMessage } from "../services/api";
import { Post } from "../types";
import { timeAgo } from "../utils/time";
import { colors, shadow } from "../utils/theme";
import { Avatar } from "./Avatar";

type Props = {
  post: Post;
  onDelete?: (postId: string) => void;
};

export const PostCard = ({ post, onDelete }: Props) => {
  const { user } = useAuth();
  const { confirm, showSnackbar, chooseAction } = useUI();
  const { report, block } = useModeration();
  const [deleting, setDeleting] = useState(false);
  const isOwner = user?.id === post.user.id;

  const openMenu = () => {
    chooseAction({
      title: `@${post.user.username}`,
      actions: [
        {
          label: "Report post",
          onPress: () => report({ targetType: "post", targetId: post.id, targetUsername: post.user.username, label: "post" })
        },
        {
          label: `Block @${post.user.username}`,
          tone: "danger",
          onPress: () => block(post.user.username, () => onDelete?.(post.id))
        }
      ]
    });
  };

  const deletePost = async () => {
    const accepted = await confirm({ title: "Delete post?", message: "This will remove the post and all replies.", confirmLabel: "Delete post", tone: "danger" });
    if (!accepted) return;
    setDeleting(true);
    try {
      await apiRequest(`/posts/${post.id}`, { method: "DELETE" });
      onDelete?.(post.id);
      showSnackbar("Post deleted successfully.", "success");
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
      setDeleting(false);
    }
  };

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/post/${post.id}` as never)}>
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
            {isOwner ? (
              <Pressable style={styles.deleteButton} onPress={deletePost} disabled={deleting}>
                {deleting ? <ActivityIndicator color={colors.rose} size={14} /> : <Ionicons name="trash-outline" color={colors.rose} size={15} />}
              </Pressable>
            ) : (
              <Pressable style={styles.deleteButton} onPress={openMenu} hitSlop={8}>
                <Ionicons name="ellipsis-horizontal" color={colors.dim} size={17} />
              </Pressable>
            )}
          </View>
          <Text style={styles.content} numberOfLines={4}>{post.content}</Text>
          <View style={styles.footer}>
            <View style={styles.replyBadge}>
              <Ionicons name="chatbubble" color={colors.green} size={14} />
              <Text style={styles.replyCount}>{post.repliesCount} {post.repliesCount === 1 ? "reply" : "replies"}</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, ...shadow },
  row: { flexDirection: "row", gap: 12 },
  body: { flex: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  username: { color: colors.text, fontWeight: "800" },
  time: { color: colors.dim, fontSize: 12 },
  content: { color: colors.text, marginTop: 8, lineHeight: 22, fontSize: 15 },
  deleteButton: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 4 },
  footer: { marginTop: 12 },
  replyBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, backgroundColor: "rgba(0,168,132,0.1)" },
  replyCount: { color: colors.green, fontSize: 13, fontWeight: "800" }
});
