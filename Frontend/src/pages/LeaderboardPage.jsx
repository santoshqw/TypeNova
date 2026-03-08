import React from "react";
import Layout from "../components/Layout";
import Leaderboard from "../components/Leaderboard";


const LeaderboardPage = () => (
  <Layout>
    <div className="flex flex-1 flex-col items-center justify-center min-h-[80vh] bg-bg">
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-main mb-4 text-center">Leaderboard</h1>
        <Leaderboard initialMode={15} />
      </div>
    </div>
  </Layout>
);

export default LeaderboardPage;
