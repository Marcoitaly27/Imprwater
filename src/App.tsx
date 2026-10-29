import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  Check,
  CircleHelp,
  Database,
  Download,
  FlaskConical,
  LayoutDashboard,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Upload,
  Users,
  Waves,
  X,
  ChevronRight,
  Timer,
  Target,
  Zap,
} from "lucide-react";
import type { AppData, Athlete, Session, Trial, TrialInput } from "./lib/model";
import {
  addDemo,
  analyze,
  decimal,
  sessionComplete,
  sessionTests,
} from "./lib/model";
import { loadData, parseBackup, saveData } from "./lib/storage";
import { csvForSession, download } from "./lib/export";
import { Dialog } from "./components/Dialog";
import { NameForm, SessionForm } from "./components/ContextForms";
import { TestForm } from "./components/TestForm";
import { PoolLane } from "./components/PoolLane";
import { TrialLog } from "./components/TrialLog";
import { Statistics } from "./components/Statistics";
import { WorkspaceMenu } from "./components/WorkspaceMenu";
const PerformanceChart = lazy(() =>
  import("./components/PerformanceChart").then((m) => ({
    default: m.PerformanceChart,
  })),
);
type Modal =
  | { type: "athlete"; athlete?: Athlete }
  | { type: "session"; session?: Session }
  | { type: "test"; test?: Trial; repeat?: Trial }
  | { type: "move"; test: Trial }
  | { type: "help" };
