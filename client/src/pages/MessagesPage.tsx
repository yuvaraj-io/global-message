import { FormEvent, useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiSend } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { UserAvatar } from "../components/UserAvatar";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { api } from "../services/api";
import { Conversation, Message, User } from "../types";
import { timeAgo } from "../utils/time";

export const MessagesPage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, online } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [typing, setTyping] = useState("");

  useEffect(() => {
    api.get("/messages/conversations").then((res) => {
      const nextConversations: Conversation[] = res.data.conversations;
      setConversations(nextConversations);
      if (!username) setActive(nextConversations[0]?.user || null);
    });
  }, [username]);

  useEffect(() => {
    if (!username) return;
    api.get(`/messages/${username}`).then((res) => {
      setActive(res.data.user);
      setMessages(res.data.messages);
      setConversations((current) => {
        if (current.some((conversation) => conversation.user.id === res.data.user.id)) return current;
        return current;
      });
    });
  }, [username]);

  useEffect(() => {
    if (!active) return;
    api.get(`/messages/${active.username}`).then((res) => setMessages(res.data.messages));
  }, [active]);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (message: Message) => {
      setMessages((current) => (current.some((item) => item.id === message.id) ? current : [...current, message]));
    };
    const onTyping = ({ username, typing: isTyping }: { username: string; typing: boolean }) => {
      setTyping(isTyping ? username : "");
      if (isTyping) window.setTimeout(() => setTyping(""), 1600);
    };
    socket.on("message:new", onMessage);
    socket.on("message:typing", onTyping);
    return () => {
      socket.off("message:new", onMessage);
      socket.off("message:typing", onTyping);
    };
  }, [socket]);

  const visibleMessages = useMemo(() => {
    if (!active || !user) return [];
    return messages.filter(
      (message) =>
        (message.senderId === user.id && message.receiverId === active.id) ||
        (message.senderId === active.id && message.receiverId === user.id)
    );
  }, [active, messages, user]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!socket || !active || !content.trim()) return;
    socket.emit("message:send", { receiverId: active.id, content: content.trim() });
    setContent("");
  };

  const notifyTyping = (value: string) => {
    setContent(value);
    if (socket && active) socket.emit("message:typing", { receiverId: active.id, typing: Boolean(value) });
  };

  return (
    <div className="grid min-h-[calc(100vh-2rem)] gap-4 lg:grid-cols-[320px_1fr]">
      <aside className="panel rounded-xl p-3">
        <h1 className="px-2 py-3 text-2xl font-black text-white">Messages</h1>
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.user.id}
              onClick={() => {
                setActive(conversation.user);
                navigate(`/messages/${conversation.user.username}`);
              }}
              className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition ${active?.id === conversation.user.id ? "bg-white/10" : "hover:bg-white/5"}`}
            >
              <UserAvatar user={conversation.user} online={online[conversation.user.id]} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">@{conversation.user.username}</span>
                  {conversation.unread > 0 && <span className="rounded-full bg-space-rose px-2 text-xs text-white">{conversation.unread}</span>}
                </div>
                <p className="truncate text-sm text-slate-500">{conversation.latest.content}</p>
              </div>
            </button>
          ))}
          {!conversations.length && <p className="px-3 py-8 text-sm text-slate-500">Search a profile and tap Message to start a conversation.</p>}
        </div>
      </aside>

      <section className="panel flex min-h-[70vh] flex-col rounded-xl">
        {active ? (
          <>
            <div className="flex items-center gap-3 border-b border-white/10 p-4">
              <UserAvatar user={active} online={online[active.id]} />
              <div>
                <h2 className="font-bold text-white">@{active.username}</h2>
                <p className="text-xs text-slate-500">{online[active.id] ? "Online" : "Offline"}</p>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {visibleMessages.map((message) => {
                const mine = message.senderId === user?.id;
                return (
                  <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-xl px-4 py-3 ${mine ? "bg-space-cyan text-space-950" : "bg-white/10 text-slate-100"}`}>
                      <p className="break-words text-sm">{message.content}</p>
                      <div className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${mine ? "text-space-950/70" : "text-slate-500"}`}>
                        {timeAgo(message.createdAt)}
                        {mine && message.seen && <FiCheckCircle />}
                      </div>
                    </div>
                  </div>
                );
              })}
              {typing && <p className="text-sm text-slate-500">@{typing} is typing...</p>}
            </div>
            <form onSubmit={submit} className="flex gap-2 border-t border-white/10 p-4">
              <input className="input" value={content} onChange={(event) => notifyTyping(event.target.value)} placeholder="Send a private message" />
              <button className="button-primary aspect-square px-3" aria-label="Send message">
                <FiSend />
              </button>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-8 text-center text-slate-500">Select a conversation to start messaging.</div>
        )}
      </section>
    </div>
  );
};
