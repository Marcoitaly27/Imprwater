import { useState } from "react";
import type { FormEvent } from "react";
import { Info, Minus, Plus, Save, MessageSquare } from "lucide-react";
import type { Trial, TrialInput } from "../lib/model";
import { decimal, validateTrial } from "../lib/model";
export function TestForm({
  initial,
  repeat,
  tests,
  onSave,
  onCancel,
  inline = false,
}: {
  initial?: Trial;
  repeat?: Trial;
  tests: Trial[];
  onSave: (t: TrialInput) => void;
  onCancel: () => void;
  inline?: boolean;
}) {
  const [distance, setDistance] = useState(
    (initial ?? repeat)?.distance.toString() ?? "",
  );
  const [kicks, setKicks] = useState(
    (initial ?? repeat)?.kicks.toString() ?? "",
  );
  const [time, setTime] = useState(initial?.time.toString() ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");
  const similar = tests.some(
    (t) =>
      t.id !== initial?.id && Math.abs(t.distance - decimal(distance)) < 0.25,
  );
  function reset() {
    setDistance("");
    setKicks("");
    setTime("");
    setNotes("");
    setError("");
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    const input = {
      distance: decimal(distance),
      kicks: decimal(kicks),
      time: decimal(time),
      notes: notes.trim(),
    };
    const err = validateTrial(input);
    if (err) {
      setError(err);
      return;
    }
    onSave(input);
    if (inline) reset();
  }
  function step(field: "distance" | "kicks", direction: -1 | 1) {
    const current = decimal(field === "distance" ? distance : kicks);
    const next =
      (Number.isFinite(current) ? current : 0) +
      direction * (field === "distance" ? 0.5 : 1);
    if (field === "distance")
      setDistance(
        String(Math.min(15, Math.max(1, Math.round(next * 100) / 100))),
      );
    else setKicks(String(Math.min(100, Math.max(0, Math.round(next)))));
  }
  return (
    <form
      onSubmit={submit}
      className={`test-form ${inline ? "inline-test-form" : ""}`}
      aria-label={inline ? "Quick test entry" : "Observation form"}
    >
      {repeat && (
        <p className="repeat-note">
          Distance and kicks copied from the last observation. Enter a new time;
          notes are not copied.
        </p>
      )}
      <div className="form-grid">
        <label>
          Breakout distance <span className="field-unit">METERS</span>
          <div className="stepper">
            <button
              type="button"
              aria-label="Decrease breakout distance"
              onClick={() => step("distance", -1)}
            >
              <Minus size={18} />
            </button>
            <div className="input-unit">
              <input
                aria-label="Breakout distance"
                type="text"
                inputMode="decimal"
                autoFocus={!inline && !repeat && !initial}
                required
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="12.0"
              />
              <span>m</span>
            </div>
            <button
              type="button"
              aria-label="Increase breakout distance"
              onClick={() => step("distance", 1)}
            >
              <Plus size={18} />
            </button>
          </div>
        </label>
        <label>
          Dolphin kicks <span className="field-unit">COUNT</span>
          <div className="stepper">
            <button
              type="button"
              aria-label="Decrease dolphin kicks"
              onClick={() => step("kicks", -1)}
            >
              <Minus size={18} />
            </button>
            <div className="input-unit">
              <input
                aria-label="Dolphin kicks"
                type="text"
                inputMode="numeric"
                required
                value={kicks}
                onChange={(e) => setKicks(e.target.value)}
                placeholder="7"
              />
              <span>kicks</span>
            </div>
            <button
              type="button"
              aria-label="Increase dolphin kicks"
              onClick={() => step("kicks", 1)}
            >
              <Plus size={18} />
            </button>
          </div>
        </label>
        <label className="time-field">
          15 m time <span className="field-unit">SECONDS</span>
          <div className="input-unit">
            <input
              aria-label="15 m time"
              type="text"
              inputMode="decimal"
              autoFocus={!!repeat}
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="6.31"
            />
            <span>s</span>
          </div>
        </label>
      </div>
      <p className="input-hint">
        Distance ±0.5 m · kicks ±1. Manual decimals: dot or comma.
      </p>
      <details className="notes-disclosure" open={!inline || undefined}>
        <summary>
          <MessageSquare size={14} />
          Quick notes <span>Optional</span>
        </summary>
        <label className="notes-label">
          <span className="sr-only">Notes</span>
          <textarea
            aria-label="Notes"
            maxLength={500}
            value={notes}
            rows={2}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Effort, rest, timing method…"
          />
        </label>
      </details>
      {similar && (
        <p className="inline-note">
          <Info size={14} />
          Similar distance recorded. Tests stay separate; only exact distances
          are grouped.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-footer">
        <button
          className="button primary save-trial"
          aria-label={initial ? "Save changes" : "Add test"}
        >
          <Save size={17} />
          {initial ? "Save changes" : "Save test"}
        </button>
        <button
          type="button"
          className="text-button form-cancel"
          onClick={inline ? reset : onCancel}
        >
          {inline ? "Clear form" : "Cancel"}
        </button>
      </div>
      <p className="form-local">
        <span className="status-dot" />
        Saved to this browser only
      </p>
    </form>
  );
}
