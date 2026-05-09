import { FormEvent, useEffect, useMemo, useState } from "react";
import { FiCornerDownRight, FiMessageCircle, FiSend } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { api } from "../services/api";
import { Post, Reply } from "../types";
import { timeAgo } from "../utils/time";
import { UserAvatar } from "./UserAvatar";

type Props = {
  post: Post;
  onReply?: (postId: string) => void;
};

export const PostCard = ({ post, onReply }: Props) => {
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [reply, setReply] = useState("");
  const [count, setCount] = useState(post.repliesCount);
  const { socket } = useSocket();

  useEffect(() => setCount(post.repliesCount), [post.repliesCount]);

  useEffect(() => {
    if (!open) return;
    api.get(`/posts/${post.id}/replies`).then((res) => setReplies(res.data.replies));
  }, [open, post.id]);

  useEffect(() => {
    if (!socket) return;
    const onNewReply = ({ postId, reply: nextReply }: { postId: string; reply: Reply }) => {
      if (postId !== post.id) return;
      setCount((value) => value + 1);
      setReplies((current) => (current.some((item) => item.id === nextReply.id) ? current : [...current, nextReply]));
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
    if (!content || !socket) return;
    const optimistic: Reply = {
      id: `temp-${Date.now()}`,
      content,
      postId: post.id,
      parentReplyId: parentReplyId || null,
      createdAt: new Date().toISOString(),
      user: post.user
    };
    setReplies((current) => [...current, optimistic]);
    setCount((value) => value + 1);
    setReply("");
    socket.emit("reply:create", { postId: post.id, parentReplyId, content });
    onReply?.(post.id);
  };

  const renderChildren = (parentId: string) =>
    replies
      .filter((item) => item.parentReplyId === parentId)
      .map((child) => (
        <div key={child.id} className="ml-8 border-l border-white/10 pl-4">
          <ReplyRow reply={child} />
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
              <ReplyRow reply={item} />
              {renderChildren(item.id)}
            </div>
          ))}
        </div>
      )}
    </article>
  );
};

const ReplyRow = ({ reply }: { reply: Reply }) => (
  <div className="flex gap-3 rounded-lg bg-white/[0.03] p-3">
    <UserAvatar user={reply.user} size="sm" />
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-sm">
        <Link to={`/profile/${reply.user.username}`} className="font-medium text-white hover:text-space-cyan">
          @{reply.user.username}
        </Link>
        <span className="text-xs text-slate-500">{timeAgo(reply.createdAt)}</span>
      </div>
      <p className="mt-1 break-words text-sm text-slate-300">{reply.content}</p>
      <span className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
        <FiCornerDownRight />
        reply
      </span>
    </div>
  </div>
);
