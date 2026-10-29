import { analyze } from "../lib/model";
import type { Trial } from "../lib/model";
export function Statistics({ tests }: { tests: Trial[] }) {
  const { groups, bestMean, meanTies, preliminary } = analyze(tests);
  return (
    <section className="panel stats-panel">
      <div className="panel-heading">
        <div>
          <h2>Repeated-distance analysis</h2>
          <p>
            {preliminary
              ? "Preliminary result · collect more repeats at each distance."
              : "Descriptive results · repetitions alone do not establish reliability."}
          </p>
        </div>
      </div>
      {bestMean && (
        <div className="mean-callout">
          <span>LOWEST OBSERVED MEAN</span>
          <strong>
            {meanTies.map((g) => `${g.distance} m`).join(" / ")} ·{" "}
            {bestMean.mean.toFixed(2)} s
          </strong>
          <p>
            {meanTies
              .map(
                (g) =>
                  `${g.count} test${g.count === 1 ? "" : "s"} at ${g.distance} m`,
              )
              .join("; ")}
            .{" "}
            {groups.length < 2
              ? "Only one distance has been tested; there is no between-distance comparison."
              : "Different sample counts can affect comparisons."}{" "}
            This is not a validated strategy recommendation.
          </p>
        </div>
      )}
      {groups.length ? (
        <div className="table-scroll">
          <table>
            <caption className="sr-only">
              Statistics grouped by exactly equal breakout distance
            </caption>
            <thead>
              <tr>
                <th>DISTANCE</th>
                <th>TESTS</th>
                <th>MEAN</th>
                <th>MEDIAN</th>
                <th>BEST</th>
                <th>VARIABILITY (SD)</th>
                <th>RANGE</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.distance}>
                  <td>{g.distance} m</td>
                  <td>{g.count}</td>
                  <td>{g.mean.toFixed(2)} s</td>
                  <td>{g.median.toFixed(2)} s</td>
                  <td>{g.best.toFixed(2)} s</td>
                  <td>
                    {g.sd === null
                      ? "Not enough repeats"
                      : `${g.sd.toFixed(3)} s`}
                  </td>
                  <td>
                    {g.count > 1
                      ? `${g.min.toFixed(2)}–${g.max.toFixed(2)} s`
                      : "One observation"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-empty">
          Add tests to compare exactly matched distances.
        </div>
      )}
      <details className="metric-explanation">
        <summary>What do these numbers mean?</summary>
        <p>
          <strong>Mean:</strong> total time divided by the number of tests.{" "}
          <strong>Median:</strong> the middle time after sorting (average of the
          two middle times for an even count). <strong>Best:</strong> lowest
          individual time. <strong>Sample standard deviation (SD):</strong>{" "}
          spread around the mean, using n−1; lower values mean the recorded
          times were closer together. At least two tests are needed.{" "}
          <strong>Range:</strong> fastest to slowest time.
        </p>
        <p>
          Distances are never rounded or merged for grouping. The preliminary
          label is a practice reminder used when fewer than two distances are
          present or any distance has fewer than three observations; it is not a
          scientific confidence threshold. Even with more data, timing error,
          effort, rest and fatigue can affect the results. Repeat comparable
          tests; no causal or physiological claim is made.
        </p>
      </details>
    </section>
  );
}
