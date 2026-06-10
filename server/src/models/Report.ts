import mongoose from "mongoose";

export const REPORT_TARGET_TYPES = ["post", "reply", "message", "user"] as const;
export const REPORT_REASONS = [
  "child_safety",
  "harassment",
  "spam",
  "nudity",
  "violence",
  "hate",
  "other"
] as const;

const reportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: { type: String, enum: REPORT_TARGET_TYPES, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetUsername: { type: String, default: "" },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, trim: true, maxlength: 1000, default: "" },
    status: { type: String, enum: ["open", "reviewed", "actioned"], default: "open", index: true }
  },
  { timestamps: true }
);

reportSchema.index({ targetType: 1, targetId: 1 });

export const Report = mongoose.model("Report", reportSchema);
