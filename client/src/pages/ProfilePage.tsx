import { useEffect, useState } from "react";
import { FiCalendar, FiMessageSquare, FiRadio } from "react-icons/fi";
import { useParams } from "react-router-dom";
import { LoadingState } from "../components/LoadingState";
import { PostCard } from "../components/PostCard";
import { UserAvatar } from "../components/UserAvatar";
import { useSocket } from "../context/SocketContext";
import { api } from "../services/api";
import { Discussion, Post, Reply, User } from "../types";
import { fullDate, timeAgo } from "../utils/time";

type ProfilePayload = {
  user: User;
  posts: Post[];
  replies: Reply[];
  discussions: Discussion[];
};

export const ProfilePage = () => {
  const { username } = useParams();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [tab, setTab] = useState("posts");
  const { socket } = useSocket();

  useEffect(() => {
    setProfile(null);
    api.get(`/users/${username}`).then((res) => setProfile(res.data));
  }, [username]);

  useEffect(() => {
    if (!socket || !username) return;
    const onUpdate = (event: { username: string; type: string; item: Post | Reply }) => {
      if (event.username !== username.toLowerCase()) return;
      setProfile((current) => {
        if (!current) return current;
        if (event.type === "post") return { ...current, posts: [event.item as Post, ...current.posts] };
        if (event.type === "reply") return { ...current, replies: [event.item as Reply, ...current.replies] };
        return current;
      });
    };
    socket.on("profile:update", onUpdate);
    return () => {
      socket.off("profile:update", onUpdate);
    };
  }, [socket, username]);

  if (!profile) return <LoadingState label="Loading profile" />;

  const tabs = ["posts", "replies", "discussions", "media"];

  return (
    <div className="mx-auto max-w-3xl">
      <section className="panel overflow-hidden rounded-xl">
        <div className="h-32 bg-[linear-gradient(120deg,#4dd6d6,#b5f36d,#ff6b9a)] opacity-80" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <UserAvatar user={profile.user} size="lg" />
            <div className="flex gap-4 text-sm text-slate-400">
              <span>{profile.user.followersCount} followers</span>
              <span>{profile.user.followingCount} following</span>
            </div>
          </div>
          <h1 className="mt-4 text-3xl font-black text-white">@{profile.user.username}</h1>
          <p className="mt-2 max-w-xl text-slate-300">{profile.user.bio}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              <FiCalendar /> Joined {fullDate(profile.user.createdAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <FiRadio /> {profile.posts.length} discussions started
            </span>
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-10 mt-4 grid grid-cols-4 rounded-xl border border-white/10 bg-space-950/90 p-1 backdrop-blur">
        {tabs.map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize transition ${tab === item ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"}`}>
            {item}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {tab === "posts" && profile.posts.map((post) => <PostCard key={post.id} post={post} />)}
        {tab === "replies" &&
          profile.replies.map((reply) => (
            <div key={reply.id} className="panel rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <FiMessageSquare />
                replied {timeAgo(reply.createdAt)}
              </div>
              <p className="mt-2 text-slate-200">{reply.content}</p>
            </div>
          ))}
        {tab === "discussions" &&
          profile.discussions.map((discussion) => (
            <div key={discussion.id} className="panel rounded-xl p-4">
              <h3 className="font-bold text-white">{discussion.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-slate-400">{discussion.content}</p>
              <div className="mt-3 flex gap-4 text-xs text-slate-500">
                <span>{discussion.repliesCount} replies</span>
                <span>latest {timeAgo(discussion.latestActivityAt)}</span>
                <span>created {timeAgo(discussion.createdAt)}</span>
              </div>
            </div>
          ))}
        {tab === "media" && <div className="panel rounded-xl p-8 text-center text-slate-500">Media is ready for future uploads.</div>}
      </div>
    </div>
  );
};
