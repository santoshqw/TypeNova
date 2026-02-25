import React from "react";

const StatBlock = ({ label, value, suffix = "", delay = 0, large = false }) => (
  <div
    className="animate-fade-in"
    style={{ animationDelay: `${delay}ms`, opacity: 0 }}
  >
    <p
      className="mb-1 text-xs font-medium tracking-wide"
      style={{ color: "var(--sub-color)", letterSpacing: "0.08em" }}
    >
      {label}
    </p>
    <p
      className={`animate-count-up font-semibold leading-none tabular-nums ${
        large ? "text-[3.5rem]" : "text-lg"
      }`}
      style={{
        color: large ? "var(--main-color)" : "var(--text-color)",
        animationDelay: `${delay + 50}ms`,
      }}
    >
      {value}
      {suffix && (
        <span
          className={large ? "text-2xl" : "text-sm"}
          style={{ color: large ? "var(--main-color)" : "var(--sub-color)" }}
        >
          {suffix}
        </span>
      )}
    </p>
  </div>
);

const TypingStats = ({ wpm, accuracy, time, raw, characters }) => {
  const incorrect = characters
    ? Math.max(0, characters - Math.round((characters * accuracy) / 100))
    : 0;
  const correct = characters ? characters - incorrect : 0;

  return (
    <div>
      {/* ── Primary stats: big WPM + ACC ── */}
      <div className="mb-6 flex items-end gap-10">
        <StatBlock label="wpm" value={wpm} large delay={0} />
        <StatBlock label="acc" value={accuracy} suffix="%" large delay={80} />
      </div>

      {/* ── Divider ── */}
      <div
        className="mb-5 h-px w-full animate-fade-in"
        style={{
          background:
            "linear-gradient(90deg, var(--sub-alt-color) 0%, #3a3c3f 50%, var(--sub-alt-color) 100%)",
          animationDelay: "150ms",
          opacity: 0,
        }}
      />

      {/* ── Secondary stats row ── */}
      <div className="flex flex-wrap gap-x-10 gap-y-3">
        <StatBlock label="test type" value={`time ${time}`} delay={160} />
        {raw !== undefined && (
          <StatBlock label="raw" value={raw} delay={200} />
        )}
        {characters !== undefined && (
          <StatBlock
            label="characters"
            value={
              <span className="flex items-center gap-1">
                <span style={{ color: "var(--text-color)" }}>{correct}</span>
                <span style={{ color: "var(--sub-color)" }}>/</span>
                <span style={{ color: "var(--error-color)" }}>{incorrect}</span>
                <span style={{ color: "var(--sub-color)" }}>/</span>
                <span style={{ color: "var(--sub-color)" }}>0</span>
                <span style={{ color: "var(--sub-color)" }}>/</span>
                <span style={{ color: "var(--sub-color)" }}>0</span>
              </span>
            }
            delay={240}
          />
        )}
        <StatBlock label="time" value={`${time}s`} delay={280} />
      </div>
    </div>
  );
};

export default TypingStats;
