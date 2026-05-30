import crypto from "crypto";

export const generateSessionToken = () => crypto.randomBytes(32).toString("hex");

export const generateResetToken = () => crypto.randomBytes(20).toString("hex");

export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
