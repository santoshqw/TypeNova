import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";

const TIME_MODES = [15, 30, 60, 120];

export default function Leaderboard({ initialMode = 60 }) {
  const [timeMode, setTimeMode] = useState(initialMode);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuth();
  const myEntry = leaderboard.find((entry) => user && entry.user._id === user.id);

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
        setLoading(false);
      });
  }, [timeMode]);

  return (
    <div className="leaderboard-container">
      <h2>Global Leaderboard</h2>
      <div className="time-mode-switcher">
        {TIME_MODES.map((mode) => (
          <button
            key={mode}
            className={mode === timeMode ? "active" : ""}
            onClick={() => setTimeMode(mode)}
          >
            {mode}s
          </button>
        ))}
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>User</th>
              <th>WPM</th>
              <th>Achieved</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={4}>No entries yet.</td>
              </tr>
            ) : (
              leaderboard.map((entry) => (
                <tr key={entry.user._id + "-" + entry.rank}>
                  <td>{entry.rank}</td>
                  <td>
                    <img
                      src={entry.user.profileImg || "/default-avatar.png"}
                      alt="avatar"
                      style={{ width: 24, height: 24, borderRadius: "50%", marginRight: 8 }}
                    />
                    {entry.user.username}
                  </td>
                  <td>{entry.bestWPM}</td>
                  <td>{new Date(entry.achievedAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      {myEntry && (
        <div className="my-rank-highlight">
          <b>Your Rank:</b> {myEntry.rank} &nbsp;|&nbsp; <b>WPM:</b> {myEntry.bestWPM}
        </div>
      )}
    </div>
  );
}
