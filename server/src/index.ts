import express from "express";
import cors from "cors";
import morgan from "morgan";
import http from "http";

import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

import { authRoutes } from "./routes/authRoutes.js";
import { postRoutes } from "./routes/postRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";
import { messageRoutes } from "./routes/messageRoutes.js";
import { reportRoutes } from "./routes/reportRoutes.js";

import { errorHandler } from "./middlewares/error.js";
import { createSocketServer } from "./socket/index.js";

const app = express();
const server = http.createServer(app);

/**
 * CORS
 * For Expo + React Native development
 * allowing all origins is easiest.
 */
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

/**
 * Middlewares
 */
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

/**
 * Health Check
 */
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    name: "Global Space API",
  });
});

/**
 * Routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/reports", reportRoutes);

/**
 * Error Handler
 */
app.use(errorHandler);

/**
 * Socket Server
 */
createSocketServer(server);

/**
 * Database Connection + Server Start
 */
connectDb()
  .then(() => {
    server.listen(env.port, "0.0.0.0", () => {
      console.log(`🚀 Global Space API listening on :${env.port}`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to start server", error);
    process.exit(1);
  });