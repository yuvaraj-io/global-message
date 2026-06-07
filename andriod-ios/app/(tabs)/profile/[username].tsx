import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Avatar } from "@/src/components/Avatar";
import { Header } from "@/src/components/Header";
import { LoadingState } from "@/src/components/LoadingState";
import { PostCard } from "@/src/components/PostCard";
import { Screen } from "@/src/components/Screen";
import { useAuth } from "@/src/context/AuthContext";
import { useUI } from "@/src/context/UIContext";
import { apiRequest, getErrorMessage } from "@/src/services/api";
import { Discussion, Post, Reply, User } from "@/src/types";
import { fullDate, timeAgo } from "@/src/utils/time";
import { colors, shadow } from "@/src/utils/theme";

type ProfilePayload = { user: User; posts: Post[]; replies: Reply[]; discussions: Discussion[] };

export default function ProfileScreen({ overrideUsername }: { overrideUsername?: string } = {}) {
  const params = useLocalSearchParams<{ username: string }>();
  const username = overrideUsername || params.username;
  const { user, updateUser, logout, deleteAccount } = useAuth();
  const { showSnackbar, confirm } = useUI();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [tab, setTab] = useState<"posts" | "replies" | "discussions" | "media">("posts");
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [newUsername, setNewUsername] = useState("");

  useEffect(() => {
    setProfile(null);
    apiRequest<ProfilePayload>(`/users/${username}`).then((res) => {
      setProfile(res);
      setBio(res.user.bio);
      setAvatar(res.user.avatar);
      setNewUsername(res.user.username);
    });
  }, [username]);

  if (!profile) return <Screen><LoadingState label="Loading profile" /></Screen>;

  const isMe = user?.id === profile.user.id;

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], base64: true, quality: 0.72, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.base64) setAvatar(`data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`);
  };

  const saveProfile = async () => {
    try {
      const body: Record<string, string> = { bio, avatar };
      if (newUsername !== profile?.user.username) body.username = newUsername;
      const res = await apiRequest<{ user: User }>("/users/me", { method: "PATCH", body: JSON.stringify(body) });
      setProfile((current) => (current ? { ...current, user: res.user } : current));
      updateUser(res.user);
      setEditing(false);
      showSnackbar("Profile updated successfully.", "success");
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    }
  };

  const handleDeleteAccount = async () => {
    const accepted = await confirm({
      title: "Delete account?",
      message: "This permanently deletes your account, posts, replies, discussions, and messages. This cannot be undone.",
      confirmLabel: "Delete account",
      tone: "danger"
    });
    if (!accepted) return;
    try {
      await deleteAccount();
      showSnackbar("Your account has been deleted.", "success");
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    }
  };

  const deleteReply = async (reply: Reply) => {
    const accepted = await confirm({ title: "Delete comment?", message: "This comment will be removed.", confirmLabel: "Delete comment", tone: "danger" });
    if (!accepted) return;
    const res = await apiRequest<{ deletedIds: string[] }>(`/posts/${reply.postId}/replies/${reply.id}`, { method: "DELETE" });
    setProfile((current) => (current ? { ...current, replies: current.replies.filter((item) => !res.deletedIds.includes(item.id)) } : current));
    showSnackbar("Comment deleted successfully.", "success");
  };

  return (
    <Screen>
      <ScrollView>
        <Header title={`@${profile.user.username}`} />
        <View style={styles.cover} />
        <View style={styles.card}>
          <View style={styles.topRow}>
            <Avatar user={profile.user} size={84} />
            <View style={styles.actions}>
              {isMe ? (
                <>
                  <Pressable style={styles.ghostButton} onPress={() => setEditing((value) => !value)}><Text style={styles.ghostText}>{editing ? "Cancel" : "Edit profile"}</Text></Pressable>
                  <Pressable style={styles.ghostButton} onPress={logout}><Text style={styles.ghostText}>Logout</Text></Pressable>
                </>
              ) : (
                <Pressable style={styles.primaryButton} onPress={() => router.push(`/messages/${profile.user.username}` as never)}><Ionicons name="chatbubble-outline" color="#fff" size={17} /><Text style={styles.primaryText}>Message</Text></Pressable>
              )}
            </View>
          </View>
          {editing ? (
            <View style={styles.editor}>
              <Image source={{ uri: avatar }} style={styles.preview} />
              <Pressable style={styles.ghostButton} onPress={pickAvatar}><Text style={styles.ghostText}>Upload photo</Text></Pressable>
              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput style={styles.usernameInput} value={newUsername} onChangeText={(t) => setNewUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ""))} maxLength={24} autoCapitalize="none" placeholderTextColor={colors.dim} placeholder="username" />
              <Text style={styles.fieldHint}>3-24 chars · lowercase, numbers, underscores · 30-day cooldown</Text>
              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput style={styles.bioInput} value={bio} onChangeText={setBio} multiline maxLength={160} placeholderTextColor={colors.dim} />
              <Pressable style={styles.primaryButton} onPress={saveProfile}><Ionicons name="save-outline" color="#fff" size={17} /><Text style={styles.primaryText}>Save profile</Text></Pressable>
              <Pressable style={styles.dangerButton} onPress={handleDeleteAccount}><Ionicons name="trash-outline" color={colors.rose} size={17} /><Text style={styles.dangerText}>Delete account</Text></Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.bio}>{profile.user.bio}</Text>
              <Text style={styles.joined}>Joined {fullDate(profile.user.createdAt)} · {profile.user.followersCount} followers · {profile.user.followingCount} following</Text>
            </>
          )}
        </View>
        <View style={styles.tabs}>
          {(["posts", "replies", "discussions", "media"] as const).map((item) => (
            <Pressable key={item} style={[styles.tab, tab === item && styles.activeTab]} onPress={() => setTab(item)}>
              <Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        {tab === "posts" && profile.posts.map((post) => <PostCard key={post.id} post={post} onDelete={(id) => setProfile((current) => current ? { ...current, posts: current.posts.filter((item) => item.id !== id) } : current)} />)}
        {tab === "replies" && profile.replies.map((reply) => (
          <View key={reply.id} style={styles.replyCard}>
            <View style={styles.replyMeta}><Text style={styles.joined}>replied {timeAgo(reply.createdAt)}</Text>{isMe && <Pressable onPress={() => deleteReply(reply)}><Text style={styles.delete}>Delete</Text></Pressable>}</View>
            <Text style={styles.replyText}>{reply.content}</Text>
          </View>
        ))}
        {tab === "discussions" && profile.discussions.map((discussion) => (
          <View key={discussion.id} style={styles.replyCard}>
            <Text style={styles.discussionTitle}>{discussion.title}</Text>
            <Text style={styles.replyText}>{discussion.content}</Text>
            <Text style={styles.joined}>{discussion.repliesCount} replies · latest {timeAgo(discussion.latestActivityAt)}</Text>
          </View>
        ))}
        {tab === "media" && <Text style={styles.empty}>Media is ready for future uploads.</Text>}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cover: { height: 92, backgroundColor: "#0A0A0A" },
  card: { margin: 16, marginTop: -38, padding: 16, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, ...shadow },
  topRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  actions: { flexDirection: "row", gap: 8, alignItems: "flex-start", flexWrap: "wrap", justifyContent: "flex-end", flex: 1 },
  primaryButton: { flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, backgroundColor: colors.cyan },
  primaryText: { color: "#fff", fontWeight: "900" },
  ghostButton: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  ghostText: { color: colors.text, fontWeight: "800" },
  bio: { color: colors.text, marginTop: 14, lineHeight: 21 },
  joined: { color: colors.dim, marginTop: 8, fontSize: 12 },
  editor: { marginTop: 14, gap: 10 },
  preview: { width: 82, height: 82, borderRadius: 41 },
  fieldLabel: { color: colors.text, fontWeight: "800", fontSize: 13, marginTop: 4 },
  fieldHint: { color: colors.dim, fontSize: 11, marginTop: -6 },
  usernameInput: { height: 46, borderRadius: 12, paddingHorizontal: 14, color: colors.text, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  bioInput: { minHeight: 88, borderRadius: 12, padding: 12, color: colors.text, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, textAlignVertical: "top" },
  tabs: { flexDirection: "row", marginHorizontal: 16, marginBottom: 12, padding: 4, borderRadius: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  tab: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 10 },
  activeTab: { backgroundColor: "rgba(0,168,132,0.12)" },
  tabText: { color: colors.dim, fontSize: 12, fontWeight: "800" },
  activeTabText: { color: colors.text },
  replyCard: { marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border },
  replyMeta: { flexDirection: "row", justifyContent: "space-between" },
  replyText: { color: colors.text, marginTop: 8, lineHeight: 21 },
  delete: { color: colors.rose, fontWeight: "800" },
  dangerButton: { flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", paddingHorizontal: 14, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: colors.rose },
  dangerText: { color: colors.rose, fontWeight: "900" },
  discussionTitle: { color: colors.text, fontWeight: "900", fontSize: 16 },
  empty: { color: colors.dim, textAlign: "center", margin: 28 }
});
