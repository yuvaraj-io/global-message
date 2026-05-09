import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    content: { type: String, required: true, trim: true, minlength: 1, maxlength: 420 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    repliesCount: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });

export const Post = mongoose.model("Post", postSchema);
