import { Router } from "express";
import { getProfile, searchUsers } from "../controllers/userController.js";
import { requireAuth } from "../middlewares/auth.js";

export const userRoutes = Router();

userRoutes.use(requireAuth);
userRoutes.get("/search", searchUsers);
userRoutes.get("/:username", getProfile);
