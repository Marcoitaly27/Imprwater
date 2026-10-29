import {
  Pencil,
  Trash2,
  ArrowRightLeft,
  Waves,
  ArrowUpRight,
  Database,
} from "lucide-react";
import type { Trial } from "../lib/model";
export function TrialLog({
  tests,
  bestTime,
  onEdit,
  onDelete,
  onMove,
  onClear,
  onDemo,
}: {
  tests: Trial[];
  bestTime?: number;
  onEdit: (t: Trial) => void;
  onDelete: (t: Trial) => void;
  onMove: (t: Trial) => void;
  onClear: () => void;
  onDemo: () => void;
}) {
  return (
    <section className="panel table-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">EVERY OBSERVATION COUNTS</span>
          <h2>
            Session test log <span className="count-badge">{tests.length}</span>
          </h2>
          <p>Sorted by breakout distance. Each repeat stays separate.</p>
        </div>
        <button
          className="text-button danger-text"
          onClick={onClear}
          disabled={!tests.length}
        >
          <Trash2 size={16} />
          Clear session tests
        </button>
      </div>
      {!tests.length ? (
        <div className="table-empty">
          <span className="empty-log-icon">
            <Waves size={32} />
          </span>
          <h3>No observations yet.</h3>
          <p>Your next breakthrough starts with one observation.</p>
          <button className="button secondary" onClick={onDemo}>
            <Database size={16} />
            Load demo data
            <ArrowUpRight size={14} />
          </button>
        </div>
      ) : (
        <>
          <div className="table-scroll desktop-log">
            <table>
              <thead>
                <tr>
                  <th>TEST</th>
                  <th>BREAKOUT</th>
                  <th>KICKS</th>
                  <th>15 M TIME</th>
                  <th>FROM BEST</th>
                  <th>NOTES</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((t, i) => (
                  <tr
                    key={t.id}
                    className={t.time === bestTime ? "best-row" : ""}
                  >
                    <td>
                      <span className="test-name">
                        Test {i + 1}
                        {t.time === bestTime && (
                          <span className="best-badge">★ BEST</span>
                        )}
                      </span>
                      <small className="test-ref">{t.id.slice(0, 8)}</small>
                    </td>
                    <td>{t.distance} m</td>
                    <td>{t.kicks}</td>
                    <td>
                      <strong>{t.time.toFixed(2)} s</strong>
                    </td>
                    <td>
                      {bestTime === undefined
                        ? "—"
                        : `+${(t.time - bestTime).toFixed(2)} s`}
                    </td>
                    <td className="notes-cell">
                      <details>
                        <summary>{t.notes ? "Read note" : "No note"}</summary>
                        <p>{t.notes || "—"}</p>
                      </details>
                    </td>
                    <td>
                      <Actions
                        t={t}
                        index={i}
                        onEdit={onEdit}
                        onMove={onMove}
                        onDelete={onDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-log">
            {tests.map((t, i) => (
              <article
                key={t.id}
                className={`mobile-test ${t.time === bestTime ? "best-row" : ""}`}
              >
                <header>
                  <strong>
                    Test {i + 1} <small>· {t.id.slice(0, 8)}</small>
                  </strong>
                  {t.time === bestTime && (
                    <span className="best-badge">★ BEST OBSERVED</span>
                  )}
                </header>
                <div className="mobile-test-values">
                  <div>
                    <small>Breakout</small>
                    <strong>
                      {t.distance} <span>m</span>
                    </strong>
                  </div>
                  <div>
                    <small>Kicks</small>
                    <strong>{t.kicks}</strong>
                  </div>
                  <div>
                    <small>15 m time</small>
                    <strong>
                      {t.time.toFixed(2)} <span>s</span>
                    </strong>
                  </div>
                </div>
                <div className="mobile-test-bottom">
                  <details>
                    <summary>Notes</summary>
                    <p>{t.notes || "No notes."}</p>
                  </details>
                  <Actions
                    t={t}
                    index={i}
                    onEdit={onEdit}
                    onMove={onMove}
                    onDelete={onDelete}
                  />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      <div className="table-footer">
        <span>Data stays in this browser. No automatic device sync.</span>
        <span>{tests.length} observations</span>
      </div>
    </section>
  );
}
function Actions({
  t,
  index,
  onEdit,
  onMove,
  onDelete,
}: {
  t: Trial;
  index: number;
  onEdit: (t: Trial) => void;
  onMove: (t: Trial) => void;
  onDelete: (t: Trial) => void;
}) {
  return (
    <div className="row-actions">
      <button
        className="icon-button"
        aria-label={`Edit test ${index + 1}`}
        onClick={() => onEdit(t)}
      >
        <Pencil size={17} />
      </button>
      <button
        className="icon-button"
        aria-label={`Move test ${index + 1}`}
        onClick={() => onMove(t)}
      >
        <ArrowRightLeft size={17} />
      </button>
      <button
        className="icon-button delete-button"
        aria-label={`Delete test ${index + 1}`}
        onClick={() => onDelete(t)}
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}
