import { Router } from "express";
import { createPost, createReply, getPostReplies, getPosts } from "../controllers/postController.js";
import { requireAuth } from "../middlewares/auth.js";

export const postRoutes = Router();

postRoutes.use(requireAuth);
postRoutes.get("/", getPosts);
postRoutes.post("/", createPost);
postRoutes.get("/:postId/replies", getPostReplies);
postRoutes.post("/:postId/replies", createReply);
