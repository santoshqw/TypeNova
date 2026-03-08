import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndCookie.js";
import getUserModel from "../models/user.model.js";

export const signupUser = async (req, res) => {
  try {
    const User = getUserModel();
    const { username, fullName, email, password } = req.body;

    // Validation
    if (!username || !fullName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Make the first user or a specific username admin
    let isAdmin = false;
    const userCount = await User.countDocuments();
    if (userCount === 0 || username === "admin") {
      isAdmin = true;
    }

    // Create new user
    const newUser = new User({
      username,
      fullName,
      email,
      password: hashedPassword,
      isAdmin,
    });

    await newUser.save();

    generateTokenAndSetCookie(newUser._id, res);

    // Return user data (without password)
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const User = getUserModel();
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user) {
      generateTokenAndSetCookie(user._id, res);
    }

    // Return user data (without password)
    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const logoutUser = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    // ...existing code...
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const User = getUserModel();
    const id = req.user.id;
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const userInfo = {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email
    };

    return res.status(200).json({
      success: true,
      user: userInfo
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};