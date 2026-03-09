import UserStat from "../models/stat.model.js";
import Leaderboard from "../models/leaderboard.model.js";

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
      await updateLeaderboard(req.user.id, wpm, duration, accuracy);
    }

    return res.status(200).json({ success: true, stats });
  } catch (error) {
    // ...existing code...
    return res.status(500).json({ success: false, message: error.message });
  }
};



// Properly define updateLeaderboard as an exported async function
export const updateLeaderboard = async (userId, wpm, timeMode, accuracy = 0) => {
  if (![15, 30, 60, 120].includes(timeMode)) return;
  const existing = await Leaderboard.findOne({ user: userId, timeMode });
  if (!existing) {
    await Leaderboard.create({ user: userId, timeMode, bestWPM: wpm, bestAccuracy: accuracy });
  } else if (
    wpm > existing.bestWPM ||
    (wpm === existing.bestWPM && accuracy > (existing.bestAccuracy || 0))
  ) {
    existing.bestWPM = wpm;
    existing.bestAccuracy = accuracy;
    existing.achievedAt = new Date();
    await existing.save();
  }
};


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
      return res.status(500).json({ success: false, message: "Leaderboard DB query error", error: queryError?.message || queryError });
    }
    if (!leaders || leaders.length === 0) {
      return res.status(200).json({ success: true, leaderboard: [] });
    }
    const filteredLeaders = leaders.filter(entry => entry.user && typeof entry.user === 'object' && entry.user.username);
    if (filteredLeaders.length === 0) {
      return res.status(200).json({ success: true, leaderboard: [] });
    }
    let lastWPM = null, lastAcc = null, lastRank = 0, rank = 0;
    const ranked = filteredLeaders.map((entry, i) => {
      let user = entry.user;
      if (entry.bestWPM === lastWPM && entry.bestAccuracy === lastAcc) {
        rank = lastRank;
      } else {
        rank = i + 1;
      }
      lastWPM = entry.bestWPM;
      lastAcc = entry.bestAccuracy;
      lastRank = rank;
      return {
        rank,
        user,
        bestWPM: entry.bestWPM,
        bestAccuracy: entry.bestAccuracy,
        achievedAt: entry.achievedAt,
      };
    });
    return res.status(200).json({ success: true, leaderboard: ranked });
  } catch (error) {
    console.error("getGlobalLeaderboard error:", error);
    return res.status(500).json({ success: false, message: "getGlobalLeaderboard error", error: error?.message || error });
  }
};
