import express from "express";
import { getStats, saveTestResult, getGlobalLeaderboard } from "../controllers/stat.controller.js";
import { isLoggedIn } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", isLoggedIn, getStats);
router.post("/save", isLoggedIn, saveTestResult);
router.get("/leaderboard", getGlobalLeaderboard);

export default router;
