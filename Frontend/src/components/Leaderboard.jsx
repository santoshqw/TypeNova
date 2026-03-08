

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import "./LeaderboardGrid.css";

const TIME_MODES = [15, 30, 60, 120];

export default function Leaderboard({ initialMode = 60 }) {
  const [timeMode, setTimeMode] = useState(initialMode);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuth();
  const myEntry = leaderboard.find(
    (entry) => user && (entry.user._id === user.id || entry.user._id === user._id)
  );

  useEffect(() => {
    setLoading(true);
    setError("");
    axios
      .get(`/api/stats/leaderboard?timeMode=${timeMode}`)
      .then((res) => {
        setLeaderboard(res.data.leaderboard || []);
        setLoading(false);
      })
      .catch((err) => {
        let msg = "Failed to load leaderboard";
        if (err.response) {
          msg += `: ${err.response.status} ${err.response.data?.message || err.response.statusText}`;
        } else if (err.request) {
          msg += ": No response from server.";
        } else {
          msg += `: ${err.message}`;
        }
        setError(msg);
        // ...existing code...
        setLoading(false);
      });
  }, [timeMode]);

  return (
    <div className="leaderboard-container w-full">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap justify-center gap-2 mb-3">
          {TIME_MODES.map((mode) => (
            <button
              key={mode}
              className={`px-2 py-1 rounded text-sm font-normal bg-bg border border-main/5 ${mode === timeMode ? "border-main font-semibold bg-main/5" : "hover:bg-main/5"}`}
              onClick={() => setTimeMode(mode)}
            >
              {mode}s
            </button>
          ))}
        </div>
        <div className="overflow-x-auto rounded bg-bg" style={{ minHeight: 320 }}>
          <table className="min-w-full text-sm w-full">
            <thead>
              <tr>
                <th className="py-1 px-2 text-left font-medium">Rank</th>
                <th className="py-1 px-2 text-left font-medium">User</th>
                <th className="py-1 px-2 text-left font-medium">WPM</th>
                <th className="py-1 px-2 text-left font-medium">Achieved</th>
              </tr>
            </thead>
            <tbody style={{ transition: 'opacity 0.3s', opacity: loading ? 0.5 : 1 }}>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-3 text-sub">Loading...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="text-center py-3 text-error">{error}</td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-3 text-sub">No entries yet.</td>
                </tr>
              ) : (
                  leaderboard
                    .filter(entry => entry && entry.rank && entry.user && entry.user.username)
                    .map((entry) => {
                      const isMe = user && (entry.user._id === user.id || entry.user._id === user._id);
                      return (
                        <tr
                          key={entry.user._id + "-" + entry.rank}
                          className={isMe ? "bg-main/10 font-semibold" : ""}
                        >
                          <td className="py-1 px-2">{entry.rank}</td>
                          <td className="py-1 px-2">
                            <span className="truncate max-w-[100px]">{entry.user.username}</span>
                          </td>
                          <td className="py-1 px-2">{entry.bestWPM}</td>
                          <td className="py-1 px-2 text-sub">{new Date(entry.achievedAt).toLocaleString()}</td>
                        </tr>
                      );
                    })
                )}
            </tbody>
          </table>
        </div>
        {myEntry && (
          <div className="my-rank-highlight mt-2 p-1 rounded text-main text-center text-xs">
            <b>Your Rank:</b> {myEntry.rank} &nbsp;|&nbsp; <b>WPM:</b> {myEntry.bestWPM}
          </div>
        )}
      </div>
    </div>
  );
}
