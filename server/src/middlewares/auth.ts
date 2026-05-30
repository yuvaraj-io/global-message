import { NextFunction, Request, Response } from "express";
import { User } from "../models/User.js";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) return res.status(401).json({ message: "Authentication required" });

  try {
    const user = await User.findOne({ sessionToken: token }).select("_id username sessionToken");
    if (!user) return res.status(401).json({ message: "Session expired. Please log in again." });

    req.user = { id: String(user._id), username: user.username };
    next();
  } catch {
    res.status(401).json({ message: "Invalid session" });
  }
};
