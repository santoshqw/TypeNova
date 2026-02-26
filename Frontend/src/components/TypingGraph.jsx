import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

/* ─── palette (synced with CSS tokens) ─── */
const C = {
  main: "#e2b714",
  sub: "#8a8c8f",
  subAlt: "#252729",
  bg: "#2c2e31",
  text: "#d1d0c5",
  error: "#e05561",
};

/* ─────────────────────── Tooltip ─────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{ background: C.subAlt, border: `1px solid ${C.sub}33` }}
      className="rounded-md px-3 py-2 text-xs shadow-lg"
    >
      <p className="mb-1.5 font-mono text-[10px]" style={{ color: C.sub }}>
        {label}s
      </p>
      {payload
        .filter((e) => e.value != null)
        .map((e) => (
          <p key={e.name} className="flex justify-between gap-6">
            <span style={{ color: C.text }}>{e.name}</span>
            <span className="font-mono font-semibold" style={{ color: e.color }}>
              {e.value}
            </span>
          </p>
        ))}
    </div>
  );
};

/* ─────────────────────── Graph ─────────────────────── */
const TypingGraph = ({ data, showAfterComplete, wpm = 0, accuracy = 0 }) => {
  const yMax = useMemo(() => {
    if (!data?.length) return 100;
    const peak = Math.max(...data.map((d) => Math.max(d.wpm || 0, d.raw || 0)));
    return Math.ceil(peak / 20) * 20 + 20;
  }, [data]);

  if (!showAfterComplete || !data?.length) return null;

  return (
    <div className="mt-6 animate-fade-in" style={{ animationDelay: "200ms", opacity: 0 }}>
      <div className="flex gap-4">
        {/* Left-side stats */}
        <div className="flex flex-col justify-center gap-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-sub">wpm</p>
            <p className="font-mono text-5xl font-bold tabular-nums text-main">{wpm}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-sub">acc</p>
            <p className="font-mono text-5xl font-bold tabular-nums text-main">{accuracy}%</p>
          </div>
        </div>
        {/* Chart */}
        <div className="flex-1 [&_*:focus]:outline-none [&_*:focus-visible]:outline-none" style={{ minHeight: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="gWpm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.main} stopOpacity={0.25} />
                <stop offset="100%" stopColor={C.main} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gRaw" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.sub} stopOpacity={0.12} />
                <stop offset="100%" stopColor={C.sub} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gErr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.error} stopOpacity={0.3} />
                <stop offset="100%" stopColor={C.error} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke={`${C.sub}35`} strokeDasharray="3 6" vertical={true} />

            <XAxis
              dataKey="second"
              tick={{ fill: C.sub, fontSize: 10, fontFamily: "Roboto Mono, monospace" }}
              axisLine={{ stroke: `${C.sub}30` }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: C.sub, fontSize: 10, fontFamily: "Roboto Mono, monospace" }}
              axisLine={false}
              tickLine={false}
              width={32}
              domain={[0, yMax]}
            />

            <Tooltip content={<ChartTooltip />} cursor={{ stroke: `${C.sub}40`, strokeDasharray: "4 4" }} />

            <Area
              type="monotone"
              dataKey="raw"
              name="raw"
              stroke={C.sub}
              strokeWidth={1.5}
              strokeOpacity={0.6}
              strokeDasharray="4 4"
              fill="url(#gRaw)"
              dot={false}
              activeDot={{ r: 3, fill: C.sub }}
              isAnimationActive
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="wpm"
              name="wpm"
              stroke={C.main}
              strokeWidth={2}
              fill="url(#gWpm)"
              dot={false}
              activeDot={{ r: 4, fill: C.main, stroke: C.bg, strokeWidth: 2 }}
              isAnimationActive
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="errors"
              name="errors"
              stroke={C.error}
              strokeWidth={1}
              strokeOpacity={0.6}
              fill="url(#gErr)"
              dot={false}
              activeDot={{ r: 3, fill: C.error }}
              isAnimationActive
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      </div>
    </div>
  );
};

export default TypingGraph;