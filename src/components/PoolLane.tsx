import { Waves } from "lucide-react";
export function PoolLane({ distance }: { distance?: number }) {
  return (
    <section className="panel pool-panel">
      <div className="panel-heading">
        <div>
          <h2>Your underwater, visualized</h2>
          <p>Head must break the surface by 15 m after the start or turn.</p>
        </div>
        <span className="limit-label">
          <span />
          15 m limit
        </span>
      </div>
      <div className="pool-track-wrap">
        <div className="pool-track">
          <div className="pool-water" />
          <div className="lane-rope top" />
          <div className="lane-rope bottom" />
          <div className="pool-center-line" />
          {[0, 5, 10, 15].map((m) => (
            <div
              key={m}
              className="pool-tick"
              style={{ left: `${(m / 15) * 100}%` }}
            />
          ))}
          {distance !== undefined && (
            <div
              className="breakout-marker"
              style={{ left: `${(distance / 15) * 100}%` }}
            >
              <div
                className={`marker-label ${distance > 12 ? "right-edge" : distance < 3 ? "left-edge" : ""}`}
              >
                <span aria-hidden="true" />
                {distance} m <span className="marker-word">BEST OBSERVED</span>
              </div>
              <div className="marker-line" />
              <span className="marker-dot">
                <Waves size={17} />
              </span>
            </div>
          )}
          <div className="pool-wall" />
        </div>
        <div className="pool-scale">
          {[0, 5, 10, 15].map((m) => (
            <span key={m} style={{ left: `${(m / 15) * 100}%` }}>
              {m} m
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
