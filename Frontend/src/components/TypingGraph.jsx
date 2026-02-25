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
      className="rounded-lg border px-4 py-3 text-xs shadow-xl"
      style={{
        background: "rgba(40, 42, 44, 0.92)",
        backdropFilter: "blur(12px)",
        borderColor: "rgba(100, 102, 105, 0.2)",
      }}
    >
      <p
        className="mb-2 border-b pb-1.5 font-mono text-[10px] font-medium"
        style={{ color: "#828487", borderColor: "rgba(100,102,105,0.15)" }}
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
              <span style={{ color: "#9e9fa2" }}>{entry.name}</span>
            </span>
            <span
              className="font-mono font-semibold tabular-nums"
              style={{ color: "#d1d0c5" }}
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
      <circle cx={cx} cy={cy} r={size + 4} fill="#ca4754" opacity={0.08} />
      {/* Mid ring */}
      <circle cx={cx} cy={cy} r={size + 1.5} fill="#ca4754" opacity={0.2} />
      {/* Core dot */}
      <circle cx={cx} cy={cy} r={size} fill="#ca4754" opacity={0.85} />
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
    <circle cx={cx} cy={cy} r={5} fill="#2c2e31" stroke={stroke} strokeWidth={2.5} />
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
        <div className="flex items-center gap-5 text-[11px]" style={{ color: "#646669" }}>
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-[3px] w-5 rounded-full"
              style={{ background: "#e2b714", boxShadow: "0 0 6px #e2b71466" }}
            />
            wpm
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block h-[3px] w-5 rounded-full"
              style={{ background: "#646669" }}
            />
            raw
          </span>
          {totalErrors > 0 && (
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-[7px] w-[7px] rounded-full"
                style={{ background: "#ca4754", boxShadow: "0 0 4px #ca475466" }}
              />
              errors
            </span>
          )}
        </div>

        {/* Avg chip */}
        <div
          className="flex items-center gap-2 rounded-md px-2.5 py-1 text-[11px]"
          style={{ background: "rgba(226, 183, 20, 0.08)", color: "#e2b714" }}
        >
          <span style={{ color: "#646669" }}>avg</span>
          <span className="font-mono font-semibold tabular-nums">{avgWpm}</span>
          <span style={{ color: "#646669" }}>wpm</span>
        </div>
      </div>

      {/* ── Chart container ── */}
      <div
        className="relative w-full overflow-hidden rounded-xl"
        style={{
          background: "linear-gradient(180deg, #2e3033 0%, #2a2c2f 100%)",
          border: "1px solid rgba(100, 102, 105, 0.1)",
        }}
      >
        {/* Subtle top accent line */}
        <div
          className="absolute top-0 left-0 h-[2px] w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, #e2b71430 30%, #e2b71450 50%, #e2b71430 70%, transparent 100%)",
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
                  <stop offset="0%" stopColor="#e2b714" stopOpacity={0.15} />
                  <stop offset="60%" stopColor="#e2b714" stopOpacity={0.04} />
                  <stop offset="100%" stopColor="#e2b714" stopOpacity={0} />
                </linearGradient>
                {/* Raw gradient fill */}
                <linearGradient id="rawAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#646669" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#646669" stopOpacity={0} />
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
                stroke="rgba(100, 102, 105, 0.08)"
                strokeDasharray="3 6"
                vertical={false}
              />

              <XAxis
                dataKey="second"
                tick={{
                  fill: "#505255",
                  fontSize: 10,
                  fontFamily: "Roboto Mono, monospace",
                }}
                axisLine={{ stroke: "rgba(100,102,105,0.12)" }}
                tickLine={false}
                interval="preserveStartEnd"
                padding={{ left: 6, right: 6 }}
              />

              <YAxis
                yAxisId="wpm"
                tick={{
                  fill: "#505255",
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
                stroke="#e2b714"
                strokeDasharray="6 4"
                strokeOpacity={0.25}
                strokeWidth={1}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "rgba(100,102,105,0.25)",
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
                stroke="#646669"
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
                stroke="#e2b714"
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
                fill="#ca4754"
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
