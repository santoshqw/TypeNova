import mongoose from "mongoose";

const leaderboardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  timeMode: {
    type: Number, // e.g., 15, 30, 60, 120 (seconds)
    required: true,
    enum: [15, 30, 60, 120],
  },
  bestWPM: {
    type: Number,
    required: true,
    min: 0,
  },
  achievedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

leaderboardSchema.index({ timeMode: 1, bestWPM: -1 });
leaderboardSchema.index({ user: 1, timeMode: 1 }, { unique: true });

export default mongoose.model("Leaderboard", leaderboardSchema);
