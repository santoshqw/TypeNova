import React from "react";

const TypingStats = ({ timeLeft, wpm, accuracy, isFinished }) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center shadow-sm">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Time</p>
        <p className="text-2xl font-semibold text-zinc-900">{timeLeft}s</p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center shadow-sm">
        <p className="text-xs uppercase tracking-wide text-zinc-500">WPM</p>
        <p className="text-2xl font-semibold text-zinc-900">{isFinished ? wpm : "--"}</p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center shadow-sm">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Accuracy</p>
        <p className="text-2xl font-semibold text-zinc-900">{isFinished ? `${accuracy}%` : "--"}</p>
      </div>
    </div>
  );
};

export default TypingStats;