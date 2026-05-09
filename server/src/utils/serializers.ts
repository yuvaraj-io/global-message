import { Types } from "mongoose";

const avatarFor = (username: string) =>
  `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(username)}`;

export const serializeUser = (user: any) => ({
  id: String(user._id),
  username: user.username,
  email: user.email,
  avatar: user.avatar || avatarFor(user.username),
  bio: user.bio,
  followersCount: user.followers?.length || 0,
  followingCount: user.following?.length || 0,
  createdAt: user.createdAt
});

export const serializePost = (post: any) => ({
  id: String(post._id),
  content: post.content,
  repliesCount: post.repliesCount,
  createdAt: post.createdAt,
  user: post.userId?._id ? serializeUser(post.userId) : { id: String(post.userId) }
});

export const serializeReply = (reply: any) => ({
  id: String(reply._id),
  content: reply.content,
  postId: String(reply.postId?._id || reply.postId),
  parentReplyId: reply.parentReplyId ? String(reply.parentReplyId) : null,
  createdAt: reply.createdAt,
  user: reply.userId?._id ? serializeUser(reply.userId) : { id: String(reply.userId) }
});

export const serializeMessage = (message: any) => ({
  id: String(message._id),
  senderId: String(message.senderId?._id || message.senderId),
  receiverId: String(message.receiverId?._id || message.receiverId),
  content: message.content,
  seen: message.seen,
  createdAt: message.createdAt
});

export const objectId = (id: string) => new Types.ObjectId(id);
