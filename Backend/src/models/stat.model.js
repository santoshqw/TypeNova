import mongoose from "mongoose";

const userStatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },

  highestScore: {
    type: Number,
    default: 0,
    min: 0
  },

  averageWPM: {
    type: Number,
    default: 0
  },

  bestWPM: {
    type: Number,
    default: 0
  },

  accuracy: {
    type: Number,
    default: 0,  //percentage 
    min: 0,
    max: 100
  },

  totalTests: {
    type: Number,
    default: 0
  },

  totalTypedWords: {
    type: Number,
    default: 0
  },

  totalErrors: {
    type: Number,
    default: 0
  },

  globalRank: {
    type: Number,
    default: 0
  },

  currentStreak: {
    type: Number,
    default: 0
  },

  longestStreak: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

export default mongoose.model("UserStat", userStatSchema);