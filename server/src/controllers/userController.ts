import { Discussion } from "../models/Discussion.js";
import { Post } from "../models/Post.js";
import { Reply } from "../models/Reply.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializePost, serializeReply, serializeUser } from "../utils/serializers.js";

export const searchUsers = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  if (!q) return res.json({ users: [] });

  const users = await User.find({ username: { $regex: q, $options: "i" } }).limit(12);
  res.json({ users: users.map(serializeUser) });
});

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: String(req.params.username).toLowerCase() });
  if (!user) return res.status(404).json({ message: "Profile not found" });

  const [posts, replies, discussions] = await Promise.all([
    Post.find({ userId: user._id }).sort({ createdAt: -1 }).limit(30).populate("userId"),
    Reply.find({ userId: user._id }).sort({ createdAt: -1 }).limit(30).populate("userId"),
    Discussion.find({ userId: user._id }).sort({ latestActivityAt: -1 }).limit(30)
  ]);

  res.json({
    user: serializeUser(user),
    posts: posts.map(serializePost),
    replies: replies.map(serializeReply),
    discussions: discussions.map((discussion) => ({
      id: String(discussion._id),
      title: discussion.title,
      content: discussion.content,
      repliesCount: discussion.repliesCount,
      createdAt: discussion.createdAt,
      latestActivityAt: discussion.latestActivityAt
    })),
    activity: [...posts, ...replies].sort((a, b) => +b.createdAt - +a.createdAt).slice(0, 10)
  });
});
