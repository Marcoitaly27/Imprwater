import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Database,
  FlaskConical,
  Info,
  LayoutDashboard,
  ListFilter,
  Pencil,
  Plus,
  Radio,
  Sparkles,
  Target,
  Timer,
  Trash2,
  TrendingDown,
  Trophy,
  Waves,
  X,
  Zap,
} from "lucide-react";
import type { AppData, Profile, Trial, TrialInput } from "./lib/model";
import { analyze, events, makeDemo, profileKey, strokes } from "./lib/model";
import { loadData, saveData } from "./lib/storage";
import { Dialog } from "./components/Dialog";
import { TestForm } from "./components/TestForm";
const PerformanceChart = lazy(() =>
  import("./components/PerformanceChart").then((module) => ({
    default: module.PerformanceChart,
  })),
);

type Confirmation = { type: "clear" | "demo" | "delete"; id?: string };
function App() {
  const [loaded] = useState(loadData);
  const [data, setData] = useState<AppData>(loaded.data);
  const [storageError, setStorageError] = useState(loaded.error);
  const [savingEnabled, setSavingEnabled] = useState(!loaded.error);
  const [tab, setTab] = useState("Dashboard");
  const [editing, setEditing] = useState<Trial | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [notice, setNotice] = useState("");
  const [help, setHelp] = useState(false);
  const formRef = useRef<HTMLElement>(null);
  const profile = data.profile;
  const tests = data.tests.filter(
    (t) => t.stroke === profile.stroke && t.event === profile.event,
  );
  const { sorted, best, worst, improvement, tied, longer } = analyze(tests);
  useEffect(() => {
    if (savingEnabled) setStorageError(saveData(data));
  }, [data, savingEnabled]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timeout);
  }, [notice]);
  function updateProfile(next: Partial<Profile>) {
    setData((previous) => {
      const changed = { ...previous.profile, ...next };
      const key = profileKey(changed);
      if ("stroke" in next || "event" in next)
        changed.personalBest = previous.personalBests[key] ?? "";
      return {
        ...previous,
        profile: changed,
        personalBests: {
          ...previous.personalBests,
          [key]: changed.personalBest,
        },
      };
    });
  }
  function addTest(input: TrialInput) {
    setData((previous) => ({
      ...previous,
      tests: [
        ...previous.tests,
        {
          ...input,
          stroke: profile.stroke,
          event: profile.event,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setNotice("Test added to your observations.");
  }
  function loadDemo() {
    setData((previous) => ({
      ...previous,
      tests: [
        ...previous.tests.filter(
          (t) => t.stroke !== profile.stroke || t.event !== profile.event,
        ),
        ...makeDemo(profile),
      ],
    }));
    setNotice("Four demo tests loaded. Best observed breakout: 12.0 m.");
  }
  function confirmAction() {
    if (confirmation?.type === "demo") loadDemo();
    if (confirmation?.type === "clear") {
      setData((previous) => ({
        ...previous,
        tests: previous.tests.filter(
          (t) => t.stroke !== profile.stroke || t.event !== profile.event,
        ),
      }));
      setNotice("Tests cleared for this stroke and event.");
    }
    if (confirmation?.type === "delete") {
      setData((previous) => ({
        ...previous,
        tests: previous.tests.filter((t) => t.id !== confirmation.id),
      }));
      setNotice("Test deleted.");
    }
    setConfirmation(null);
  }
  const jumpToForm = () => {
    setTab("Dashboard");
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      formRef.current?.querySelector("input")?.focus({ preventScroll: true });
    }, 50);
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          aria-label="Underwater Optimizer dashboard"
          onClick={(e) => {
            e.preventDefault();
            setTab("Dashboard");
          }}
        >
          <span className="brand-mark">
            <Waves size={26} strokeWidth={2.4} />
          </span>
          <span>
            UNDERWATER<small>OPTIMIZER</small>
          </span>
        </a>
        <div className="workspace-label">
          PERFORMANCE LAB <span>V0.1</span>
        </div>
        <nav aria-label="Main navigation">
          {[
            { name: "Dashboard", icon: LayoutDashboard },
            { name: "Tests", icon: FlaskConical },
            { name: "Simulator", icon: Activity },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${tab === name ? "active" : ""}`}
              onClick={() => setTab(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
              {name === "Simulator" ? (
                <small>SOON</small>
              ) : (
                tab === name && <span className="nav-dot" />
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="mini-icon">
            <Waves size={20} />
          </div>
          <h3>
            Small details.
            <br />
            Faster swimming.
          </h3>
          <p>Turn your poolside tests into a clearer race strategy.</p>
          <span className="small-line" />
        </div>
        <div className="sidebar-bottom">
          <button onClick={() => setHelp(true)}>
            <CircleHelp size={17} /> How it works <ArrowUpRight size={14} />
          </button>
          <div className="local-status">
            <span className={`status-dot ${storageError ? "warning" : ""}`} />
            {storageError ? "In-memory mode" : "Stored on this browser"}
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Performance lab <ChevronRight size={14} />
            <strong>{tab}</strong>
          </div>
          <div className="topbar-right">
            <span className="private-label">
              <span className="status-dot" /> LOCAL WORKSPACE
            </span>
            <button
              className="avatar"
              aria-label="About this workspace"
              onClick={() => setHelp(true)}
            >
              SW
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span /> THE UNDERWATER ADVANTAGE
              </div>
              <h1>
                {tab === "Dashboard"
                  ? "Find your fastest breakout."
                  : tab === "Tests"
                    ? "Every test tells a story."
                    : "Your next race, reimagined."}
              </h1>
              <p>
                {tab === "Dashboard"
                  ? "Less guesswork. More speed. Let your poolside data lead the way."
                  : tab === "Tests"
                    ? "Compare your observations. Build a more informed strategy."
                    : "A new perspective on race strategy is on the horizon."}
              </p>
            </div>
            <button
              className="button secondary demo-button"
              onClick={() =>
                tests.length ? setConfirmation({ type: "demo" }) : loadDemo()
              }
            >
              <Database size={16} />
              Load demo data
              <ArrowUpRight size={15} />
            </button>
          </div>
          {storageError && (
            <div className="storage-banner" role="alert">
              <Info size={18} />
              <span>{storageError}</span>
              <button
                className="button secondary"
                onClick={() => {
                  const error = saveData(data);
                  setStorageError(error);
                  if (!error) setSavingEnabled(true);
                }}
              >
                {savingEnabled ? "Retry saving" : "Enable saving"}
              </button>
            </div>
          )}
          <section className="profile-bar" aria-label="Athlete profile">
            <div className="profile-caption">
              <span className="profile-icon">
                <Waves size={22} />
              </span>
              <div>
                <strong>Athlete profile</strong>
                <small>Your current focus</small>
              </div>
            </div>
            <label>
              Stroke
              <div className="select-wrap">
                <select
                  value={profile.stroke}
                  onChange={(e) =>
                    updateProfile({
                      stroke: e.target.value as Profile["stroke"],
                    })
                  }
                >
                  {strokes.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown size={14} />
              </div>
            </label>
            <label>
              Event
              <div className="select-wrap">
                <select
                  value={profile.event}
                  onChange={(e) =>
                    updateProfile({
                      event: Number(e.target.value) as Profile["event"],
                    })
                  }
                >
                  {events.map((v) => (
                    <option key={v} value={v}>
                      {v} m
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} />
              </div>
            </label>
            <label className="pb-field">
              Personal best <span className="muted">(optional)</span>
              <div className="input-unit">
                <input
                  type="number"
                  aria-label="Personal best"
                  value={profile.personalBest}
                  min="0.01"
                  max="3600"
                  step="0.01"
                  placeholder="—"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (
                      value === "" ||
                      (Number(value) > 0 && Number(value) <= 3600)
                    )
                      updateProfile({ personalBest: value });
                  }}
                />
                <span>s</span>
              </div>
            </label>
            <span className="profile-context">
              {profile.stroke}
              <span> / </span>
              {profile.event} m
            </span>
          </section>
          {tab === "Simulator" ? (
            <section className="simulator panel">
              <div className="simulator-icon">
                <Activity size={34} />
              </div>
              <span className="pill">COMING IN V0.3</span>
              <h2>See the bigger race picture.</h2>
              <p>
                A full race simulator is planned for a future release. For now,
                build your strategy with measured underwater tests.
              </p>
              <button
                className="button primary"
                onClick={() => setTab("Dashboard")}
              >
                Back to dashboard
                <ArrowRight size={16} />
              </button>
            </section>
          ) : (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-caption">
                    <span>TESTS RECORDED</span>
                    <FlaskConical size={17} />
                  </span>
                  <div className="stat-value">
                    {tests.length.toString().padStart(2, "0")}
                    <span>tests</span>
                  </div>
                  <div className="stat-sub">
                    {profile.stroke} · {profile.event} m
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-caption">
                    <span>BEST 15 M TIME</span>
                    <Timer size={17} />
                  </span>
                  <div className="stat-value">
                    {best ? best.time.toFixed(2) : "—"}
                    <span>s</span>
                  </div>
                  <div className="stat-sub">
                    {best
                      ? "Your fastest recorded performance"
                      : "Your first benchmark starts here"}
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-caption">
                    <span>BEST BREAKOUT</span>
                    <Target size={17} />
                  </span>
                  <div className="stat-value">
                    {best ? best.distance.toFixed(1) : "—"}
                    <span>m</span>
                  </div>
                  <div className="stat-sub">
                    {best
                      ? `${tied.length > 1 ? "Joint fastest" : "Best observed"} · ${best.kicks} dolphin kicks`
                      : "Add a test to find your distance"}
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-caption">
                    <span>OBSERVED TIME GAIN</span>
                    <TrendingDown size={17} />
                  </span>
                  <div
                    className={`stat-value ${tests.length > 1 ? "accent" : ""}`}
                  >
                    {tests.length > 1 ? improvement.toFixed(2) : "—"}
                    <span>s</span>
                  </div>
                  <div className="stat-sub">
                    {tests.length > 1 ? (
                      <>
                        <ArrowDownRight size={14} /> Best vs. slowest test
                      </>
                    ) : (
                      "Compare at least two observations"
                    )}
                  </div>
                </div>
              </div>
              {tab === "Dashboard" && (
                <>
                  <div className="analysis-grid">
                    <section className="panel chart-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Breakout performance</h2>
                          <p>The distance–speed relationship, measured.</p>
                        </div>
                        <span className="pill muted-pill">15 M TEST</span>
                      </div>
                      {tests.length ? (
                        <Suspense
                          fallback={
                            <div className="chart-empty">
                              Loading performance chart…
                            </div>
                          }
                        >
                          <PerformanceChart tests={sorted} best={best} />
                        </Suspense>
                      ) : (
                        <div className="chart-empty">
                          <div className="empty-chart-lines">
                            <TrendingDown size={40} strokeWidth={1} />
                          </div>
                          <h3>Your next breakthrough starts here.</h3>
                          <p>
                            Add your first test or load the demo to explore your
                            performance.
                          </p>
                          <button className="text-button" onClick={loadDemo}>
                            Explore demo data <ArrowRight size={15} />
                          </button>
                        </div>
                      )}
                      <div className="chart-footer">
                        <div>
                          <span className="legend-dot blue" />
                          Observed test
                          <span className="legend-dot green" />
                          Best performance
                        </div>
                        <span>
                          Lower time is faster <ArrowDownRight size={13} />
                        </span>
                      </div>
                    </section>
                    <section className="panel optimal-card">
                      <div className="optimal-heading">
                        <span className="trophy-icon">
                          <Trophy size={18} />
                        </span>
                        <span>OPTIMAL UNDERWATER</span>
                        <Info
                          size={15}
                          aria-label="Based on the fastest observed test"
                        />
                      </div>
                      <div className="best-observed-label">
                        BEST OBSERVED PERFORMANCE
                      </div>
                      <div className="optimal-distance">
                        {best ? best.distance.toFixed(1) : "—"}
                        <span>m</span>
                      </div>
                      <p className="optimal-description">
                        {best
                          ? "Your breakout sweet spot."
                          : "Find your breakout sweet spot."}
                      </p>
                      <div className="optimal-details">
                        <div>
                          <Zap size={15} />
                          <span>Dolphin kicks</span>
                          <strong>{best?.kicks ?? "—"}</strong>
                        </div>
                        <div>
                          <Timer size={15} />
                          <span>15 m time</span>
                          <strong>
                            {best ? `${best.time.toFixed(2)} s` : "—"}
                          </strong>
                        </div>
                      </div>
                      <div className="gain-note">
                        <TrendingDown size={17} />
                        <span>
                          {tests.length > 1 ? (
                            <>
                              <strong>{improvement.toFixed(2)} s faster</strong>{" "}
                              than your slowest test.
                            </>
                          ) : tests.length ? (
                            "Add another test to compare your times."
                          ) : (
                            "Add a test to reveal your strategy."
                          )}
                        </span>
                      </div>
                      <p className="optimal-disclaimer">
                        {tied.length > 1
                          ? `${tied.length} tests share the fastest time. Showing the shortest breakout. `
                          : ""}
                        Based on your recorded tests, not a guaranteed
                        physiological optimum.
                      </p>
                    </section>
                  </div>
                  <section className="panel pool-panel">
                    <div className="panel-heading">
                      <div>
                        <h2>Your underwater, visualized</h2>
                        <p>From the wall to the surface.</p>
                      </div>
                      <span className="limit-label">
                        <span />
                        15 m regulatory limit
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
                        {best && (
                          <div
                            className="breakout-marker"
                            style={{ left: `${(best.distance / 15) * 100}%` }}
                          >
                            <div
                              className={`marker-label ${best.distance > 12 ? "right-edge" : best.distance < 3 ? "left-edge" : ""}`}
                            >
                              <span />
                              {best.distance.toFixed(1)} m{" "}
                              <span className="marker-word">BREAKOUT</span>
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
                    <div className="pool-footnote">
                      <Info size={13} />
                      {best
                        ? `Highlighted: best observed breakout for ${profile.stroke.toLowerCase()}, ${profile.event} m.`
                        : "Your best observed breakout will appear here."}
                      <span>Head must break the surface by 15 m.</span>
                    </div>
                  </section>
                </>
              )}
              <div className={tab === "Dashboard" ? "entry-grid" : ""}>
                <section ref={formRef} className="panel add-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>
                        <Plus size={18} />
                        Add a test
                      </h2>
                      <p>One observation closer to your fastest breakout.</p>
                    </div>
                    <span className="step-badge">01—15 M</span>
                  </div>
                  <TestForm
                    key={profileKey(profile)}
                    tests={tests}
                    onSave={addTest}
                  />
                </section>
                {tab === "Dashboard" && (
                  <section className="panel insights-panel">
                    <div className="panel-heading">
                      <div>
                        <h2>
                          <Sparkles size={17} />
                          From the data
                        </h2>
                        <p>Clear observations. No black box.</p>
                      </div>
                    </div>
                    <div className="insights">
                      {!best ? (
                        <div className="insight">
                          <span className="insight-number">01</span>
                          <div>
                            <h3>Start with a baseline.</h3>
                            <p>
                              Record a test to see your fastest observed
                              breakout. Add different distances to compare.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="insight">
                            <span className="insight-number">01</span>
                            <div>
                              <h3>
                                {tied.length > 1
                                  ? "A shared fastest result."
                                  : "Your fastest observed breakout."}
                              </h3>
                              <p>
                                {best.distance.toFixed(1)} m with {best.kicks}{" "}
                                dolphin kicks produced{" "}
                                {tied.length > 1 ? "a joint-best" : "your best"}{" "}
                                15 m time of{" "}
                                <strong>{best.time.toFixed(2)} s</strong>.
                              </p>
                            </div>
                          </div>
                          <div className="insight">
                            <span className="insight-number">02</span>
                            <div>
                              <h3>
                                {longer
                                  ? "Longer isn’t always faster."
                                  : "Keep exploring your range."}
                              </h3>
                              <p>
                                {longer ? (
                                  <>
                                    The {longer.distance.toFixed(1)} m test was{" "}
                                    <strong>
                                      {(longer.time - best.time).toFixed(2)} s
                                      slower
                                    </strong>{" "}
                                    than the {best.distance.toFixed(1)} m test.
                                    This comparison does not prove causation.
                                  </>
                                ) : (
                                  "Test more breakout distances under similar conditions before drawing a broader conclusion."
                                )}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                      <div className="insight-footer">
                        <Radio size={14} />
                        <span>
                          {tests.length < 2
                            ? "More observations build a clearer picture."
                            : "Repeat each distance to check consistency."}
                        </span>
                      </div>
                    </div>
                  </section>
                )}
              </div>
              <section className="panel table-panel">
                <div className="panel-heading">
                  <div>
                    <h2>
                      Test log{" "}
                      <span className="count-badge">{tests.length}</span>
                    </h2>
                    <p>Every observation, in one place.</p>
                  </div>
                  <div className="table-tools">
                    <span>
                      <ListFilter size={14} />
                      Breakout ↑
                    </span>
                    <button
                      className="text-button danger-text"
                      disabled={!tests.length}
                      onClick={() => setConfirmation({ type: "clear" })}
                    >
                      <Trash2 size={14} />
                      Clear data
                    </button>
                  </div>
                </div>
                {!tests.length ? (
                  <div className="table-empty">
                    <FlaskConical size={26} />
                    <h3>No tests recorded yet.</h3>
                    <p>
                      Your tests for {profile.stroke.toLowerCase()},{" "}
                      {profile.event} m will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>TEST</th>
                          <th>BREAKOUT</th>
                          <th>KICKS</th>
                          <th>15 M TIME</th>
                          <th>Δ FROM BEST</th>
                          <th>NOTES</th>
                          <th>
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((t) => (
                          <tr
                            key={t.id}
                            className={t.time === best?.time ? "best-row" : ""}
                          >
                            <td>
                              <span className="test-name">
                                {t.time === best?.time ? (
                                  <span className="row-dot green" />
                                ) : (
                                  <span className="row-dot" />
                                )}
                                Test{" "}
                                {tests.findIndex((item) => item.id === t.id) +
                                  1 <
                                10
                                  ? "0"
                                  : ""}
                                {tests.findIndex((item) => item.id === t.id) +
                                  1}
                                {t.time === best?.time && (
                                  <span className="best-badge">BEST</span>
                                )}
                              </span>
                            </td>
                            <td>
                              {t.distance.toFixed(1)}{" "}
                              <span className="muted">m</span>
                            </td>
                            <td>{t.kicks}</td>
                            <td>
                              <strong>
                                {t.time.toFixed(2)}{" "}
                                <span className="muted">s</span>
                              </strong>
                            </td>
                            <td
                              className={
                                t.time === best?.time ? "accent" : "muted"
                              }
                            >
                              {t.time === best?.time
                                ? "—"
                                : `+${(t.time - best!.time).toFixed(2)} s`}
                            </td>
                            <td className="notes-cell" title={t.notes}>
                              {t.notes || "—"}
                            </td>
                            <td>
                              <div className="row-actions">
                                <button
                                  className="icon-button"
                                  aria-label={`Edit test ${tests.findIndex((item) => item.id === t.id) + 1}`}
                                  onClick={() => setEditing(t)}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  className="icon-button delete-button"
                                  aria-label={`Delete test ${tests.findIndex((item) => item.id === t.id) + 1}`}
                                  onClick={() =>
                                    setConfirmation({
                                      type: "delete",
                                      id: t.id,
                                    })
                                  }
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="table-footer">
                  <span>
                    <Database size={13} />
                    {storageError
                      ? "Changes held in this tab only"
                      : "Saved locally. Your data stays in this browser."}
                  </span>
                  <span>
                    {tests.length} observation{tests.length === 1 ? "" : "s"}
                    {worst && tests.length > 1
                      ? ` · ${best!.time.toFixed(2)}–${worst.time.toFixed(2)} s`
                      : ""}
                  </span>
                </div>
              </section>
            </>
          )}
          <footer className="page-footer">
            <span>
              <Waves size={16} />
              UNDERWATER OPTIMIZER<span className="footer-version">V0.1</span>
            </span>
            <p>Measured in the pool. Understood here.</p>
            <button onClick={() => setHelp(true)}>
              About the analysis <ArrowUpRight size={12} />
            </button>
          </footer>
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <Check size={17} />
          {notice}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {editing && (
        <Dialog title="Edit test" onClose={() => setEditing(null)}>
          <p className="modal-description">
            Update this observation for {editing.stroke}, {editing.event} m.
          </p>
          <TestForm
            initial={editing}
            tests={tests}
            onCancel={() => setEditing(null)}
            onSave={(input) => {
              setData((previous) => ({
                ...previous,
                tests: previous.tests.map((t) =>
                  t.id === editing.id ? { ...t, ...input } : t,
                ),
              }));
              setEditing(null);
              setNotice("Test updated.");
            }}
          />
        </Dialog>
      )}
      {confirmation && (
        <Dialog
          title={
            confirmation.type === "demo"
              ? "Replace with demo data?"
              : confirmation.type === "clear"
                ? "Clear these tests?"
                : "Delete this test?"
          }
          onClose={() => setConfirmation(null)}
        >
          <p className="modal-description">
            {confirmation.type === "demo"
              ? `This replaces the tests for ${profile.stroke}, ${profile.event} m with four demo observations.`
              : confirmation.type === "clear"
                ? `All ${tests.length} tests for ${profile.stroke}, ${profile.event} m will be removed. Your other stroke and event data will be kept.`
                : "This observation will be permanently removed from this browser."}{" "}
            This action cannot be undone.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setConfirmation(null)}
            >
              Cancel
            </button>
            <button
              className={`button ${confirmation.type === "demo" ? "primary" : "danger"}`}
              onClick={confirmAction}
            >
              {confirmation.type === "demo"
                ? "Load demo data"
                : confirmation.type === "clear"
                  ? "Clear tests"
                  : "Delete test"}
            </button>
          </div>
        </Dialog>
      )}
      {help && (
        <Dialog
          title="Your data. Your fastest breakout."
          onClose={() => setHelp(false)}
        >
          <div className="help-content">
            <p>
              Record the distance where your head breaks the surface, your
              dolphin kicks, and your time from the start or turn to 15 meters.
              Keep starts and turns, timing methods, and effort consistent when
              comparing tests.
            </p>
            <h3>How the analysis works</h3>
            <p>
              The fastest entered 15 m time is your best observed performance.
              Time gain compares that result with the slowest test for the
              selected stroke and event. All fastest ties are highlighted; the
              summary shows the shortest tied breakout.
            </p>
            <p>
              Repeated and similar tests are retained individually. The chart
              uses a 0–15 m horizontal axis and a vertical time axis starting at
              zero. Exact overlapping points can be read separately in the test
              log.
            </p>
            <h3>Know the limits</h3>
            <p>
              Freestyle, backstroke and butterfly require the head to break the
              surface by 15 m after a start or turn. V0.1 provides observations,
              not a validated biomechanical model, medical advice, or a
              guarantee of race performance.
            </p>
            <h3>Private to this browser</h3>
            <p>
              There is no account or cloud sync. Data is stored in this browser
              when storage is available. Clearing browser data removes it.
              Personal best is contextual and does not influence the
              calculations.
            </p>
            <button
              className="button primary"
              onClick={() => {
                setHelp(false);
                jumpToForm();
              }}
            >
              Record a test
              <Plus size={16} />
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
export default App;
