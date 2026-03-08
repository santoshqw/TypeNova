// Script to find invalid leaderboard entries (user references that do not exist)
import mongoose from "mongoose";
import Leaderboard from "./src/models/leaderboard.model.js";
import User from "./src/models/user.model.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/typenova";

async function findInvalidLeaderboardEntries() {
  await mongoose.connect(MONGO_URI);
  const allEntries = await Leaderboard.find({});
  let invalid = [];
  for (const entry of allEntries) {
    const user = await User.findById(entry.user);
    if (!user) {
      invalid.push(entry);
    }
  }
  if (invalid.length === 0) {
    // ...existing code...
  } else {
    // ...existing code...
    // ...existing code...
  }
  await mongoose.disconnect();
}

findInvalidLeaderboardEntries();
