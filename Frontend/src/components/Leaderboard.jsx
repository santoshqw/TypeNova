
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
        console.log(err);
        setLoading(false);
      });
  }, [timeMode]);

  return (
    <div className="leaderboard-container">
      <h2>Global Leaderboard</h2>
      <div className="time-mode-switcher" style={{ position: 'sticky', top: 0, zIndex: 2, background: '#18181b' }}>
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
      <div style={{ minHeight: 360, overflow: "auto" }}>
        <table className="leaderboard-table">
          <thead style={{ position: 'sticky', top: 36, background: '#18181b', zIndex: 1 }}>
            <tr>
              <th>Rank</th>
              <th>User</th>
              <th>WPM</th>
              <th>Achieved</th>
            </tr>
          </thead>
          <tbody style={{ transition: 'opacity 0.3s', opacity: loading ? 0.5 : 1 }}>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center' }}>Loading...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={4} style={{ color: 'red', textAlign: 'center' }}>{error}</td>
              </tr>
            ) : leaderboard.length === 0 ? (
              <tr>
                <td colSpan={4}>No entries yet.</td>
              </tr>
            ) : (
              leaderboard.map((entry) => {
                const isMe = user && (entry.user._id === user.id || entry.user._id === user._id);
                return (
                  <tr
                    key={entry.user._id + "-" + entry.rank}
                    className={isMe ? "my-leaderboard-row" : ""}
                  >
                    <td>{entry.rank}</td>
                    <td>
                      {entry.user.profileImg && entry.user.profileImg.trim() !== "" ? (
                        <img
                          src={entry.user.profileImg}
                          alt="avatar"
                          style={{ width: 24, height: 24, borderRadius: "50%", marginRight: 8 }}
                        />
                      ) : null}
                      {entry.user.username}
                    </td>
                    <td>{entry.bestWPM}</td>
                    <td>{new Date(entry.achievedAt).toLocaleString()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {myEntry && (
        <div className="my-rank-highlight">
          <b>Your Rank:</b> {myEntry.rank} &nbsp;|&nbsp; <b>WPM:</b> {myEntry.bestWPM}
        </div>
      )}
    </div>
  );
}
