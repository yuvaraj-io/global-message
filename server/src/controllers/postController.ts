import { Types } from "mongoose";
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

export const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId).populate("userId");
  if (!post) return res.status(404).json({ message: "Post not found" });
  res.json({ post: serializePost(post) });
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

export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ _id: req.params.postId, userId: req.user!.id });
  if (!post) return res.status(404).json({ message: "Post not found or not owned by you" });

  await Promise.all([Reply.deleteMany({ postId: post._id }), post.deleteOne()]);
  res.json({ id: req.params.postId });
});

export const deleteReply = asyncHandler(async (req, res) => {
  const reply = await Reply.findOne({ _id: req.params.replyId, postId: req.params.postId, userId: req.user!.id });
  if (!reply) return res.status(404).json({ message: "Reply not found or not owned by you" });

  const descendantIds = await collectReplyDescendants(String(reply._id));
  const idsToDelete = [reply._id, ...descendantIds];
  await Reply.deleteMany({ _id: { $in: idsToDelete } });
  await Post.findByIdAndUpdate(req.params.postId, { $inc: { repliesCount: -idsToDelete.length } });

  res.json({ id: req.params.replyId, deletedIds: idsToDelete.map(String), postId: req.params.postId });
});

const collectReplyDescendants = async (replyId: string): Promise<Types.ObjectId[]> => {
  const children = await Reply.find({ parentReplyId: replyId }).select("_id");
  const nested: Types.ObjectId[][] = await Promise.all(children.map((child) => collectReplyDescendants(String(child._id))));
  return [...children.map((child) => child._id as Types.ObjectId), ...nested.flat()];
};
