import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FiArrowDown, FiArrowLeft, FiSearch, FiSend, FiSmile } from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { MessageTicks } from "../components/MessageTicks";
import { UserAvatar } from "../components/UserAvatar";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { api } from "../services/api";
import { Conversation, Message, User } from "../types";
import { clockTime, dayLabel, isSameDay } from "../utils/time";

type DeliveredEvent = { messageIds: string[]; receiverId: string };
type SeenEvent = { seenBy: string; messageIds: string[] };

export const MessagesPage = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, online } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [typing, setTyping] = useState(false);
  const [filter, setFilter] = useState("");
  const [atBottom, setAtBottom] = useState(true);
  const typingTimer = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    api.get("/messages/conversations").then((res) => {
      setConversations(res.data.conversations);
      if (!username) {
        setActive(null);
        setMessages([]);
      }
    });
  }, [username]);

  useEffect(() => {
    if (!username) return;
    api.get(`/messages/${username}`).then((res) => {
      setActive(res.data.user);
      setMessages(res.data.messages);
    });
  }, [username]);

  // Mark conversation as seen when opened or when new incoming arrives
  useEffect(() => {
    if (!socket || !active || !user) return;
    const hasUnseenFromOther = messages.some((m) => m.senderId === active.id && !m.seen);
    if (hasUnseenFromOther) {
      socket.emit("message:seen", { senderId: active.id });
    }
  }, [socket, active, user, messages]);

  useEffect(() => {
    if (!socket) return;

    const onMessage = (message: Message) => {
      setMessages((current) => {
        // Reconcile optimistic by clientId if present
        if (message.clientId) {
          const idx = current.findIndex((m) => m.clientId && m.clientId === message.clientId);
          if (idx >= 0) {
            const copy = current.slice();
            copy[idx] = { ...message, pending: false };
            return copy;
          }
        }
        if (current.some((m) => m.id === message.id)) return current;
        return [...current, { ...message, pending: false }];
      });

      // Update conversation preview
      setConversations((current) => {
        const otherId = message.senderId === user?.id ? message.receiverId : message.senderId;
        const idx = current.findIndex((c) => c.user.id === otherId);
        if (idx >= 0) {
          const copy = current.slice();
          const conv = copy[idx];
          const isIncomingActive = active && message.senderId === active.id;
          copy[idx] = {
            ...conv,
            latest: message,
            unread: message.senderId === user?.id || isIncomingActive ? conv.unread : conv.unread + 1
          };
          return copy.sort((a, b) => new Date(b.latest.createdAt).getTime() - new Date(a.latest.createdAt).getTime());
        }
        return current;
      });
    };

    const onTyping = ({ userId, typing: isTyping }: { userId: string; typing: boolean }) => {
      if (!active || userId !== active.id) return;
      setTyping(isTyping);
      if (typingTimer.current) window.clearTimeout(typingTimer.current);
      if (isTyping) typingTimer.current = window.setTimeout(() => setTyping(false), 2500);
    };

    const onDelivered = ({ messageIds, receiverId }: DeliveredEvent) => {
      setMessages((current) =>
        current.map((m) => (m.receiverId === receiverId && messageIds.includes(m.id) ? { ...m, delivered: true } : m))
      );
    };

    const onSeen = ({ seenBy, messageIds }: SeenEvent) => {
      setMessages((current) =>
        current.map((m) => {
          if (m.receiverId !== seenBy) return m;
          if (messageIds.length && !messageIds.includes(m.id)) return m;
          return { ...m, seen: true, delivered: true };
        })
      );
    };

    socket.on("message:new", onMessage);
    socket.on("message:typing", onTyping);
    socket.on("message:delivered", onDelivered);
    socket.on("message:seen", onSeen);
    return () => {
      socket.off("message:new", onMessage);
      socket.off("message:typing", onTyping);
      socket.off("message:delivered", onDelivered);
      socket.off("message:seen", onSeen);
    };
  }, [socket, active, user]);

  const visibleMessages = useMemo(() => {
    if (!active || !user) return [];
    return messages
      .filter(
        (m) =>
          (m.senderId === user.id && m.receiverId === active.id) ||
          (m.senderId === active.id && m.receiverId === user.id)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [active, messages, user]);

  // Auto-scroll to bottom when message list changes, but only if already near bottom
  useEffect(() => {
    if (atBottom && endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [visibleMessages.length, typing, atBottom]);

  // Force scroll on conversation switch
  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "auto", block: "end" });
    setAtBottom(true);
  }, [active?.id]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAtBottom(distanceFromBottom < 80);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = content.trim();
    if (!socket || !active || !user || !trimmed) return;
    const clientId = `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimistic: Message = {
      id: clientId,
      clientId,
      senderId: user.id,
      receiverId: active.id,
      content: trimmed,
      delivered: false,
      seen: false,
      pending: true,
      createdAt: new Date().toISOString()
    };
    setMessages((current) => [...current, optimistic]);
    socket.emit("message:send", { receiverId: active.id, content: trimmed, clientId });
    setContent("");
    socket.emit("message:typing", { receiverId: active.id, typing: false });
    setAtBottom(true);
  };

  const notifyTyping = (value: string) => {
    setContent(value);
    if (socket && active) socket.emit("message:typing", { receiverId: active.id, typing: Boolean(value) });
  };

  const filteredConversations = useMemo(() => {
    if (!filter.trim()) return conversations;
    const q = filter.trim().toLowerCase();
    return conversations.filter((c) => c.user.username.toLowerCase().includes(q));
  }, [conversations, filter]);

  const statusFor = (message: Message): "pending" | "sent" | "delivered" | "seen" => {
    if (message.pending) return "pending";
    if (message.seen) return "seen";
    if (message.delivered) return "delivered";
    return "sent";
  };

  const showSidebar = !active;

  return (
    <div className="fixed inset-x-0 top-0 bottom-[4.75rem] z-10 overflow-hidden bg-wa-chatBg lg:bottom-0 lg:left-72">
      <div className="grid h-full lg:grid-cols-[360px_1fr]">
        {/* Sidebar */}
        <aside
          className={`flex h-full min-h-0 flex-col border-r border-wa-border bg-white ${
            showSidebar ? "flex" : "hidden lg:flex"
          }`}
        >
          <header className="flex items-center justify-between border-b border-wa-border bg-wa-header px-4 py-3">
            <h1 className="text-lg font-semibold text-wa-text">Chats</h1>
          </header>
          <div className="border-b border-wa-border bg-white px-3 py-2">
            <label className="relative block">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-wa-muted" />
              <input
                className="w-full rounded-lg bg-wa-chatBg px-9 py-2 text-sm text-wa-text outline-none placeholder:text-wa-muted focus:ring-2 focus:ring-wa-green/20"
                placeholder="Search or start new chat"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              />
            </label>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map((conversation) => {
              const isActive = active?.id === conversation.user.id;
              return (
                <button
                  key={conversation.user.id}
                  onClick={() => {
                    setActive(conversation.user);
                    setConversations((current) =>
                      current.map((item) =>
                        item.user.id === conversation.user.id ? { ...item, unread: 0 } : item
                      )
                    );
                    navigate(`/messages/${conversation.user.username}`);
                  }}
                  className={`flex w-full items-center gap-3 border-b border-wa-border/60 px-4 py-3 text-left transition ${
                    isActive ? "bg-wa-chatBg" : "hover:bg-wa-chatBg/70"
                  }`}
                >
                  <UserAvatar user={conversation.user} online={online[conversation.user.id]} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-semibold text-wa-text">@{conversation.user.username}</span>
                      <span className="shrink-0 text-[11px] text-wa-muted">
                        {clockTime(conversation.latest.createdAt)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-sm text-wa-subtext">{conversation.latest.content}</p>
                      {conversation.unread > 0 && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-wa-unread px-1.5 text-[11px] font-semibold text-white">
                          {conversation.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
            {!filteredConversations.length && (
              <p className="px-4 py-10 text-center text-sm text-wa-muted">
                {filter.trim() ? "No matching chats." : "Search a profile and tap Message to start a conversation."}
              </p>
            )}
          </div>
        </aside>

        {/* Chat area */}
        <section className={`flex h-full min-h-0 flex-col ${showSidebar ? "hidden lg:flex" : "flex"}`}>
          {active ? (
            <>
              <header className="flex items-center gap-3 border-b border-wa-border bg-wa-header px-4 py-2.5">
                <button
                  className="grid h-9 w-9 place-items-center rounded-full text-wa-text hover:bg-wa-border/50 lg:hidden"
                  onClick={() => {
                    setActive(null);
                    navigate("/messages");
                  }}
                  aria-label="Back"
                >
                  <FiArrowLeft />
                </button>
                <UserAvatar user={active} online={online[active.id]} />
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-wa-text">@{active.username}</h2>
                  <p className="text-xs text-wa-subtext">
                    {typing ? "typing…" : online[active.id] ? "online" : "offline"}
                  </p>
                </div>
              </header>

              <div ref={scrollRef} onScroll={onScroll} className="chat-bg relative flex-1 overflow-y-auto px-3 py-4 sm:px-6">
                <div className="mx-auto flex max-w-3xl flex-col gap-1">
                  {visibleMessages.map((message, index) => {
                    const mine = message.senderId === user?.id;
                    const previous = visibleMessages[index - 1];
                    const showDay = !previous || !isSameDay(previous.createdAt, message.createdAt);
                    const grouped = previous && previous.senderId === message.senderId && !showDay;
                    return (
                      <div key={message.id}>
                        {showDay && (
                          <div className="my-3 flex justify-center">
                            <span className="rounded-md bg-white/90 px-3 py-1 text-[11px] font-medium text-wa-subtext shadow-card">
                              {dayLabel(message.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${mine ? "justify-end" : "justify-start"} ${grouped ? "mt-0.5" : "mt-1.5"}`}>
                          <div
                            className={`relative max-w-[78%] rounded-lg px-2.5 py-1.5 shadow-bubble sm:max-w-[65%] ${
                              mine ? "bg-wa-bubbleOut" : "bg-wa-bubbleIn"
                            } ${!grouped ? (mine ? "rounded-tr-none" : "rounded-tl-none") : ""}`}
                          >
                            {!grouped && (
                              <span
                                className={`absolute top-0 ${mine ? "-right-1.5" : "-left-1.5"} h-0 w-0`}
                                style={
                                  mine
                                    ? {
                                        borderLeft: "8px solid #E8E8E8",
                                        borderTop: "0",
                                        borderBottom: "8px solid transparent"
                                      }
                                    : {
                                        borderRight: "8px solid #ffffff",
                                        borderTop: "0",
                                        borderBottom: "8px solid transparent"
                                      }
                                }
                              />
                            )}
                            <p className="whitespace-pre-wrap break-words pr-14 text-[14.2px] leading-[19px] text-wa-text">
                              {message.content}
                            </p>
                            <span className="float-right -mt-3 ml-2 flex items-center gap-1 text-[11px] leading-none text-wa-muted">
                              {clockTime(message.createdAt)}
                              {mine && <MessageTicks status={statusFor(message)} />}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {!visibleMessages.length && (
                    <div className="mt-10 text-center text-sm text-wa-subtext">
                      Say hi to @{active.username} 👋
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                {!atBottom && (
                  <button
                    type="button"
                    onClick={() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })}
                    className="sticky bottom-4 ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-wa-subtext shadow-card hover:text-wa-text"
                    aria-label="Scroll to latest"
                  >
                    <FiArrowDown />
                  </button>
                )}
              </div>

              <form
                onSubmit={submit}
                className="flex items-center gap-2 border-t border-wa-border bg-wa-header px-3 py-2.5 sm:px-4"
              >
                <button
                  type="button"
                  className="grid h-10 w-10 place-items-center rounded-full text-wa-subtext hover:bg-wa-border/50"
                  aria-label="Emoji"
                  tabIndex={-1}
                >
                  <FiSmile />
                </button>
                <input
                  className="flex-1 rounded-full border border-transparent bg-white px-4 py-2.5 text-sm text-wa-text outline-none placeholder:text-wa-muted focus:border-wa-green focus:ring-2 focus:ring-wa-green/15"
                  value={content}
                  onChange={(event) => notifyTyping(event.target.value)}
                  placeholder="Type a message"
                  autoFocus
                />
                <button
                  className="grid h-10 w-10 place-items-center rounded-full bg-wa-green text-white transition hover:bg-wa-greenDark disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!content.trim()}
                  aria-label="Send message"
                >
                  <FiSend />
                </button>
              </form>
            </>
          ) : (
            <div className="hidden flex-1 place-items-center bg-wa-chatBg p-8 text-center text-wa-subtext lg:grid">
              <div>
                <div className="mx-auto mb-4 h-32 w-32 rounded-full bg-white/80 shadow-card" />
                <h3 className="text-xl font-semibold text-wa-text">Global Space Messages</h3>
                <p className="mt-2 max-w-sm text-sm">
                  Select a conversation from the list to start chatting. Messages are delivered in real time.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
