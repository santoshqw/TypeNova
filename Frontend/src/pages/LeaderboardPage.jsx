import React from "react";
import Layout from "../components/Layout";
import Leaderboard from "../components/Leaderboard";

const LeaderboardPage = () => (
  <Layout>
    <div className="flex flex-1 flex-col items-center justify-center animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>
      <div className="w-full max-w-2xl mx-auto">
        <Leaderboard />
      </div>
    </div>
  </Layout>
);

export default LeaderboardPage;
