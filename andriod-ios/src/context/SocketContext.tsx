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
  const { token, forceLogout } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [online, setOnline] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return;
    }
    const nextSocket = io(API_URL, { auth: { token }, transports: ["websocket"] });
    setSocket(nextSocket);

    nextSocket.on("presence:update", ({ userId, online: isOnline }) => {
      setOnline((current) => ({ ...current, [userId]: isOnline }));
    });

    // Single-device enforcement: server kicks this session when user logs in elsewhere
    nextSocket.on("session:expired", () => {
      forceLogout();
    });

    return () => {
      nextSocket.disconnect();
    };
  }, [token, forceLogout]);

  const value = useMemo(() => ({ socket, online }), [online, socket]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used inside SocketProvider");
  return context;
};
