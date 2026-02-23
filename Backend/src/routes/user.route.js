import express from "express";
import {
  signupUser,
  loginUser,
  logoutUser,
} from "../controllers/user.controller.js";
//middleware to check user is logged in or not.
import { isLoggedIn } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/profile", isLoggedIn, getProfile);

export default router;
