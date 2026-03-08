import express from "express";
import getTypingTextController from "../controllers/TypingText.controller.js";
import { isLoggedIn } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";
import TypingText from "../models/typingText.model.js";

const router = express.Router();
const { createTypingText } = getTypingTextController();

// Only admin can add typing text
router.post("/add", isLoggedIn, isAdmin, createTypingText);

// Public: Get all typing texts
router.get("/list", async (req, res) => {
  try {
    const texts = await TypingText.find({}, { text: 1, _id: 0 });
    res.json(texts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch typing texts" });
  }
});

export default router;
