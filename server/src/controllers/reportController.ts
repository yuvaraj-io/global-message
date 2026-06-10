import { Types } from "mongoose";
import { Report, REPORT_REASONS, REPORT_TARGET_TYPES } from "../models/Report.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createReport = asyncHandler(async (req, res) => {
  const { targetType, targetId, reason } = req.body || {};
  const details = String(req.body?.details || "").trim().slice(0, 1000);
  const targetUsername = String(req.body?.targetUsername || "").trim().toLowerCase();

  if (!REPORT_TARGET_TYPES.includes(targetType)) {
    return res.status(400).json({ message: "Invalid report target type" });
  }
  if (!REPORT_REASONS.includes(reason)) {
    return res.status(400).json({ message: "Invalid report reason" });
  }
  if (!targetId || !Types.ObjectId.isValid(String(targetId))) {
    return res.status(400).json({ message: "A valid target id is required" });
  }

  await Report.create({
    reporterId: req.user!.id,
    targetType,
    targetId: new Types.ObjectId(String(targetId)),
    targetUsername,
    reason,
    details
  });

  res.status(201).json({ message: "Report submitted. Thank you for helping keep Global Space safe." });
});
