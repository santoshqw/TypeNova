import React from "react";
import Layout from "../components/Layout";
import Leaderboard from "../components/Leaderboard";
import { useAuth } from "../hooks/useAuth.jsx";

const LeaderboardPage = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center mt-10 text-sub">Checking authentication...</div>;
  if (!user) {
    return (
      <Layout>
        <div className="flex flex-1 flex-col items-center justify-center min-h-[80vh] bg-bg">
          <div className="w-full max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-main mb-4 text-center">Leaderboard</h1>
            <div className="text-center text-error">You must be logged in to view the leaderboard.</div>
          </div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="flex flex-1 flex-col items-center justify-center min-h-[80vh] bg-bg">
        <div className="w-full max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-main mb-4 text-center">Leaderboard</h1>
          <Leaderboard initialMode={15} />
        </div>
      </div>
    </Layout>
  );
};

export default LeaderboardPage;
