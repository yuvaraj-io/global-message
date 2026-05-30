import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5001),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/global-space",
  jwtSecret: process.env.JWT_SECRET || "global-space-dev-secret",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  resendApiKey: process.env.RESEND_API_KEY || "",
  emailFrom: process.env.EMAIL_FROM || "Global Space <noreply@discuss.yuvaraj.io>",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  resetPasswordUrl: process.env.RESET_PASSWORD_URL || "http://localhost:5173/reset-password"
};
