import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { env } from "../config/env.js";
import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { Reply } from "../models/Reply.js";
import { Message } from "../models/Message.js";
import { serializeMessage, serializePost, serializeReply, serializeUser } from "../utils/serializers.js";

const onlineUsers = new Map<string, string>();

export const createSocketServer = (server: HttpServer) => {
  const io = new Server(server, {
    cors: { origin: env.clientUrl, credentials: true }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token as string;
      socket.data.user = verifyToken(token);
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

    socket.on("message:send", async ({ receiverId, content }, ack) => {
      try {
        const message = await Message.create({ senderId: user.id, receiverId, content });
        const [sender, receiver] = await Promise.all([User.findById(user.id), User.findById(receiverId)]);
        const payload = {
          ...serializeMessage(message),
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
      await Message.updateMany({ senderId, receiverId: user.id, seen: false }, { seen: true });
      io.to(senderId).emit("message:seen", { seenBy: user.id });
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
