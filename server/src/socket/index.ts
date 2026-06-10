import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { Reply } from "../models/Reply.js";
import { Message } from "../models/Message.js";
import { serializeMessage, serializePost, serializeReply, serializeUser } from "../utils/serializers.js";

const onlineUsers = new Map<string, string>();
let ioInstance: Server | null = null;

/** Force-disconnect a user's existing socket (called on new login) */
export const forceDisconnect = (userId: string) => {
  const socketId = onlineUsers.get(userId);
  if (socketId && ioInstance) {
    ioInstance.to(socketId).emit("session:expired");
    const socket = ioInstance.sockets.sockets.get(socketId);
    if (socket) socket.disconnect(true);
    onlineUsers.delete(userId);
  }
};

export const createSocketServer = (server: HttpServer) => {
  const io = new Server(server, {
    cors: { origin: env.clientUrl, credentials: true }
  });
  ioInstance = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      if (!token) return next(new Error("Unauthorized"));

      const user = await User.findOne({ sessionToken: token }).select("_id username");
      if (!user) return next(new Error("Session expired"));

      socket.data.user = { id: String(user._id), username: user.username };
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.data.user as { id: string; username: string };
    onlineUsers.set(user.id, socket.id);
    socket.join(user.id);
    io.emit("presence:update", { userId: user.id, online: true });

    // Mark any undelivered messages addressed to this user as delivered now
    // and notify the original senders so their UI can update single→double tick.
    try {
      const pending = await Message.find({ receiverId: user.id, delivered: false }).select("_id senderId");
      if (pending.length) {
        const ids = pending.map((message) => message._id);
        await Message.updateMany({ _id: { $in: ids } }, { delivered: true });
        const senderBuckets = new Map<string, string[]>();
        for (const message of pending) {
          const senderId = String(message.senderId);
          const arr = senderBuckets.get(senderId) || [];
          arr.push(String(message._id));
          senderBuckets.set(senderId, arr);
        }
        for (const [senderId, messageIds] of senderBuckets) {
          io.to(senderId).emit("message:delivered", { messageIds, receiverId: user.id });
        }
      }
    } catch {
      // non-fatal
    }

    socket.on("post:create", async ({ content }, ack) => {
      try {
        const post = await Post.create({ content, userId: user.id });
        await post.populate("userId");
        const payload = serializePost(post);
        io.emit("feed:newPost", payload);
        io.emit("profile:update", { username: user.username, type: "post", item: payload });
        ack?.({ ok: true, post: payload });
      } catch (error: any) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on("reply:create", async ({ postId, parentReplyId, content, clientId }, ack) => {
      try {
        const reply = await Reply.create({ postId, parentReplyId: parentReplyId || null, content, userId: user.id });
        const post = await Post.findByIdAndUpdate(postId, { $inc: { repliesCount: 1 } }, { new: true }).populate("userId");
        await reply.populate("userId");
        const payload = { ...serializeReply(reply), clientId };
        io.emit("reply:new", { postId, reply: payload, post: post ? serializePost(post) : null });
        io.emit("profile:update", { username: user.username, type: "reply", item: payload });
        ack?.({ ok: true, reply: payload });
      } catch (error: any) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on("message:send", async ({ receiverId, content, clientId }, ack) => {
      try {
        const [sender, receiver] = await Promise.all([User.findById(user.id), User.findById(receiverId)]);
        if (!receiver) return ack?.({ ok: false, message: "User not found" });

        const iBlockedThem = (sender?.blockedUsers || []).some((id) => String(id) === String(receiverId));
        const theyBlockedMe = (receiver?.blockedUsers || []).some((id) => String(id) === String(user.id));
        if (iBlockedThem) return ack?.({ ok: false, message: "Unblock this user to send a message." });
        if (theyBlockedMe) return ack?.({ ok: false, message: "You can't message this user." });

        const receiverOnline = onlineUsers.has(receiverId);
        const message = await Message.create({
          senderId: user.id,
          receiverId,
          content,
          delivered: receiverOnline
        });
        const payload = {
          ...serializeMessage(message),
          clientId,
          sender: sender ? serializeUser(sender) : null,
          receiver: receiver ? serializeUser(receiver) : null
        };
        io.to(receiverId).emit("message:new", payload);
        io.to(user.id).emit("message:new", payload);
        ack?.({ ok: true, message: payload });
      } catch (error: any) {
        ack?.({ ok: false, message: error.message });
      }
    });

    socket.on("message:typing", ({ receiverId, typing }) => {
      io.to(receiverId).emit("message:typing", { userId: user.id, username: user.username, typing: Boolean(typing) });
    });

    socket.on("message:seen", async ({ senderId }) => {
      const result = await Message.find({ senderId, receiverId: user.id, seen: false }).select("_id");
      const messageIds = result.map((message) => String(message._id));
      if (messageIds.length) {
        await Message.updateMany({ _id: { $in: messageIds } }, { seen: true, delivered: true });
        io.to(senderId).emit("message:seen", { seenBy: user.id, messageIds });
      } else {
        io.to(senderId).emit("message:seen", { seenBy: user.id, messageIds: [] });
      }
    });

    socket.on("user:lookup", async ({ username }, ack) => {
      const found = await User.findOne({ username: String(username || "").toLowerCase() });
      ack?.({ user: found ? serializeUser(found) : null });
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(user.id);
      io.emit("presence:update", { userId: user.id, online: false });
    });
  });

  return io;
};
