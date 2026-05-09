import { Router } from "express";
import { getConversations, getThread } from "../controllers/messageController.js";
import { requireAuth } from "../middlewares/auth.js";

export const messageRoutes = Router();

messageRoutes.use(requireAuth);
messageRoutes.get("/conversations", getConversations);
messageRoutes.get("/:username", getThread);
