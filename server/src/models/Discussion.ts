import mongoose from "mongoose";

const discussionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    content: { type: String, required: true, trim: true, maxlength: 1200 },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    repliesCount: { type: Number, default: 0, min: 0 },
    latestActivityAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

discussionSchema.index({ createdAt: -1 });
discussionSchema.index({ userId: 1, latestActivityAt: -1 });

export const Discussion = mongoose.model("Discussion", discussionSchema);
