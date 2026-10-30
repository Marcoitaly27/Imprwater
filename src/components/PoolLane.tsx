import { useId } from "react";
import { Flag, Target, Waves } from "lucide-react";
export function PoolLane({
  distance,
  time,
}: {
  distance?: number;
  time?: number;
}) {
  const id = useId().replaceAll(":", "");
  const x = distance !== undefined ? (distance / 15) * 1000 : undefined;
  return (
    <section className="panel pool-panel" aria-label="15 meter pool lane">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">
            <Waves size={14} />
            THE BREAKOUT ZONE
          </span>
          <h2>Your underwater advantage.</h2>
          <p>
            From the wall to the surface. Find where your fastest test emerged.
          </p>
        </div>
        <span className="limit-label">
          <Flag size={14} />
          15 m · REGULATORY LIMIT
        </span>
      </div>
      <div className="pool-track-wrap">
        <div className="pool-caption">
          <span>START / TURN</span>
          <span className="trajectory-caption">
            {distance !== undefined
              ? "Best observed breakout"
              : "Your next observation starts here"}
          </span>
        </div>
        <div className="pool-track">
          <svg
            viewBox="0 0 1000 120"
            preserveAspectRatio="none"
            className="pool-svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={`water-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e4f3fb" stopOpacity="1" />
                <stop offset="100%" stopColor="#e4f3fb" />
              </linearGradient>
              <linearGradient id={`trail-${id}`}>
                <stop offset="0%" stopColor="#0284c7" stopOpacity="1" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <pattern
                id={`tile-${id}`}
                width="50"
                height="30"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 50 0 L 0 0 0 30"
                  fill="none"
                  stroke="#75a9c9"
                  strokeOpacity=".15"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="1000" height="120" fill={`url(#water-${id})`} />
            <rect width="1000" height="120" fill={`url(#tile-${id})`} />
            <line
              x1="0"
              y1="28"
              x2="1000"
              y2="28"
              stroke="#75a9c9"
              strokeOpacity=".22"
            />
            {[5, 10].map((m) => (
              <line
                key={m}
                x1={(m / 15) * 1000}
                x2={(m / 15) * 1000}
                y1="0"
                y2="120"
                stroke="#75a9c9"
                strokeOpacity=".3"
                strokeDasharray="3 5"
              />
            ))}
            {x !== undefined && (
              <>
                <path
                  d={`M 0 96 C ${x * 0.35} 108, ${x * 0.72} 108, ${x} 28`}
                  fill="none"
                  stroke={`url(#trail-${id})`}
                  strokeWidth="3"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  d={`M 0 96 C ${x * 0.35} 108, ${x * 0.72} 108, ${x} 28 L ${x} 120 L 0 120 Z`}
                  fill="#0284c7"
                  fillOpacity=".035"
                />
              </>
            )}
          </svg>
          <div className="pool-wall" />
          <div className="lane-rope" />
          <div className="pool-limit-line">
            <span className="limit-buoy" />
          </div>
          {distance !== undefined ? (
            <div
              className="breakout-marker"
              style={{ left: `${(distance / 15) * 100}%` }}
            >
              <div
                className={`marker-label ${distance > 12 ? "right-edge" : distance < 3 ? "left-edge" : ""}`}
              >
                <Target size={13} />
                <span>
                  Breakout <strong>{distance} m</strong>
                  {time !== undefined && <> · {time.toFixed(2)} s</>}
                </span>
              </div>
              <span className="marker-dot" />
            </div>
          ) : (
            <div className="pool-empty">
              <Waves size={22} />
              <span>Record a test to visualize your breakout.</span>
            </div>
          )}
        </div>
        <div className="pool-scale">
          {[0, 5, 10, 15].map((m) => (
            <span key={m} style={{ left: `${(m / 15) * 100}%` }}>
              {m === 0 ? "Wall · 0 m" : `${m} m`}
            </span>
          ))}
        </div>
      </div>
      <div className="pool-footnote">
        <span>
          <span className="legend-dot cyan" />
          Illustrative path · not measured underwater motion
        </span>
        <span>
          Head must surface by 15 m · freestyle, backstroke & butterfly
        </span>
      </div>
    </section>
  );
}
