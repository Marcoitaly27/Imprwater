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
import type { Trial } from "../lib/model";
export function PerformanceChart({
  tests,
  best,
}: {
  tests: Trial[];
  best?: Trial;
}) {
  const [detail, setDetail] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const selected = tests.find((t) => t.id === selectedId) ?? best ?? tests[0];
  const min = Math.min(...tests.map((t) => t.time)),
    max = Math.max(...tests.map((t) => t.time));
  const pad = Math.max(0.05, (max - min) * 0.15);
  const low = detail ? Math.max(0, Math.floor((min - pad) * 100) / 100) : 0;
  const high = Math.ceil((max + pad) * 100) / 100;
  const ref = (t: Trial) =>
    `Test ${tests.findIndex((x) => x.id === t.id) + 1} · ${t.id.slice(0, 8)}`;
  function point(props: unknown) {
    const { cx, cy, payload } = props as {
      cx?: number;
      cy?: number;
      payload?: Trial;
    };
    if (!payload || cx === undefined || cy === undefined) return <g />;
    const chosen = payload.id === selected?.id;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={chosen ? 8 : 6}
        fill={payload.time === best?.time ? "#b9f577" : "#80a9b6"}
        stroke={chosen ? "#fff" : "#15231b"}
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
    );
  }
  return (
    <>
      <div className="chart-controls">
        <div className="segmented" aria-label="Chart view">
          <button aria-pressed={!detail} onClick={() => setDetail(false)}>
            Overview
          </button>
          <button aria-pressed={detail} onClick={() => setDetail(true)}>
            Detail
          </button>
        </div>
        <span className="axis-notice">
          {detail
            ? `Detail: time axis ${low.toFixed(2)}–${high.toFixed(2)} s. ${low > 0 ? "Does not start at zero." : "Starts at zero."}`
            : "Overview: time axis starts at zero. Distance axis: 0–15 m."}
        </span>
      </div>
      <div className="chart-area" aria-label="Breakout performance chart">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <ScatterChart margin={{ top: 18, right: 20, bottom: 25, left: 16 }}>
            <CartesianGrid
              stroke="#39473e"
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              type="number"
              dataKey="distance"
              domain={[0, 15]}
              ticks={[0, 3, 6, 9, 12, 15]}
              tick={{ fill: "#abbcac", fontSize: 12 }}
              label={{
                value: "Breakout distance (m)",
                position: "bottom",
                offset: 4,
                fill: "#abbcac",
                fontSize: 12,
              }}
            />
            <YAxis
              type="number"
              dataKey="time"
              domain={[low, detail ? high : "auto"]}
              allowDataOverflow={detail}
              tick={{ fill: "#abbcac", fontSize: 12 }}
              width={48}
              tickFormatter={(n) => (detail ? Number(n).toFixed(2) : String(n))}
              label={{
                value: "15 m time (s)",
                angle: -90,
                position: "insideLeft",
                dx: -8,
                fill: "#abbcac",
                fontSize: 12,
              }}
            />
            <Tooltip
              cursor={{ stroke: "#82997c", strokeDasharray: "4 4" }}
              content={({ active, payload }) => {
                const t = payload?.[0]?.payload as Trial | undefined;
                return active && t ? (
                  <div className="chart-tooltip">
                    <strong>{ref(t)}</strong>
                    <span>
                      {t.distance} m · {t.time.toFixed(2)} s · {t.kicks} kicks
                    </span>
                  </div>
                ) : null;
              }}
            />
            {best && (
              <ReferenceLine
                x={best.distance}
                stroke="#b9f577"
                strokeDasharray="4 5"
                strokeOpacity={0.4}
              />
            )}
            <Scatter data={tests} shape={point} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
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
          </p>
        )}
        <p className="muted">
          Green: fastest observed time. Tap a point or use the selector.
          Identical points remain individually available in the selector and
          test log.
        </p>
      </div>
    </>
  );
}
