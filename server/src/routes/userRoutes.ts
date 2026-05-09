import { Router } from "express";
import { getProfile, searchUsers, updateProfile } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/auth.js";

export const userRoutes = Router();

userRoutes.use(requireAuth);
userRoutes.patch("/me", updateProfile);
userRoutes.get("/search", searchUsers);
userRoutes.get("/:username", getProfile);
