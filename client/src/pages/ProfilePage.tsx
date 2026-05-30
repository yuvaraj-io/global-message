import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { FiCalendar, FiCamera, FiEdit2, FiMessageSquare, FiRadio, FiSave, FiTrash2, FiX } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import { LoadingState } from "../components/LoadingState";
import { PostCard } from "../components/PostCard";
import { UserAvatar } from "../components/UserAvatar";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useUI } from "../context/UIContext";
import { api, getErrorMessage } from "../services/api";
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
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const { socket } = useSocket();
  const { user, updateUser } = useAuth();
  const { confirm, showSnackbar } = useUI();

  useEffect(() => {
    setProfile(null);
    api.get(`/users/${username}`).then((res) => {
      setProfile(res.data);
      setBio(res.data.user.bio);
      setAvatar(res.data.user.avatar);
      setNewUsername(res.data.user.username);
    });
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
  const isMe = user?.id === profile.user.id;

  const selectAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showSnackbar("Please choose an image file.", "error");
      return;
    }
    if (file.size > 1_500_000) {
      showSnackbar("Please choose an image under 1.5 MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, string> = { bio, avatar };
      if (newUsername !== profile?.user.username) body.username = newUsername;
      const res = await api.patch("/users/me", body);
      setProfile((current) => (current ? { ...current, user: res.data.user } : current));
      updateUser(res.data.user);
      setEditing(false);
      showSnackbar("Profile updated successfully.", "success");
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteReplyFromProfile = async (reply: Reply) => {
    const accepted = await confirm({
      title: "Delete comment?",
      message: "This comment and any nested replies under it will be removed.",
      confirmLabel: "Delete comment",
      tone: "danger"
    });
    if (!accepted) return;
    try {
      const res = await api.delete(`/posts/${reply.postId}/replies/${reply.id}`);
      const deletedIds: string[] = res.data.deletedIds || [reply.id];
      setProfile((current) =>
        current ? { ...current, replies: current.replies.filter((item) => !deletedIds.includes(item.id)) } : current
      );
      showSnackbar("Comment deleted successfully.", "success");
    } catch (error) {
      showSnackbar(getErrorMessage(error), "error");
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <section className="panel overflow-hidden rounded-xl">
        <div className="h-32 bg-[linear-gradient(120deg,#00a884,#25d366,#53bdeb)] opacity-90" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <UserAvatar user={profile.user} size="lg" />
            <div className="flex flex-wrap items-center gap-3 text-sm text-wa-subtext">
              <span>{profile.user.followersCount} followers</span>
              <span>{profile.user.followingCount} following</span>
              {isMe && (
                <button className="button-ghost py-2" onClick={() => setEditing((value) => !value)}>
                  {editing ? <FiX /> : <FiEdit2 />}
                  {editing ? "Cancel" : "Edit profile"}
                </button>
              )}
              {!isMe && (
                <Link className="button-primary py-2" to={`/messages/${profile.user.username}`}>
                  <FiMessageSquare />
                  Message
                </Link>
              )}
            </div>
          </div>
          {editing ? (
            <form onSubmit={saveProfile} className="mt-5 space-y-4 rounded-xl border border-wa-border bg-wa-chatBg p-4">
              <div className="flex flex-wrap items-center gap-4">
                <img className="h-20 w-20 rounded-full border border-wa-border object-cover" src={avatar} alt={profile.user.username} />
                <label className="button-ghost cursor-pointer py-2">
                  <FiCamera />
                  Upload photo
                  <input className="hidden" type="file" accept="image/*" onChange={selectAvatar} />
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-wa-muted">Username</span>
                <input
                  className="input"
                  value={newUsername}
                  maxLength={24}
                  onChange={(event) => setNewUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="username"
                />
                <span className="mt-1 block text-xs text-wa-muted">3-24 chars · lowercase, numbers, underscores · 30-day cooldown</span>
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-wa-muted">Bio</span>
                <textarea className="input min-h-24 resize-none" value={bio} maxLength={160} onChange={(event) => setBio(event.target.value)} />
              </label>
              <div className="flex items-center justify-between">
                <span className="text-xs text-wa-muted">{bio.length}/160</span>
                <button className="button-primary" disabled={saving}>
                  <FiSave />
                  Save profile
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="mt-4 text-3xl font-black text-wa-text">@{profile.user.username}</h1>
              <p className="mt-2 max-w-xl text-wa-subtext">{profile.user.bio}</p>
            </>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-wa-muted">
            <span className="inline-flex items-center gap-2">
              <FiCalendar /> Joined {fullDate(profile.user.createdAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <FiRadio /> {profile.posts.length} discussions started
            </span>
          </div>
        </div>
      </section>

      <div className="sticky top-0 z-10 mt-4 grid grid-cols-4 rounded-xl border border-wa-border bg-white/95 p-1 backdrop-blur">
        {tabs.map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize transition ${tab === item ? "bg-wa-green/10 text-wa-greenDark" : "text-wa-subtext hover:text-wa-text"}`}>
            {item}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {tab === "posts" &&
          profile.posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={(postId) => setProfile((current) => (current ? { ...current, posts: current.posts.filter((item) => item.id !== postId) } : current))}
            />
          ))}
        {tab === "replies" &&
          profile.replies.map((reply) => (
            <div key={reply.id} className="panel rounded-xl p-4">
              <div className="flex items-center gap-2 text-sm text-wa-subtext">
                <FiMessageSquare />
                replied {timeAgo(reply.createdAt)}
                {isMe && (
                  <button className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-wa-muted transition hover:bg-red-50 hover:text-red-600" onClick={() => deleteReplyFromProfile(reply)}>
                    <FiTrash2 />
                    Delete
                  </button>
                )}
              </div>
              <p className="mt-2 text-wa-text">{reply.content}</p>
            </div>
          ))}
        {tab === "discussions" &&
          profile.discussions.map((discussion) => (
            <div key={discussion.id} className="panel rounded-xl p-4">
              <h3 className="font-bold text-wa-text">{discussion.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-wa-subtext">{discussion.content}</p>
              <div className="mt-3 flex gap-4 text-xs text-wa-muted">
                <span>{discussion.repliesCount} replies</span>
                <span>latest {timeAgo(discussion.latestActivityAt)}</span>
                <span>created {timeAgo(discussion.createdAt)}</span>
              </div>
            </div>
          ))}
        {tab === "media" && <div className="panel rounded-xl p-8 text-center text-wa-subtext">Media is ready for future uploads.</div>}
      </div>
    </div>
  );
};
