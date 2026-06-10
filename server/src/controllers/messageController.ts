import mongoose from "mongoose";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { serializeMessage, serializeUser } from "../utils/serializers.js";

export const getConversations = asyncHandler(async (req, res) => {
  const me = new mongoose.Types.ObjectId(req.user!.id);
  const rows = await Message.aggregate([
    { $match: { $or: [{ senderId: me }, { receiverId: me }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: {
          $cond: [{ $eq: ["$senderId", me] }, "$receiverId", "$senderId"]
        },
        latest: { $first: "$$ROOT" },
        unread: {
          $sum: {
            $cond: [{ $and: [{ $eq: ["$receiverId", me] }, { $eq: ["$seen", false] }] }, 1, 0]
          }
        }
      }
    },
    { $sort: { "latest.createdAt": -1 } }
  ]);

  const meDoc = await User.findById(req.user!.id).select("blockedUsers");
  const blocked = new Set((meDoc?.blockedUsers || []).map((id) => String(id)));
  const visibleRows = rows.filter((row) => !blocked.has(String(row._id)));

  const users = await User.find({ _id: { $in: visibleRows.map((row) => row._id) } });
  res.json({
    conversations: visibleRows.map((row) => ({
      user: serializeUser(users.find((user) => String(user._id) === String(row._id))),
      latest: serializeMessage(row.latest),
      unread: row.unread
    }))
  });
});

export const getThread = asyncHandler(async (req, res) => {
  const other = await User.findOne({ username: String(req.params.username).toLowerCase() });
  if (!other) return res.status(404).json({ message: "User not found" });

  const messages = await Message.find({
    $or: [
      { senderId: req.user!.id, receiverId: other._id },
      { senderId: other._id, receiverId: req.user!.id }
    ]
  }).sort({ createdAt: 1 });

  await Message.updateMany({ senderId: other._id, receiverId: req.user!.id, seen: false }, { seen: true });
  res.json({ user: serializeUser(other), messages: messages.map(serializeMessage) });
});
