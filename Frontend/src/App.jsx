import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/user/ProfilePage";
import MultiplayerPage from "./pages/MultiplayerPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AdminAddText from "./pages/AdminAddText";


const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/multiplayer" element={<MultiplayerPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="/admin/add-text" element={<AdminAddText />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;