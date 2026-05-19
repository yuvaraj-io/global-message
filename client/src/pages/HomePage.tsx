import { useEffect, useRef, useState } from "react";
import { FiRefreshCcw } from "react-icons/fi";
import { PostComposer } from "../components/PostComposer";
import { PostCard } from "../components/PostCard";
import { LoadingState } from "../components/LoadingState";
import { useSocket } from "../context/SocketContext";
import { api } from "../services/api";
import { Post } from "../types";

export const HomePage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { socket } = useSocket();

  const load = async (nextCursor?: string | null) => {
    nextCursor ? setLoadingMore(true) : setLoading(true);
    const res = await api.get("/posts", { params: { cursor: nextCursor || undefined } });
    setPosts((current) => (nextCursor ? [...current, ...res.data.items] : res.data.items));
    setCursor(res.data.nextCursor);
    setLoading(false);
    setLoadingMore(false);
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

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !cursor) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingMore) load(cursor);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, loadingMore]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="sticky top-0 z-10 -mx-4 border-b border-wa-border bg-white/90 px-4 py-4 backdrop-blur lg:top-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-wa-text">Global Feed</h1>
            <p className="text-sm text-wa-subtext">Live discussions from every profile.</p>
          </div>
          <button className="button-ghost aspect-square px-3" onClick={() => load()} aria-label="Refresh feed">
            <FiRefreshCcw />
          </button>
        </div>
      </header>

      <PostComposer />
      {loading ? (
        <LoadingState label="Loading feed" />
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} onDelete={(postId) => setPosts((current) => current.filter((item) => item.id !== postId))} />)
      )}
      <div ref={sentinelRef}>{loadingMore && <LoadingState label="Loading more" />}</div>
    </div>
  );
};
