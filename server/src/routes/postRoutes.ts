import { Router } from "express";
import { createPost, createReply, deletePost, deleteReply, getPostReplies, getPosts } from "../controllers/postController.js";
import { requireAuth } from "../middlewares/auth.js";

export const postRoutes = Router();

postRoutes.use(requireAuth);
postRoutes.get("/", getPosts);
postRoutes.post("/", createPost);
postRoutes.delete("/:postId", deletePost);
postRoutes.get("/:postId/replies", getPostReplies);
postRoutes.post("/:postId/replies", createReply);
postRoutes.delete("/:postId/replies/:replyId", deleteReply);
