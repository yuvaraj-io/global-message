import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL } from "../services/api";
import { useAuth } from "./AuthContext";

type SocketContextValue = {
  socket: Socket | null;
  online: Record<string, boolean>;
};

const SocketContext = createContext<SocketContextValue | null>(null);

export const SocketProvider = ({ children }: PropsWithChildren) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [online, setOnline] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return;
    }

    const nextSocket = io(API_URL, { auth: { token } });
    setSocket(nextSocket);

    nextSocket.on("presence:update", ({ userId, online: isOnline }) => {
      setOnline((prev) => ({ ...prev, [userId]: isOnline }));
    });

    return () => {
      nextSocket.disconnect();
    };
  }, [token]);

  const value = useMemo(() => ({ socket, online }), [online, socket]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used inside SocketProvider");
  return context;
};