type Confirm = { title: string; description: string; action: () => void };
export default function App() {
  const [loaded] = useState(loadData);
  const [data, setData] = useState<AppData>(loaded.data);
  const [storageError, setStorageError] = useState(loaded.error);
  const [savingEnabled, setSavingEnabled] = useState(!loaded.error);
  const [notice, setNotice] = useState(
    loaded.migrated
      ? "Previous data recovered. Complete imported session conditions before comparing tests."
      : "",
  );
  const [tab, setTab] = useState("Dashboard");
  const [modal, setModal] = useState<Modal | null>(null);
  const [confirmation, setConfirmation] = useState<Confirm | null>(null);
  const [pendingBackup, setPendingBackup] = useState<AppData | null>(null);
  const [importError, setImportError] = useState("");
  const [moveTarget, setMoveTarget] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const athlete = data.athletes.find((a) => a.id === data.selectedAthleteId);
  const sessions = data.sessions.filter((s) => s.athleteId === athlete?.id);
  const session = sessions.find((s) => s.id === data.selectedSessionId);
  const tests = sessionTests(data, session);
  const analysis = analyze(tests);
  const { sorted, best, spread, tied } = analysis;
  const ready = !!session && sessionComplete(session);
  const last = [...tests].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];
  useEffect(() => {
    if (savingEnabled) setStorageError(saveData(data));
  }, [data, savingEnabled]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(t);
  }, [notice]);
  function selectAthlete(id: string) {
    setData((d) => ({
      ...d,
      selectedAthleteId: id,
      selectedSessionId: d.sessions.find((s) => s.athleteId === id)?.id ?? null,
    }));
  }
  function demo() {
    const demoAthlete = data.athletes.find((a) => a.isDemo);
    if (demoAthlete) {
      selectAthlete(demoAthlete.id);
    } else setData(addDemo);
    setTab("Dashboard");
    setNotice(
      "Separate demo workspace selected. Your real observations were kept.",
    );
  }
  function saveTrial(input: TrialInput) {
    if (!session) return;
    const existing = modal?.type === "test" ? modal.test : undefined;
    setData((d) => ({
      ...d,
      tests: existing
        ? d.tests.map((t) => (t.id === existing.id ? { ...t, ...input } : t))
        : [
            ...d.tests,
            {
              ...input,
              id: crypto.randomUUID(),
              sessionId: session.id,
              createdAt: new Date().toISOString(),
            },
          ],
    }));
    setModal(null);
    setNotice(existing ? "Observation updated." : "Observation added.");
  }
  async function readBackup(file: File | undefined) {
    setImportError("");
    if (!file) return;
    try {
      if (file.size > 10_000_000)
        throw new Error("Backup exceeds the 10 MB limit.");
      setPendingBackup(parseBackup(await file.text()));
    } catch (e) {
      setImportError(
        `Import rejected: ${e instanceof Error ? e.message : "Invalid file"}. Current data is unchanged.`,
      );
    }
  }
  function restore() {
    if (!pendingBackup) return;
    const error = saveData(pendingBackup);
    if (error) {
      setImportError(`Restore was not applied. ${error}`);
      return;
    }
    setData(pendingBackup);
    setPendingBackup(null);
    setStorageError(null);
    setSavingEnabled(true);
    setImportError("");
    setNotice("Backup restored and saved in this browser.");
  }
  const testLog = (
    <TrialLog
      tests={sorted}
      bestTime={ready ? best?.time : undefined}
      onEdit={(test) => setModal({ type: "test", test })}
      onMove={(test) => {
        setMoveTarget("");
        setModal({ type: "move", test });
      }}
      onDelete={(test) =>
        setConfirmation({
          title: "Delete this observation?",
          description:
            "This removes one observation from this browser. It cannot be undone.",
          action: () => {
            setData((d) => ({
              ...d,
              tests: d.tests.filter((t) => t.id !== test.id),
            }));
            setNotice("Observation deleted.");
          },
        })
      }
      onDemo={demo}
      onClear={() =>
        setConfirmation({
          title: "Clear session tests?",
          description: `Remove all ${tests.length} observations from “${session?.name}”? Other sessions are kept. This cannot be undone.`,
          action: () => {
            setData((d) => ({
              ...d,
              tests: d.tests.filter((t) => t.sessionId !== session?.id),
            }));
            setNotice("Session observations cleared.");
          },
        })
      }
    />
  );
  return (
    <>
      <div className="app-shell no-print">
        <div className="main-shell">
          <header className="topbar">
            <a
              href="#"
              className="brand"
              onClick={(e) => {
                e.preventDefault();
                setTab("Dashboard");
              }}
            >
              <span className="brand-mark">
                <Waves size={27} />
              </span>
              <span>
                UNDERWATER ADVANTAGE<small>Find your fastest breakout</small>
              </span>
            </a>
            <section className="context-pill" aria-label="Athlete and session">
              <span className="context-avatar" aria-hidden="true">
                {athlete
                  ? athlete.name
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "SW"}
              </span>
              <div className="context-selectors">
                <div>
                  <label htmlFor="athlete">Athlete</label>
                  <div className="select-actions">
                    <select
                      id="athlete"
                      value={athlete?.id ?? ""}
                      onChange={(e) => selectAthlete(e.target.value)}
                    >
                      <option value="" disabled>
                        Select athlete
                      </option>
                      {data.athletes.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                          {a.isDemo ? " · DEMO" : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      className="icon-button"
                      aria-label="Create athlete"
                      onClick={() => setModal({ type: "athlete" })}
                    >
                      <Plus size={20} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Rename athlete"
                      disabled={!athlete}
                      onClick={() => setModal({ type: "athlete", athlete })}
                    >
                      <Pencil size={17} />
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="session">Session</label>
                  <div className="select-actions">
                    <select
                      id="session"
                      value={session?.id ?? ""}
                      onChange={(e) =>
                        setData((d) => ({
                          ...d,
                          selectedSessionId: e.target.value,
                        }))
                      }
                    >
                      <option value="" disabled>
                        Select session
                      </option>
                      {sessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {!sessionComplete(s) ? " · incomplete" : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      className="icon-button"
                      aria-label="Create session"
                      disabled={!athlete}
                      onClick={() => setModal({ type: "session" })}
                    >
                      <Plus size={20} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label="Edit session"
                      disabled={!session}
                      onClick={() => setModal({ type: "session", session })}
                    >
                      <Pencil size={17} />
                    </button>
                  </div>
                </div>
              </div>
              {session && (
                <small className="header-session-conditions">
                  {session.pool ? `${session.pool} m` : "Pool ?"} ·{" "}
                  {session.startType ?? "Start ?"} · {session.stroke}
                  {athlete?.isDemo && (
                    <strong className="demo-tag"> · DEMO</strong>
                  )}
                </small>
              )}
            </section>
            <div className="topbar-actions">
              <button className="button demo-button" onClick={demo}>
                <Database size={15} />
                <span>Load demo data</span>
              </button>
              <WorkspaceMenu>
                {" "}
                <div className="workspace-utilities">
                  <div className="toolbar-actions">
                    <button
                      className="button secondary"
                      disabled={!tests.length}
                      onClick={() =>
                        session &&
                        download(
                          csvForSession(data, session),
                          "underwater-session.csv",
                          "text/csv;charset=utf-8",
                        )
                      }
                    >
                      <Download size={16} />
                      Export CSV
                    </button>
                    <button
                      className="button secondary"
                      onClick={() =>
                        download(
                          JSON.stringify(data, null, 2),
                          "underwater-backup.json",
                          "application/json",
                        )
                      }
                    >
                      <Download size={16} />
                      Backup JSON
                    </button>
                    <button
                      className="button secondary"
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload size={16} />
                      Restore backup
                    </button>
                    <button
                      className="button secondary"
                      disabled={!session}
                      onClick={() => window.print()}
                    >
                      <Printer size={16} />
                      Print summary
                    </button>
                    <input
                      className="sr-only"
                      type="file"
                      accept=".json,application/json"
                      aria-label="Backup file"
                      ref={fileRef}
                      onChange={(e) => {
                        void readBackup(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  <p>Local to this browser · no device sync</p>
                </div>
                <button
                  className="menu-help"
                  onClick={() => setModal({ type: "help" })}
                >
                  <CircleHelp size={16} />
                  About the analysis
                </button>
              </WorkspaceMenu>
            </div>
          </header>
          <main>
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  <span />
                  PERFORMANCE LAB <ChevronRight size={12} /> UNDERWATER ANALYSIS
                </div>
                <h1>
                  {tab === "Simulator"
                    ? "Your next race, reimagined."
                    : tab === "Tests"
                      ? "Every test tells a story."
                      : "Make every meter count."}
                </h1>
                <p>
                  Your data. A clearer breakout. Built for the edge of the pool.
                </p>
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
                    <Icon size={16} />
                    <span>{name}</span>
                    {name === "Simulator" && <small>SOON</small>}
                  </button>
                ))}
              </nav>
            </div>
            {storageError && (
              <div className="storage-banner" role="alert">
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
                <button
                  className="button secondary"
                  onClick={() =>
                    download(
                      JSON.stringify(data, null, 2),
                      "underwater-backup.json",
                      "application/json",
                    )
                  }
                >
                  Download backup
                </button>
              </div>
            )}
            {importError && (
              <div className="storage-banner" role="alert">
                {importError}
                <button
                  className="icon-button"
                  aria-label="Dismiss import error"
                  onClick={() => setImportError("")}
                >
                  <X size={18} />
                </button>
              </div>
            )}
            {!athlete ? (
              <section className="panel welcome-panel">
                <Users size={36} />
                <h2>Your next breakthrough starts here.</h2>
                <p>
                  Create an athlete and a session, then record comparable
                  underwater tests. Or explore the demo without touching your
                  real data.
                </p>
                <button
                  className="button primary"
                  onClick={() => setModal({ type: "athlete" })}
                >
                  <Plus size={18} />
                  Create athlete
                </button>
              </section>
            ) : !session ? (
              <section className="panel welcome-panel">
                <h2>Start a session for {athlete.name}.</h2>
                <p>
                  Set the date, stroke, event, pool and start type before
                  collecting observations.
                </p>
                <button
                  className="button primary"
                  onClick={() => setModal({ type: "session" })}
                >
                  Create session
                  <Plus size={18} />
                </button>
              </section>
            ) : (
              <>
                {!ready && (
                  <div className="incomplete-banner">
                    <h2>Imported session · conditions need review</h2>
                    <p>
                      Date, pool length and start type were not recorded in
                      V0.1. No conditions have been inferred, and no performance
                      comparison is shown yet. Check whether these observations
                      actually belong to the same session.
                    </p>
                    <p>
                      If conditions differed, create the appropriate sessions
                      and use each test’s “Move” action first. Then complete
                      this session only with conditions you know.
                    </p>
                    <button
                      className="button secondary"
                      onClick={() => setModal({ type: "session", session })}
                    >
                      Complete session conditions
                    </button>
                  </div>
                )}
                {tab === "Simulator" ? (
                  <section className="simulator panel">
                    <Activity size={38} />
                    <span className="pill">COMING SOON</span>
                    <h2>A full race simulator is planned.</h2>
                    <p>
                      For now, explore your measured tests. No race prediction
                      is provided.
                    </p>
                    <button
                      className="button primary"
                      onClick={() => setTab("Dashboard")}
                    >
                      Back to dashboard
                      <ArrowRight size={17} />
                    </button>
                  </section>
                ) : (
                  <>
                    <div className="record-toolbar">
                      <div>
                        <h2>{session.name}</h2>
                        <p>
                          {athlete.name} · {session.date ?? "Date unknown"} ·{" "}
                          {session.stroke}, {session.event} m ·{" "}
                          {session.pool ?? "?"} m pool ·{" "}
                          {session.startType ?? "Start unknown"}
                        </p>
                      </div>
                      <div>
                        <button
                          className="button secondary"
                          disabled={!ready || !last}
                          onClick={() =>
                            setModal({ type: "test", repeat: last })
                          }
                        >
                          <RotateCcw size={17} />
                          Repeat last test
                        </button>
                        <button
                          className="button primary"
                          disabled={!ready}
                          onClick={() => setModal({ type: "test" })}
                        >
                          <Plus size={18} />
                          New test
                        </button>
                      </div>
                    </div>
                    {ready && (
                      <div className="stats-grid">
                        <Stat
                          title="BEST 15 M TIME"
                          value={best ? best.time.toFixed(2) : "—"}
                          unit="s"
                          icon={<Timer size={19} />}
                          note={
                            tests.length > 1
                              ? `Best–worst difference: ${spread.toFixed(2)} s`
                              : "Record a test to set your benchmark"
                          }
                          badge={tests.length > 1}
                        />
                        <Stat
                          title="BEST OBSERVED BREAKOUT"
                          value={best ? String(best.distance) : "—"}
                          unit="m"
                          icon={<Target size={19} />}
                          note="Distance at your fastest observed time"
                        />
                        <Stat
                          title="KICKS AT BEST TEST"
                          value={best ? String(best.kicks) : "—"}
                          unit="kicks"
                          icon={<Zap size={19} />}
                          note={
                            tied.length > 1
                              ? `${tied.length} fastest ties · shortest breakout shown`
                              : "Recorded at the best individual test"
                          }
                        />
                        <Stat
                          title="SESSION OBSERVATIONS"
                          value={String(tests.length).padStart(2, "0")}
                          unit="tests"
                          icon={<FlaskConical size={19} />}
                          note="Same athlete. Same session. Real observations."
                        />
                      </div>
                    )}
                    {ready && tab === "Dashboard" && (
                      <>
                        <PoolLane distance={best?.distance} time={best?.time} />
                        <div className="best-observation-strip v2-best">
                          <span className="observation-label">
                            <Target size={16} />
                            BEST OBSERVED TEST
                          </span>
                          <strong>
                            {best
                              ? `${best.distance} m · ${best.kicks} kicks · ${best.time.toFixed(2)} s`
                              : "No observations yet"}
                          </strong>
                          <p>
                            {tied.length > 1
                              ? `${tied.length} fastest ties. The summary shows the shortest tied distance. `
                              : ""}
                            {analysis.preliminary
                              ? "Preliminary result. Collect more comparable repeats. "
                              : "Descriptive result. "}
                            Not a guaranteed physiological optimum. Best–worst
                            difference describes session spread, not training
                            progress.
                          </p>
                        </div>
                        <div className="analysis-grid">
                          <section className="panel chart-panel">
                            <div className="panel-heading">
                              <div>
                                <span className="section-kicker">
                                  OBSERVE. COMPARE. REFINE.
                                </span>
                                <h2>Distance–time relationship</h2>
                                <p>
                                  Find the fastest result among your recorded
                                  tests.
                                </p>
                              </div>
                              <span className="live-label">
                                <span />
                                SESSION DATA
                              </span>
                            </div>
                            {tests.length ? (
                              <Suspense
                                fallback={
                                  <div className="chart-empty">
                                    Loading performance chart…
                                  </div>
                                }
                              >
                                <PerformanceChart
                                  key={session.id}
                                  tests={sorted}
                                  best={best}
                                />
                              </Suspense>
                            ) : (
                              <div className="chart-empty">
                                <Activity size={36} />
                                <h3>Your performance, in perspective.</h3>
                                <p>
                                  Record your first test using the form beside
                                  this chart.
                                </p>
                                <button className="text-button" onClick={demo}>
                                  Explore demo data <ArrowRight size={15} />
                                </button>
                              </div>
                            )}
                          </section>
                          <section className="panel quick-entry">
                            <div className="panel-heading">
                              <div>
                                <span className="section-kicker">
                                  POOLSIDE READY
                                </span>
                                <h2>Quick test entry</h2>
                                <p>
                                  One more observation. One clearer picture.
                                </p>
                              </div>
                              <span className="entry-icon">
                                <Plus size={19} />
                              </span>
                            </div>
                            <TestForm
                              key={session.id}
                              inline
                              tests={tests}
                              onSave={saveTrial}
                              onCancel={() => {}}
                            />
                          </section>
                        </div>
                      </>
                    )}
                    {ready && <Statistics tests={tests} />}
                    {testLog}
                    {ready && (
                      <section className="panel practice-panel">
                        <h2>Make the next comparison count.</h2>
                        <p>
                          Keep timing method, effort, rest and conditions
                          similar. Test each distance more than once. A change
                          in recorded time does not prove that distance caused
                          it.
                        </p>
                        {athlete && (
                          <PersonalBest
                            key={`${athlete.id}-${session.stroke}-${session.event}`}
                            value={
                              athlete.personalBests[
                                `${session.stroke}-${session.event}`
                              ] ?? ""
                            }
                            onSave={(value) =>
                              setData((d) => ({
                                ...d,
                                athletes: d.athletes.map((a) =>
                                  a.id === athlete.id
                                    ? {
                                        ...a,
                                        personalBests: {
                                          ...a.personalBests,
                                          [`${session.stroke}-${session.event}`]:
                                            value,
                                        },
                                      }
                                    : a,
                                ),
                              }))
                            }
                          />
                        )}
                      </section>
                    )}
                  </>
                )}
              </>
            )}
            <footer className="page-footer">
              <span>
                <Waves size={18} />
                UNDERWATER ADVANTAGE · V0.2
              </span>
              <p>Observed performance, not a validated biomechanical model.</p>
              <button onClick={() => setModal({ type: "help" })}>
                About the analysis
              </button>
            </footer>
          </main>
        </div>
        {ready && tab !== "Simulator" && (
          <button
            className="mobile-new button primary"
            onClick={() => setModal({ type: "test" })}
          >
            <Plus size={20} />
            New test
          </button>
        )}
        {notice && (
          <div className="toast" role="status">
            <Check size={18} />
            {notice}
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X size={17} />
            </button>
          </div>
        )}
        {modal?.type === "athlete" && (
          <Dialog
            title={modal.athlete ? "Rename athlete" : "Create athlete"}
            onClose={() => setModal(null)}
          >
            <NameForm
              initial={modal.athlete?.name}
              onCancel={() => setModal(null)}
              onSave={(name) => {
                const existing = modal.athlete;
                if (existing)
                  setData((d) => ({
                    ...d,
                    athletes: d.athletes.map((a) =>
                      a.id === existing.id ? { ...a, name } : a,
                    ),
                  }));
                else {
                  const id = crypto.randomUUID();
                  setData((d) => ({
                    ...d,
                    athletes: [
                      ...d.athletes,
                      { id, name, isDemo: false, personalBests: {} },
                    ],
                    selectedAthleteId: id,
                    selectedSessionId: null,
                  }));
                }
                setModal(null);
              }}
            />
          </Dialog>
        )}
        {modal?.type === "session" && athlete && (
          <Dialog
            title={modal.session ? "Edit session" : "Create session"}
            onClose={() => setModal(null)}
          >
            <SessionForm
              initial={modal.session}
              hasTests={
                !!modal.session &&
                data.tests.some((t) => t.sessionId === modal.session!.id)
              }
              onCancel={() => setModal(null)}
              onSave={(values) => {
                const existing = modal.session;
                if (existing)
                  setData((d) => ({
                    ...d,
                    sessions: d.sessions.map((s) =>
                      s.id === existing.id ? { ...s, ...values } : s,
                    ),
                  }));
                else {
                  const id = crypto.randomUUID();
                  setData((d) => ({
                    ...d,
                    sessions: [
                      ...d.sessions,
                      { ...values, id, athleteId: athlete.id, imported: false },
                    ],
                    selectedSessionId: id,
                  }));
                }
                setModal(null);
                setNotice("Session saved.");
              }}
            />
          </Dialog>
        )}
        {modal?.type === "test" && (
          <Dialog
            title={
              modal.test
                ? "Edit observation"
                : modal.repeat
                  ? "Repeat last test"
                  : "New test"
            }
            onClose={() => setModal(null)}
          >
            <p className="modal-description">
              {athlete?.name} · {session?.name}
            </p>
            <TestForm
              tests={tests}
              initial={modal.test}
              repeat={modal.repeat}
              onSave={saveTrial}
              onCancel={() => setModal(null)}
            />
          </Dialog>
        )}
        {modal?.type === "move" && (
          <Dialog title="Move observation" onClose={() => setModal(null)}>
            <div className="context-form">
              <p>
                Move this test into the correct session for the same athlete,
                stroke and event. Verify the actual date, pool and start type
                before moving.
              </p>
              <label>
                Destination session
                <select
                  value={moveTarget}
                  onChange={(e) => setMoveTarget(e.target.value)}
                >
                  <option value="" disabled>
                    Select destination
                  </option>
                  {sessions
                    .filter(
                      (s) =>
                        s.id !== session?.id &&
                        s.stroke === session?.stroke &&
                        s.event === session?.event,
                    )
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.date ?? "Date unknown"} · {s.pool ?? "?"}{" "}
                        m · {s.startType ?? "Start unknown"}
                      </option>
                    ))}
                </select>
              </label>
              <p className="muted">
                If no destination is available, cancel and create a session with
                matching stroke and event first.
              </p>
              <div className="modal-actions">
                <button
                  className="button secondary"
                  onClick={() => setModal(null)}
                >
                  Cancel
                </button>
                <button
                  className="button primary"
                  disabled={!moveTarget}
                  onClick={() => {
                    const id = modal.test.id;
                    setData((d) => ({
                      ...d,
                      tests: d.tests.map((t) =>
                        t.id === id ? { ...t, sessionId: moveTarget } : t,
                      ),
                    }));
                    setModal(null);
                    setNotice(
                      "Observation moved; original measurements and ID preserved.",
                    );
                  }}
                >
                  Move observation
                </button>
              </div>
            </div>
          </Dialog>
        )}
        {modal?.type === "help" && (
          <Dialog
            title="Your data. Clearer observations."
            onClose={() => setModal(null)}
          >
            <div className="help-content">
              <h3>What is compared?</h3>
              <p>
                Only observations in the selected session for one athlete. Each
                session records date, stroke, event, pool and start type.
                Timing, rest and effort should also be similar; record
                differences in notes. Historical sessions are kept separate.
              </p>
              <h3>What do the results mean?</h3>
              <p>
                Best observed test means the lowest entered time. The lowest
                mean is a separate descriptive summary by exact distance; it
                does not establish a reliable strategy. Best–worst difference
                describes the session spread, not training progress. All fastest
                ties are retained.
              </p>
              <h3>Keep a copy</h3>
              <p>
                Data remains in this browser and origin. There is no cloud sync,
                account or automatic backup. Use Backup JSON for a complete copy
                and CSV for the selected session. Restore validates a file and
                asks before replacing data. Use one tab for editing.
              </p>
              <h3>Limits</h3>
              <p>
                In freestyle, backstroke and butterfly, the head must break the
                surface by 15 m after a start or turn. Breaststroke is excluded.
                No medical advice, biomechanical validation, race prediction or
                guaranteed performance is provided.
              </p>
            </div>
          </Dialog>
        )}
        {confirmation && (
          <Dialog
            title={confirmation.title}
            onClose={() => setConfirmation(null)}
          >
            <p className="modal-description">{confirmation.description}</p>
            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => setConfirmation(null)}
              >
                Cancel
              </button>
              <button
                className="button danger"
                onClick={() => {
                  confirmation.action();
                  setConfirmation(null);
                }}
              >
                Confirm removal
              </button>
            </div>
          </Dialog>
        )}
        {pendingBackup && (
          <Dialog
            title="Review backup before restore"
            onClose={() => setPendingBackup(null)}
          >
            <div className="help-content">
              <p>
                Incoming backup:{" "}
                <strong>
                  {pendingBackup.athletes.length} athletes,{" "}
                  {pendingBackup.sessions.length} sessions,{" "}
                  {pendingBackup.tests.length} observations.
                </strong>
              </p>
              <ul>
                {pendingBackup.athletes.map((a) => (
                  <li key={a.id}>
                    {a.name}
                    {a.isDemo ? " (demo)" : ""} ·{" "}
                    {
                      pendingBackup.sessions.filter((s) => s.athleteId === a.id)
                        .length
                    }{" "}
                    sessions
                  </li>
                ))}
              </ul>
              <details className="backup-session-list">
                <summary>Review incoming sessions</summary>
                <ul>
                  {pendingBackup.sessions.map((s) => (
                    <li key={s.id}>
                      <strong>{s.name}</strong> ·{" "}
                      {
                        pendingBackup.athletes.find((a) => a.id === s.athleteId)
                          ?.name
                      }{" "}
                      · {s.date ?? "Date unknown"} · {s.stroke} {s.event} m ·{" "}
                      {s.pool ?? "?"} m pool · {s.startType ?? "Start unknown"}{" "}
                      ·{" "}
                      {
                        pendingBackup.tests.filter((t) => t.sessionId === s.id)
                          .length
                      }{" "}
                      tests
                    </li>
                  ))}
                </ul>
              </details>
              <p>
                {
                  pendingBackup.sessions.filter((s) => !sessionComplete(s))
                    .length
                }{" "}
                sessions have incomplete conditions; comparisons stay disabled
                until reviewed.
              </p>
              <p>
                <strong>This replaces all current data in this browser:</strong>{" "}
                {data.athletes.length} athletes, {data.sessions.length} sessions
                and {data.tests.length} observations. It is not a merge and
                cannot be undone. Download your current backup first.
              </p>
              {importError && (
                <p className="error" role="alert">
                  {importError}
                </p>
              )}
              <button
                className="button secondary"
                onClick={() =>
                  download(
                    JSON.stringify(data, null, 2),
                    "underwater-before-restore.json",
                    "application/json",
                  )
                }
              >
                Download current backup
              </button>
            </div>
            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => setPendingBackup(null)}
              >
                Cancel
              </button>
              <button className="button primary" onClick={restore}>
                Replace all data and restore
              </button>
            </div>
          </Dialog>
        )}
      </div>
      <section className="print-summary">
        <h1>Underwater Optimizer · Session summary</h1>
        <h2>
          {athlete?.name} · {session?.name}
        </h2>
        <p>
          {session?.date ?? "Unknown date"} · {session?.stroke} {session?.event}{" "}
          m · Pool: {session?.pool ?? "unknown"} m ·{" "}
          {session?.startType ?? "Start unknown"}
        </p>
        {athlete?.isDemo && <p>DEMO DATA</p>}
        {ready && best ? (
          <>
            <p>
              Best observed test: {best.distance} m · {best.kicks} kicks ·{" "}
              {best.time.toFixed(2)} s. {tied.length} fastest observation(s).
            </p>
            <p>
              Best–worst difference:{" "}
              {tests.length > 1
                ? `${spread.toFixed(2)} s`
                : "Not enough observations"}
              .
            </p>
            <Statistics tests={tests} />
          </>
        ) : (
          <p>
            Conditions incomplete or no observations. No comparison is provided.
          </p>
        )}
        <table>
          <thead>
            <tr>
              <th>Test reference</th>
              <th>Breakout</th>
              <th>Kicks</th>
              <th>15 m time</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => (
              <tr key={t.id}>
                <td>
                  {i + 1} · {t.id}
                </td>
                <td>{t.distance} m</td>
                <td>{t.kicks}</td>
                <td>{t.time.toFixed(2)} s</td>
                <td>{t.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Based only on entered observations, not a validated biomechanical
          model or a guarantee of race performance. Comparable timing, effort
          and rest are not independently verified. Head must surface by 15 m for
          freestyle, backstroke and butterfly.
        </p>
        <p>Local browser data · no automatic device sync.</p>
      </section>
    </>
  );
}
function Stat({
  title,
  value,
  unit,
  note,
  icon,
  badge = false,
}: {
  title: string;
  value: string;
  unit: string;
  note: string;
  icon: import("react").ReactNode;
  badge?: boolean;
}) {
  return (
    <div className="stat-card">
      <div className="stat-caption">
        <span>{title}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">
        {value}
        <span>{unit}</span>
      </div>
      <p className={`stat-sub ${badge ? "metric-delta" : ""}`}>
        {badge && <span>↘</span>}
        {note}
      </p>
    </div>
  );
}
function PersonalBest({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [text, setText] = useState(value),
    [error, setError] = useState("");
  return (
    <form
      className="personal-best"
      onSubmit={(e) => {
        e.preventDefault();
        if (
          text.trim() !== "" &&
          (!Number.isFinite(decimal(text)) ||
            decimal(text) <= 0 ||
            decimal(text) > 3600)
        ) {
          setError("Enter a positive time up to 3600 seconds.");
          return;
        }
        onSave(text.trim() === "" ? "" : String(decimal(text)));
        setError("Saved. Context only; not used in calculations.");
      }}
    >
      <label>
        Personal best for this stroke and event (optional, seconds)
        <input
          aria-label="Personal best"
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="52.40"
        />
      </label>
      <button className="button secondary">Save personal best</button>
      <p role="status">{error}</p>
    </form>
  );
}
