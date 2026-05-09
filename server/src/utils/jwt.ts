import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtPayload = {
  id: string;
  username: string;
};

export const signToken = (payload: JwtPayload) => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
};
