import { useState } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Trial } from "../lib/model";
export function PerformanceChart({
  tests,
  best,
}: {
  tests: Trial[];
  best?: Trial;
}) {
  const [detail, setDetail] = useState(false);
  const [speed, setSpeed] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const selected = tests.find((t) => t.id === selectedId) ?? best ?? tests[0];
  const value = (t: Trial) => (speed ? 15 / t.time : t.time);
  const min = Math.min(...tests.map(value)),
    max = Math.max(...tests.map(value));
  const pad = Math.max(0.05, (max - min) * 0.15);
  const low = detail ? Math.max(0, Math.floor((min - pad) * 100) / 100) : 0;
  const high = Math.ceil((max + pad) * 100) / 100;
  const unit = speed ? "m/s" : "s";
  const ref = (t: Trial) =>
    `Test ${tests.findIndex((x) => x.id === t.id) + 1} · ${t.id.slice(0, 8)}`;
  const chartData = tests.map((t) => ({ ...t, chartValue: value(t) }));
  // A guide through the best actual observation at each exact distance. No fitted curve or prediction.
  const guide = [...chartData]
    .sort((a, b) => a.distance - b.distance || a.time - b.time)
    .filter((t, i, a) => i === 0 || t.distance !== a[i - 1].distance);
  function point(props: unknown) {
    const { cx, cy, payload } = props as {
      cx?: number;
      cy?: number;
      payload?: Trial;
    };
    if (!payload || cx === undefined || cy === undefined) return <g />;
    const fastest = payload.time === best?.time;
    const chosen = payload.id === selected?.id;
    return (
      <g>
        {fastest && (
          <circle
            cx={cx}
            cy={cy}
            r={12}
            fill="#0284c7"
            fillOpacity={0.06}
            stroke="#075985"
            strokeOpacity={0.8}
            strokeWidth={1.5}
          />
        )}
        <circle
          cx={cx}
          cy={cy}
          r={chosen ? 6.5 : 5}
          fill={fastest ? "#075985" : "#0284c7"}
          stroke={chosen ? "#0f172a" : "#ffffff"}
          strokeWidth={2}
          role="button"
          tabIndex={0}
          aria-label={`${ref(payload)}, ${payload.distance} m, ${payload.time} seconds, ${payload.kicks} kicks`}
          onClick={() => setSelectedId(payload.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setSelectedId(payload.id);
            }
          }}
          style={{ cursor: "pointer" }}
        />
      </g>
    );
  }
  return (
    <>
      <div className="chart-controls">
        <div className="segmented" aria-label="Chart metric">
          <button aria-pressed={!speed} onClick={() => setSpeed(false)}>
            Time <span>s</span>
          </button>
          <button aria-pressed={speed} onClick={() => setSpeed(true)}>
            Average speed <span>m/s</span>
          </button>
        </div>
        <div className="segmented small-segment" aria-label="Chart view">
          <button aria-pressed={!detail} onClick={() => setDetail(false)}>
            Overview
          </button>
          <button aria-pressed={detail} onClick={() => setDetail(true)}>
            Detail
          </button>
        </div>
      </div>
      <div className="axis-notice">
        {detail
          ? `Detail: ${speed ? "speed" : "time"} axis ${low.toFixed(2)}–${high.toFixed(2)} ${unit}. ${low > 0 ? "Does not start at zero." : "Starts at zero."}`
          : `Overview: ${speed ? "speed" : "time"} axis starts at zero. Distance axis: 0–15 m.`}
        {speed &&
          " Average speed = 15 m ÷ total 15 m time; not underwater-only speed."}
      </div>
      <div className="chart-area" aria-label="Breakout performance chart">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ScatterChart margin={{ top: 20, right: 22, bottom: 24, left: 16 }}>
            <CartesianGrid stroke="#e0edf8" strokeDasharray="3 5" />
            <XAxis
              type="number"
              dataKey="distance"
              domain={[0, 15]}
              ticks={[0, 3, 6, 9, 12, 15]}
              tick={{ fill: "#596b80", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              label={{
                value: "BREAKOUT DISTANCE (m)",
                position: "bottom",
                offset: 6,
                fill: "#596b80",
                fontSize: 10,
              }}
            />
            <YAxis
              type="number"
              dataKey="chartValue"
              domain={[low, detail ? high : "auto"]}
              allowDataOverflow={detail}
              tick={{ fill: "#596b80", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(n) =>
                detail || speed ? Number(n).toFixed(2) : String(n)
              }
              label={{
                value: speed ? "15 M AVERAGE SPEED (m/s)" : "15 M TIME (s)",
                angle: -90,
                position: "insideLeft",
                dx: -6,
                fill: "#596b80",
                fontSize: 10,
              }}
            />
            <Tooltip
              cursor={{
                stroke: "#0284c7",
                strokeOpacity: 0.3,
                strokeDasharray: "4 4",
              }}
              content={({ active, payload }) => {
                const t = payload?.[0]?.payload as Trial | undefined;
                return active && t ? (
                  <div className="chart-tooltip">
                    <strong>{ref(t)}</strong>
                    <span>
                      {t.distance} m · {t.time.toFixed(2)} s · {t.kicks} kicks
                    </span>
                    <span>
                      15 m average speed: {(15 / t.time).toFixed(2)} m/s
                    </span>
                    {t.notes && <p>{t.notes}</p>}
                  </div>
                ) : null;
              }}
            />
            {best && (
              <ReferenceLine
                x={best.distance}
                stroke="#0284c7"
                strokeDasharray="4 5"
                strokeOpacity={0.25}
              />
            )}
            <Scatter
              data={guide}
              line={{ stroke: "#0284c7", strokeWidth: 2, strokeOpacity: 0.6 }}
              lineType="joint"
              shape={() => <g />}
              isAnimationActive={false}
              legendType="none"
              tooltipType="none"
            />
            <Scatter
              name="Recorded tests"
              data={chartData}
              shape={point}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-legend">
        <span>
          <i className="legend-dot cyan" />
          Recorded test
        </span>
        <span>
          <i className="legend-dot gold" />
          Fastest observed
        </span>
        <span>
          {speed ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{" "}
          {speed ? "Higher speed is faster" : "Lower time is faster"}
        </span>
      </div>
      <p className="guide-note">
        Line joins best recorded tests at each distance. It is a visual guide,
        not a fitted model or an estimate between points.
      </p>
      <div className="chart-selection">
        <label>
          Select observation (includes overlapping points)
          <select
            aria-label="Chart observation"
            value={selected?.id ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {tests.map((t) => (
              <option key={t.id} value={t.id}>
                {ref(t)} · {t.distance} m · {t.time.toFixed(2)} s · {t.kicks}{" "}
                kicks
              </option>
            ))}
          </select>
        </label>
        {selected && (
          <p aria-live="polite">
            <strong>{ref(selected)}</strong> · {selected.distance} m ·{" "}
            {selected.time.toFixed(2)} s · {selected.kicks} dolphin kicks
            {speed && ` · ${(15 / selected.time).toFixed(2)} m/s`}
          </p>
        )}
        <p className="muted">
          Tap a point or use the selector. Overlapping tests remain individually
          accessible.
        </p>
      </div>
    </>
  );
}
