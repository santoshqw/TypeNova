import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  Scatter,
  ComposedChart,
  ReferenceLine,
} from "recharts";

/* ──────────────────────────── Custom Tooltip ──────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-lg border border-white/10 bg-zinc-900/80 px-4 py-3 text-xs shadow-xl backdrop-blur-sm"
    >
      <p
        className="mb-2 border-b border-white/10 pb-1.5 font-mono text-[10px] font-medium text-zinc-400"
      >
        {label}s
      </p>
      {payload
        .filter((entry) => entry.value != null)
        .map((entry) => (
          <div
            key={entry.name}
            className="flex items-center justify-between gap-6 py-[3px]"
          >
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-[6px] w-[6px] rounded-full"
                style={{
                  background: entry.color,
                  boxShadow: `0 0 6px ${entry.color}66`,
                }}
              />
              <span className="text-zinc-300">{entry.name}</span>
            </span>
            <span
              className="font-mono font-semibold tabular-nums text-zinc-100"
            >
              {entry.value}
            </span>
          </div>
        ))}
    </div>
  );
};

/* ──────────────────────────── Error Dot ──────────────────────────── */
const ErrorDot = (props) => {
  const { cx, cy, payload } = props;
  if (!payload?.errors || payload.errors === 0) return null;

  const size = Math.min(3 + payload.errors * 1.5, 8);

  return (
    <g>
      {/* Outer glow */}
      <circle cx={cx} cy={cy} r={size + 4} fill="#f43f5e" opacity={0.08} />
      {/* Mid ring */}
      <circle cx={cx} cy={cy} r={size + 1.5} fill="#f43f5e" opacity={0.2} />
      {/* Core dot */}
      <circle cx={cx} cy={cy} r={size} fill="#f43f5e" opacity={0.85} />
      {/* Count label for multi-errors */}
      {payload.errors > 1 && (
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize={size > 5 ? 8 : 7}
          fontWeight={600}
          fontFamily="Roboto Mono, monospace"
        >
          {payload.errors}
        </text>
      )}
    </g>
  );
};

/* ──────────────────────────── Animated Active Dot ──────────────────────────── */
const ActiveDot = ({ cx, cy, stroke }) => (
  <g>
    <circle cx={cx} cy={cy} r={8} fill={stroke} opacity={0.12} />
    <circle cx={cx} cy={cy} r={5} fill="#18181b" stroke={stroke} strokeWidth={2.5} />
  </g>
);

