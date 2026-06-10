import { Router } from "express";
import { blockUser, getProfile, searchUsers, unblockUser, updateProfile } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/auth.js";

export const userRoutes = Router();

userRoutes.use(requireAuth);
userRoutes.patch("/me", updateProfile);
userRoutes.get("/search", searchUsers);
userRoutes.post("/:username/block", blockUser);
userRoutes.delete("/:username/block", unblockUser);
userRoutes.get("/:username", getProfile);
