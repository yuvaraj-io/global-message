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

  const me = await User.findById(req.user!.id).select("blockedUsers");
  const isBlocked = Boolean(me?.blockedUsers?.some((id) => String(id) === String(user._id)));

  const [posts, replies, discussions] = await Promise.all([
    Post.find({ userId: user._id }).sort({ createdAt: -1 }).limit(30).populate("userId"),
    Reply.find({ userId: user._id }).sort({ createdAt: -1 }).limit(30).populate("userId"),
    Discussion.find({ userId: user._id }).sort({ latestActivityAt: -1 }).limit(30)
  ]);

  res.json({
    user: serializeUser(user),
    isBlocked,
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

export const updateProfile = asyncHandler(async (req, res) => {
  const bio = String(req.body.bio || "").trim().slice(0, 160);
  const avatar = String(req.body.avatar || "").trim();

  if (avatar && !avatar.startsWith("data:image/") && !avatar.startsWith("http")) {
    return res.status(400).json({ message: "Avatar must be an image upload or URL" });
  }

  const update: Record<string, any> = { bio };
  if (avatar) update.avatar = avatar;

  // Username change
  if (req.body.username !== undefined) {
    const newUsername = String(req.body.username).trim().toLowerCase();
    if (!/^[a-z0-9_]+$/.test(newUsername) || newUsername.length < 3 || newUsername.length > 24) {
      return res.status(400).json({ message: "Username must be 3-24 characters (lowercase letters, numbers, underscores)." });
    }
    const taken = await User.findOne({ username: newUsername, _id: { $ne: req.user!.id } });
    if (taken) return res.status(409).json({ message: "Username is already taken." });

    // Optional 30-day cooldown
    const current = await User.findById(req.user!.id).select("usernameChangedAt username");
    if (current && current.username !== newUsername && current.usernameChangedAt) {
      const daysSince = (Date.now() - new Date(current.usernameChangedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) {
        return res.status(429).json({ message: `You can change your username again in ${Math.ceil(30 - daysSince)} days.` });
      }
    }

    update.username = newUsername;
    update.usernameChangedAt = new Date();
  }

  const user = await User.findByIdAndUpdate(req.user!.id, update, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json({ user: serializeUser(user) });
});

export const blockUser = asyncHandler(async (req, res) => {
  const target = await User.findOne({ username: String(req.params.username).toLowerCase() });
  if (!target) return res.status(404).json({ message: "User not found" });
  if (String(target._id) === req.user!.id) {
    return res.status(400).json({ message: "You cannot block yourself" });
  }

  await User.findByIdAndUpdate(req.user!.id, { $addToSet: { blockedUsers: target._id } });
  res.json({ message: `You have blocked @${target.username}.`, blocked: true });
});

export const unblockUser = asyncHandler(async (req, res) => {
  const target = await User.findOne({ username: String(req.params.username).toLowerCase() });
  if (!target) return res.status(404).json({ message: "User not found" });

  await User.findByIdAndUpdate(req.user!.id, { $pull: { blockedUsers: target._id } });
  res.json({ message: `You have unblocked @${target.username}.`, blocked: false });
});
