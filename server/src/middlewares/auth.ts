import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.js";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) return res.status(401).json({ message: "Authentication required" });

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
