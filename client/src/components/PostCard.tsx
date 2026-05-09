import { FormEvent, useEffect, useMemo, useState } from "react";
import { FiCornerDownRight, FiMessageCircle, FiSend, FiTrash2 } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useUI } from "../context/UIContext";
import { api, getErrorMessage } from "../services/api";
import { Post, Reply } from "../types";
import { timeAgo } from "../utils/time";
import { UserAvatar } from "./UserAvatar";

type Props = {
  post: Post;
  onReply?: (postId: string) => void;
  onDelete?: (postId: string) => void;
};

export const PostCard = ({ post, onReply, onDelete }: Props) => {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [reply, setReply] = useState("");
  const [count, setCount] = useState(post.repliesCount);
  const { socket } = useSocket();
  const { user } = useAuth();
  const { confirm, showSnackbar } = useUI();
  const isOwner = user?.id === post.user.id;

  useEffect(() => setCount(post.repliesCount), [post.repliesCount]);

  useEffect(() => {
    if (!open) return;
    api.get(`/posts/${post.id}/replies`).then((res) => setReplies(res.data.replies));
  }, [open, post.id]);

  useEffect(() => {
    if (!socket) return;
    const onNewReply = ({ postId, reply: nextReply }: { postId: string; reply: Reply }) => {
      if (postId !== post.id) return;
      setReplies((current) => {
        if (current.some((item) => item.id === nextReply.id)) return current;

        const optimisticIndex = current.findIndex((item) => item.clientId && item.clientId === nextReply.clientId);
        if (optimisticIndex >= 0) {
          return current.map((item, index) => (index === optimisticIndex ? nextReply : item));
        }

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

  const submitReply = (event: FormEvent, parentReplyId?: string) => {
    event.preventDefault();
    const content = reply.trim();
    if (!content || !socket || !user) return;
    const clientId = `reply-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: Reply = {
      id: clientId,
      clientId,
      content,
      postId: post.id,
      parentReplyId: parentReplyId || null,
      createdAt: new Date().toISOString(),
      user
    };
    setReplies((current) => [...current, optimistic]);
    setCount((value) => value + 1);
    setReply("");
    socket.emit("reply:create", { postId: post.id, parentReplyId, content, clientId });
    onReply?.(post.id);
  };

  const deletePost = async () => {
    if (!isOwner) return;
    const accepted = await confirm({
      title: "Delete post?",
      message: "This will permanently delete the post and all replies under it.",
      confirmLabel: "Delete post",
      tone: "danger"
    });
    if (!accepted) return;
    try {
      await api.delete(`/posts/${post.id}`);
      onDelete?.(post.id);
      showSnackbar("Post deleted successfully.", "success");
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    }
  };

  const deleteReply = async (replyId: string) => {
    const accepted = await confirm({
      title: "Delete comment?",
      message: "This comment and any nested replies under it will be removed.",
      confirmLabel: "Delete comment",
      tone: "danger"
    });
    if (!accepted) return;
    try {
      const res = await api.delete(`/posts/${post.id}/replies/${replyId}`);
      const deletedIds: string[] = res.data.deletedIds || [replyId];
      setReplies((current) => current.filter((item) => !deletedIds.includes(item.id)));
      setCount((value) => Math.max(0, value - deletedIds.length));
      showSnackbar("Comment deleted successfully.", "success");
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    }
  };

  const renderChildren = (parentId: string) =>
    replies
      .filter((item) => item.parentReplyId === parentId)
      .map((child) => (
        <div key={child.id} className="ml-8 border-l border-white/10 pl-4">
          <ReplyRow reply={child} canDelete={user?.id === child.user.id} onDelete={deleteReply} />
        </div>
      ));

  return (
    <article className="panel rounded-xl p-4 transition hover:border-white/20">
      <div className="flex gap-3">
        <UserAvatar user={post.user} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link className="font-semibold text-white hover:text-space-cyan" to={`/profile/${post.user.username}`}>
              @{post.user.username}
            </Link>
            <span className="text-xs text-slate-500">{timeAgo(post.createdAt)}</span>
            {isOwner && (
              <button className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-red-500/10 hover:text-red-200" onClick={deletePost}>
                <FiTrash2 />
                Delete
              </button>
            )}
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-6 text-slate-100">{post.content}</p>
          <button className="mt-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-space-cyan" onClick={() => setOpen((value) => !value)}>
            <FiMessageCircle />
            {count} replies
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
          <form onSubmit={submitReply} className="flex gap-2">
            <input className="input" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply to this discussion" />
            <button className="button-primary aspect-square px-3" type="submit" aria-label="Send reply">
              <FiSend />
            </button>
          </form>
          {topLevelReplies.map((item) => (
            <div key={item.id} className="space-y-2">
              <ReplyRow reply={item} canDelete={user?.id === item.user.id} onDelete={deleteReply} />
              {renderChildren(item.id)}
            </div>
          ))}
        </div>
      )}
    </article>
  );
};

const ReplyRow = ({ reply, canDelete, onDelete }: { reply: Reply; canDelete?: boolean; onDelete?: (replyId: string) => void }) => (
  <div className="flex gap-3 rounded-lg bg-white/[0.03] p-3">
    <UserAvatar user={reply.user} size="sm" />
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-sm">
        <Link to={`/profile/${reply.user.username}`} className="font-medium text-white hover:text-space-cyan">
          @{reply.user.username}
        </Link>
        <span className="text-xs text-slate-500">{timeAgo(reply.createdAt)}</span>
        {canDelete && (
          <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-red-500/10 hover:text-red-200" onClick={() => onDelete?.(reply.id)}>
            <FiTrash2 />
            Delete
          </button>
        )}
      </div>
      <p className="mt-1 break-words text-sm text-slate-300">{reply.content}</p>
      <span className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
        <FiCornerDownRight />
        reply
      </span>
    </div>
  </div>
);
