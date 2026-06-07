import { Router } from "express";
import { deleteAccount, forgotPassword, googleAuth, login, logout, me, register, resetPassword } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/auth.js";

export const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.post("/logout", requireAuth, logout);
authRoutes.get("/me", requireAuth, me);
authRoutes.post("/forgot-password", forgotPassword);
authRoutes.post("/reset-password", resetPassword);
authRoutes.post("/google", googleAuth);
authRoutes.delete("/account", requireAuth, deleteAccount);
