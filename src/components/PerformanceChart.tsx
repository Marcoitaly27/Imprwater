import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import type { Trial } from "../lib/model";
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: readonly { payload: Trial }[];
}) {
  if (!active || !payload?.length) return null;
  const test = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <strong>{test.distance.toFixed(1)} m breakout</strong>
      <span>
        {test.time.toFixed(2)} s · {test.kicks} dolphin kicks
      </span>
    </div>
  );
}
export function PerformanceChart({
  tests,
  best,
}: {
  tests: Trial[];
  best?: Trial;
}) {
  return (
    <div
      className="chart-area"
      role="img"
      aria-label="Scatter chart of breakout distance against 15 meter time. Both axes start at zero. Full values are available in the test table."
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <ScatterChart margin={{ top: 12, right: 18, bottom: 22, left: 0 }}>
          <CartesianGrid
            stroke="#293330"
            strokeDasharray="3 5"
            vertical={false}
          />
          <XAxis
            type="number"
            dataKey="distance"
            domain={[0, 15]}
            ticks={[0, 3, 6, 9, 12, 15]}
            tick={{ fill: "#8d9b96", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "Breakout distance (m)",
              position: "bottom",
              fill: "#8d9b96",
              fontSize: 11,
              offset: 5,
            }}
          />
          <YAxis
            type="number"
            dataKey="time"
            domain={[0, "auto"]}
            tick={{ fill: "#8d9b96", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={37}
            label={{
              value: "15 m time (s)",
              angle: -90,
              position: "insideLeft",
              fill: "#8d9b96",
              fontSize: 11,
              dx: 9,
            }}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: "#687d72", strokeDasharray: "4 4" }}
          />
          {best && (
            <ReferenceLine
              x={best.distance}
              stroke="#b9f577"
              strokeOpacity={0.28}
              strokeDasharray="4 5"
            />
          )}
          <Scatter name="Observed tests" data={tests} isAnimationActive={false}>
            {tests.map((t) => (
              <Cell
                key={t.id}
                fill={t.time === best?.time ? "#b9f577" : "#80a9b6"}
                stroke={t.time === best?.time ? "#b9f577" : "#101817"}
                strokeWidth={t.time === best?.time ? 3 : 2}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
