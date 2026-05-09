import { Post } from "../models/Post.js";
import { Reply } from "../models/Reply.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializePost, serializeReply } from "../utils/serializers.js";

export const getPosts = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 15, 40);
  const cursor = req.query.cursor ? new Date(String(req.query.cursor)) : null;
  const filter = cursor ? { createdAt: { $lt: cursor } } : {};
  const posts = await Post.find(filter).sort({ createdAt: -1 }).limit(limit + 1).populate("userId");
  const hasMore = posts.length > limit;
  const page = posts.slice(0, limit);
  res.json({
    items: page.map(serializePost),
    nextCursor: hasMore ? page[page.length - 1]?.createdAt : null
  });
});

export const createPost = asyncHandler(async (req, res) => {
  const post = await Post.create({ content: req.body.content, userId: req.user!.id });
  await post.populate("userId");
  res.status(201).json({ post: serializePost(post) });
});

export const getPostReplies = asyncHandler(async (req, res) => {
  const replies = await Reply.find({ postId: req.params.postId }).sort({ createdAt: 1 }).populate("userId");
  res.json({ replies: replies.map(serializeReply) });
});

export const createReply = asyncHandler(async (req, res) => {
  const reply = await Reply.create({
    content: req.body.content,
    postId: req.params.postId,
    parentReplyId: req.body.parentReplyId || null,
    userId: req.user!.id
  });
  await Post.findByIdAndUpdate(req.params.postId, { $inc: { repliesCount: 1 } });
  await reply.populate("userId");
  res.status(201).json({ reply: serializeReply(reply) });
});
