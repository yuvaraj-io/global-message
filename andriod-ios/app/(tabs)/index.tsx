import { useEffect, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { Header } from "@/src/components/Header";
import { LoadingState } from "@/src/components/LoadingState";
import { PostCard } from "@/src/components/PostCard";
import { PostComposer } from "@/src/components/PostComposer";
import { Screen } from "@/src/components/Screen";
import { useSocket } from "@/src/context/SocketContext";
import { apiRequest } from "@/src/services/api";
import { Post } from "@/src/types";
import { colors } from "@/src/utils/theme";

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { socket } = useSocket();

  const load = async (nextCursor?: string | null) => {
    const res = await apiRequest<{ items: Post[]; nextCursor: string | null }>(`/posts${nextCursor ? `?cursor=${encodeURIComponent(nextCursor)}` : ""}`);
    setPosts((current) => (nextCursor ? [...current, ...res.items] : res.items));
    setCursor(res.nextCursor);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const addPost = (post: Post) => setPosts((current) => (current.some((item) => item.id === post.id) ? current : [post, ...current]));
    socket.on("feed:newPost", addPost);
    return () => {
      socket.off("feed:newPost", addPost);
    };
  }, [socket]);

  return (
    <Screen>
      <Header title="Global Feed" subtitle="Live discussions from every profile." />
      {loading ? (
        <LoadingState label="Loading feed" />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={<PostComposer />}
          renderItem={({ item }) => <PostCard post={item} onDelete={(postId) => setPosts((current) => current.filter((post) => post.id !== postId))} />}
          onEndReached={() => cursor && load(cursor)}
          onEndReachedThreshold={0.7}
          refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.cyan} onRefresh={() => { setRefreshing(true); load(); }} />}
        />
      )}
    </Screen>
  );
}
