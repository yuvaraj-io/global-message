import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 420 },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    parentReplyId: { type: mongoose.Schema.Types.ObjectId, ref: "Reply", default: null, index: true }
  },
  { timestamps: true }
);

replySchema.index({ postId: 1, createdAt: 1 });
replySchema.index({ userId: 1, createdAt: -1 });

export const Reply = mongoose.model("Reply", replySchema);
