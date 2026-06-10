import { Router } from "express";
import { createReport } from "../controllers/reportController.js";
import { requireAuth } from "../middlewares/auth.js";

export const reportRoutes = Router();

reportRoutes.use(requireAuth);
reportRoutes.post("/", createReport);
