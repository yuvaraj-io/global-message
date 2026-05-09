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
import { errorHandler } from "./middlewares/error.js";
import { createSocketServer } from "./socket/index.js";

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true, name: "Global Space API" }));
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use(errorHandler);

createSocketServer(server);

connectDb()
  .then(() => {
    server.listen(env.port, () => console.log(`Global Space API listening on :${env.port}`));
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
