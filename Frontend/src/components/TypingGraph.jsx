import React, { useMemo } from "react";

const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;
const PADDING = 24;

const TypingGraph = ({ data, showAfterComplete }) => {
  const wpmMax = useMemo(() => {
    const highestWpm = Math.max(...data.map((point) => point.wpm), 0);
    return Math.max(20, highestWpm);
  }, [data]);

  const charsMax = useMemo(() => {
    const highestChars = Math.max(...data.map((point) => point.chars), 0);
    return Math.max(20, highestChars);
  }, [data]);

  const toPolyline = (key, maxValue) => {
    if (!data.length) {
      return "";
    }

    const innerWidth = CHART_WIDTH - PADDING * 2;
    const innerHeight = CHART_HEIGHT - PADDING * 2;
    const denominator = Math.max(1, data.length - 1);

    return data
      .map((point, index) => {
        const x = PADDING + (index / denominator) * innerWidth;
        const y =
          CHART_HEIGHT -
          PADDING -
          (Math.min(point[key], maxValue) / maxValue) * innerHeight;

        return `${x},${y}`;
      })
      .join(" ");
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Performance Graph (per second)</h2>
        <div className="flex items-center gap-4 text-xs text-zinc-600">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" /> WPM
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Accuracy
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Chars
          </span>
        </div>
      </div>

      {!showAfterComplete ? (
        <p className="text-sm text-zinc-500">Graph will appear after test completion.</p>
      ) : (
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-44 w-full rounded-lg bg-zinc-50"
          role="img"
          aria-label="Typing speed and accuracy graph"
        >
          <line
            x1={PADDING}
            y1={PADDING}
            x2={CHART_WIDTH - PADDING}
            y2={PADDING}
            stroke="#e4e4e7"
            strokeWidth="1"
          />
          <line
            x1={PADDING}
            y1={CHART_HEIGHT - PADDING}
            x2={CHART_WIDTH - PADDING}
            y2={CHART_HEIGHT - PADDING}
            stroke="#e4e4e7"
            strokeWidth="1"
          />

          <polyline
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={toPolyline("wpm", wpmMax)}
          />

          <polyline
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={toPolyline("accuracy", 100)}
          />

          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={toPolyline("chars", charsMax)}
          />
        </svg>
      )}
    </div>
  );
};

export default TypingGraph;