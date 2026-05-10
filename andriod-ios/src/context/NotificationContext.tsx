import { router } from "expo-router";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Message, Post, Reply, User } from "../types";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import { useUI } from "./UIContext";

export type AppNotification = {
  id: string;
  type: "post" | "reply" | "message";
  title: string;
  body: string;
  route: string;
  createdAt: string;
  read: boolean;
};

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  unreadMessages: Record<string, number>;
  markAllRead: () => void;
  clearMessageUnread: (userId: string) => void;
  setActiveMessageUser: (userId: string | null) => void;
  openNotification: (notification: AppNotification) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

type RealtimeMessage = Message & {
  sender?: User | null;
  receiver?: User | null;
};

export const NotificationProvider = ({ children }: PropsWithChildren) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { showSnackbar } = useUI();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const activeMessageUserRef = useRef<string | null>(null);

  const addNotification = (notification: Omit<AppNotification, "id" | "createdAt" | "read">) => {
    const next: AppNotification = {
      ...notification,
      id: `${notification.type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
      read: false
    };
    setNotifications((current) => [next, ...current].slice(0, 80));
    showSnackbar(next.title, "info", () => openRoute(next.route));
  };

  const openRoute = (route: string) => {
    router.push(route as never);
  };

  const openNotification = (notification: AppNotification) => {
    setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, read: true } : item)));
    openRoute(notification.route);
  };

  useEffect(() => {
    if (!socket || !user) return;

    const onPost = (post: Post) => {
      if (post.user.id === user.id) return;
      addNotification({
        type: "post",
        title: `@${post.user.username} posted a discussion`,
        body: post.content,
        route: "/(tabs)"
      });
    };

    const onReply = ({ reply, post }: { reply: Reply; post?: Post | null }) => {
      if (reply.user.id === user.id) return;
      if (post?.user?.id && post.user.id !== user.id) return;
      addNotification({
        type: "reply",
        title: `@${reply.user.username} commented on your post`,
        body: reply.content,
        route: "/(tabs)"
      });
    };

    const onMessage = (message: RealtimeMessage) => {
      if (message.senderId === user.id) return;
      if (activeMessageUserRef.current === message.senderId) return;
      const sender = message.sender;
      setUnreadMessages((current) => ({ ...current, [message.senderId]: (current[message.senderId] || 0) + 1 }));
      addNotification({
        type: "message",
        title: sender ? `New message from @${sender.username}` : "New private message",
        body: message.content,
        route: sender ? `/messages/${sender.username}` : "/messages"
      });
    };

    socket.on("feed:newPost", onPost);
    socket.on("reply:new", onReply);
    socket.on("message:new", onMessage);

    return () => {
      socket.off("feed:newPost", onPost);
      socket.off("reply:new", onReply);
      socket.off("message:new", onMessage);
    };
  }, [socket, user]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length,
      unreadMessages,
      markAllRead: () => setNotifications((current) => current.map((item) => ({ ...item, read: true }))),
      clearMessageUnread: (userId: string) => setUnreadMessages((current) => ({ ...current, [userId]: 0 })),
      setActiveMessageUser: (userId: string | null) => {
        activeMessageUserRef.current = userId;
      },
      openNotification
    }),
    [notifications, unreadMessages]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used inside NotificationProvider");
  return context;
};