/* ──────────────────────────── Main Graph ──────────────────────────── */
const TypingGraph = ({ data, showAfterComplete }) => {
  if (!showAfterComplete || !data?.length) return null;

  const maxWpm = Math.max(...data.map((d) => Math.max(d.wpm || 0, d.raw || 0)));
  const yMax = Math.ceil(maxWpm / 20) * 20 + 20;

  const avgWpm = useMemo(() => {
    if (!data.length) return 0;
    return Math.round(data.reduce((sum, d) => sum + (d.wpm || 0), 0) / data.length);
  }, [data]);

  const totalErrors = useMemo(
    () => data.reduce((sum, d) => sum + (d.errors || 0), 0),
    [data]
  );

  return (
    <div
      className="mt-8 animate-fade-in"
      style={{ animationDelay: "300ms", opacity: 0 }}
    >
      {/* ── Header row: legend left, summary right ── */}
      <div className="mb-4 flex items-center justify-between">
        {/* Legend */}
        <div className="flex items-center gap-5 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-1 w-5 rounded-full bg-amber-400"
              style={{ boxShadow: "0 0 6px #facc1566" }}
            />
            wpm
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-1 w-5 rounded-full bg-zinc-500"
            />
            raw
          </span>
          {totalErrors > 0 && (
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full bg-rose-500"
                style={{ boxShadow: "0 0 4px #f43f5e66" }}
              />
              errors
            </span>
          )}
        </div>

        {/* Avg chip */}
        <div
          className="flex items-center gap-2 rounded-md bg-amber-400/10 px-2.5 py-1 text-xs text-amber-400"
        >
          <span className="text-zinc-400">avg</span>
          <span className="font-mono font-semibold tabular-nums">{avgWpm}</span>
          <span className="text-zinc-400">wpm</span>
        </div>
      </div>

      {/* ── Chart container ── */}
      <div
        className="relative w-full overflow-hidden rounded-xl border border-white/5 bg-zinc-900"
      >
        {/* Subtle top accent line */}
        <div
          className="absolute top-0 left-0 h-0.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #facc1530 30%, #facc1550 50%, #facc1530 70%, transparent 100%)",
          }}
        />

        <div className="h-[250px] w-full p-4 pt-5 pr-6">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 8, right: 4, left: -8, bottom: 4 }}
            >
              <defs>
                {/* WPM gradient fill */}
                <linearGradient id="wpmAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#facc15" stopOpacity={0.15} />
                  <stop offset="60%" stopColor="#facc15" stopOpacity={0.04} />
                  <stop offset="100%" stopColor="#facc15" stopOpacity={0} />
                </linearGradient>
                {/* Raw gradient fill */}
                <linearGradient id="rawAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#71717a" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#71717a" stopOpacity={0} />
                </linearGradient>
                {/* Glow filter for WPM line */}
                <filter id="wpmGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <CartesianGrid
                stroke="rgba(255, 255, 255, 0.03)"
                strokeDasharray="3 6"
                vertical={false}
              />

              <XAxis
                dataKey="second"
                tick={{
                  fill: "#71717a",
                  fontSize: 10,
                  fontFamily: "Roboto Mono, monospace",
                }}
                axisLine={{ stroke: "rgba(255, 255, 255, 0.07)" }}
                tickLine={false}
                interval="preserveStartEnd"
                padding={{ left: 6, right: 6 }}
              />

              <YAxis
                yAxisId="wpm"
                tick={{
                  fill: "#71717a",
                  fontSize: 10,
                  fontFamily: "Roboto Mono, monospace",
                }}
                axisLine={false}
                tickLine={false}
                width={32}
                domain={[0, yMax]}
                tickCount={6}
              />

              <YAxis
                yAxisId="errors"
                orientation="right"
                tick={false}
                axisLine={false}
                tickLine={false}
                width={0}
                domain={[0, "auto"]}
                hide
              />

              {/* Average WPM reference line */}
              <ReferenceLine
                yAxisId="wpm"
                y={avgWpm}
                stroke="#facc15"
                strokeDasharray="6 4"
                strokeOpacity={0.25}
                strokeWidth={1}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "rgba(255, 255, 255, 0.15)",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />

              {/* Raw WPM area fill */}
              <Area
                yAxisId="wpm"
                type="natural"
                dataKey="raw"
                stroke="none"
                fill="url(#rawAreaGrad)"
                isAnimationActive
                animationDuration={1000}
                animationEasing="ease-out"
              />

              {/* WPM area fill */}
              <Area
                yAxisId="wpm"
                type="natural"
                dataKey="wpm"
                stroke="none"
                fill="url(#wpmAreaGrad)"
                isAnimationActive
                animationDuration={1000}
                animationEasing="ease-out"
              />

              {/* Raw WPM line — sub color, behind */}
              <Line
                yAxisId="wpm"
                type="natural"
                dataKey="raw"
                name="raw"
                stroke="#71717a"
                strokeWidth={1.5}
                dot={false}
                activeDot={<ActiveDot />}
                isAnimationActive
                animationDuration={1200}
                animationEasing="ease-out"
              />

              {/* WPM line — accent color, on top */}
              <Line
                yAxisId="wpm"
                type="natural"
                dataKey="wpm"
                name="wpm"
                stroke="#facc15"
                strokeWidth={2.5}
                dot={false}
                activeDot={<ActiveDot />}
                filter="url(#wpmGlow)"
                isAnimationActive
                animationDuration={1200}
                animationEasing="ease-out"
              />

              {/* Error scatter dots */}
              <Scatter
                yAxisId="errors"
                dataKey="errors"
                name="errors"
                fill="#f43f5e"
                shape={<ErrorDot />}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TypingGraph;
