import React from "react";

const StatBlock = ({ label, value, suffix = "", delay = 0, large = false }) => (
  <div
    className="animate-fade-in"
    style={{ animationDelay: `${delay}ms`, opacity: 0 }}
  >
    <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-sub">
      {label}
    </p>
    <p
      className={`animate-count-up font-semibold leading-none tabular-nums ${
        large ? "text-[2.8rem] text-main sm:text-[3.5rem]" : "text-lg text-text"
      }`}
      style={{ animationDelay: `${delay + 50}ms` }}
    >
      {value}
      {suffix && (
        <span className={large ? "text-xl text-main sm:text-2xl" : "text-sm text-sub"}>
          {suffix}
        </span>
      )}
    </p>
  </div>
);

const TypingStats = ({ time, raw, correct = 0, incorrect = 0, extra = 0, missed = 0 }) => {
  return (
    <div className="mt-4">
      {/* ── Secondary stats row ── */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 sm:gap-x-10">
        <StatBlock label="test type" value={`time ${time}`} delay={160} />
        {raw !== undefined && (
          <StatBlock label="raw" value={raw} delay={200} />
        )}
        <StatBlock
          label="characters"
          value={
            <span className="flex items-center gap-1">
              <span className="text-text">{correct}</span>
              <span className="text-sub">/</span>
              <span className="text-error">{incorrect}</span>
              <span className="text-sub">/</span>
              <span className="text-sub-alt">{extra}</span>
              <span className="text-sub">/</span>
              <span className="text-sub">{missed}</span>
            </span>
          }
          delay={240}
        />
        <StatBlock label="time" value={`${time}s`} delay={280} />
      </div>
    </div>
  );
};

export default TypingStats;