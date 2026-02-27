import UserStat from "../models/stat.model.js";
import Leaderboard from "../models/leaderboard.model.js";

/**
 * GET /api/stats
 * Returns the logged-in user's typing stats (creates a fresh doc if none exists).
 */
export const getStats = async (req, res) => {
  try {
    let stats = await UserStat.findOne({ user: req.user.id });

    if (!stats) {
      stats = await UserStat.create({ user: req.user.id });
    }

    return res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error("getStats error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/stats/save
 * Saves a single test result and updates running averages.
 * Body: { wpm, rawWpm, accuracy, correct, incorrect, duration }
 */
export const saveTestResult = async (req, res) => {
  try {
    const { wpm, rawWpm, accuracy, correct, incorrect, duration } = req.body;

    let stats = await UserStat.findOne({ user: req.user.id });

    if (!stats) {
      stats = await UserStat.create({ user: req.user.id });
    }

    // Running average WPM
    const prevTotal = stats.averageWPM * stats.totalTests;
    stats.totalTests += 1;
    stats.averageWPM = Math.round((prevTotal + wpm) / stats.totalTests);

    // Best WPM
    if (wpm > stats.bestWPM) stats.bestWPM = wpm;

    // Highest score (same as bestWPM for now)
    if (wpm > stats.highestScore) stats.highestScore = wpm;

    // Running average accuracy
    const prevAccTotal = stats.accuracy * (stats.totalTests - 1);
    stats.accuracy = Math.round((prevAccTotal + accuracy) / stats.totalTests);

    // Totals
    stats.totalTypedWords += Math.round((correct + incorrect) / 5);
    stats.totalErrors += incorrect;

    // Streak: bump if accuracy >= 80%, otherwise reset
    if (accuracy >= 80) {
      stats.currentStreak += 1;
      if (stats.currentStreak > stats.longestStreak) {
        stats.longestStreak = stats.currentStreak;
      }
    } else {
      stats.currentStreak = 0;
    }

    await stats.save();

    // Update global leaderboard for the time mode if provided
    if (typeof duration === "number" && [15,30,60,120].includes(duration)) {
      await updateLeaderboard(req.user.id, wpm, duration);
    }

    return res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error("saveTestResult error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Save or update leaderboard entry for a user in a specific time mode
export const updateLeaderboard = async (userId, wpm, timeMode) => {
  if (![15, 30, 60, 120].includes(timeMode)) return;
  const existing = await Leaderboard.findOne({ user: userId, timeMode });
  if (!existing) {
    await Leaderboard.create({ user: userId, timeMode, bestWPM: wpm });
  } else if (wpm > existing.bestWPM) {
    existing.bestWPM = wpm;
    existing.achievedAt = new Date();
    await existing.save();
  }
};

// Get global leaderboard for a time mode
export const getGlobalLeaderboard = async (req, res) => {
  try {
    const { timeMode = 60, limit = 100 } = req.query;
    if (!["15","30","60","120",15,30,60,120].includes(timeMode)) {
      return res.status(400).json({ success: false, message: "Invalid time mode" });
    }
    const mode = Number(timeMode);
    let leaders = [];
    try {
      leaders = await Leaderboard.find({ timeMode: mode })
        .populate("user", "username profileImg")
        .sort({ bestWPM: -1, achievedAt: 1 })
        .limit(Number(limit));
    } catch (queryError) {
      console.error("Leaderboard query error:", queryError);
      // Return empty leaderboard on query error
      return res.status(200).json({ success: true, leaderboard: [] });
    }
    if (!leaders || leaders.length === 0) {
      console.log("No leaderboard entries for mode", mode);
      return res.status(200).json({ success: true, leaderboard: [] });
    }
    // Assign ranks, handle ties
    let lastWPM = null, lastRank = 0, rank = 0;
    const ranked = leaders.map((entry, i) => {
      // Defensive: fallback if user is not populated
      let user = entry.user;
      if (!user || !user.username) {
        user = { username: "Unknown", profileImg: "" };
      }
      rank = (entry.bestWPM === lastWPM) ? lastRank : i + 1;
      lastWPM = entry.bestWPM;
      lastRank = rank;
      return {
        rank,
        user,
        bestWPM: entry.bestWPM,
        achievedAt: entry.achievedAt,
      };
    });
    return res.status(200).json({ success: true, leaderboard: ranked });
  } catch (error) {
    console.error("getGlobalLeaderboard error:", error);
    return res.status(200).json({ success: true, leaderboard: [] });
  }
};
