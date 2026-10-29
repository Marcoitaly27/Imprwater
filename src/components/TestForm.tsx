import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, ArrowUpRight, Info } from "lucide-react";
import type { Trial, TrialInput } from "../lib/model";
import { validateTrial } from "../lib/model";
export function TestForm({
  initial,
  tests,
  onSave,
  onCancel,
}: {
  initial?: Trial;
  tests: Trial[];
  onSave: (input: TrialInput) => void;
  onCancel?: () => void;
}) {
  const [distance, setDistance] = useState(initial?.distance.toString() ?? "");
  const [kicks, setKicks] = useState(initial?.kicks.toString() ?? "");
  const [time, setTime] = useState(initial?.time.toString() ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");
  const similar =
    distance !== "" &&
    tests.some(
      (t) =>
        t.id !== initial?.id && Math.abs(t.distance - Number(distance)) < 0.25,
    );
  function submit(e: FormEvent) {
    e.preventDefault();
    const input = {
      distance: distance === "" ? NaN : Number(distance),
      kicks: kicks === "" ? NaN : Number(kicks),
      time: time === "" ? NaN : Number(time),
      notes: notes.trim(),
    };
    const problem = validateTrial(input);
    if (problem) {
      setError(problem);
      return;
    }
    onSave(input);
    if (!initial) {
      setDistance("");
      setKicks("");
      setTime("");
      setNotes("");
      setError("");
    }
  }
  return (
    <form onSubmit={submit} className="test-form">
      <div className="form-grid">
        <label className="distance-field">
          Breakout distance
          <div className="input-unit">
            <input
              aria-label="Breakout distance"
              type="number"
              min="1"
              max="15"
              step="0.01"
              required
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="e.g. 12.0"
            />
            <span>m</span>
          </div>
        </label>
        <label>
          Dolphin kicks
          <div className="input-unit">
            <input
              aria-label="Dolphin kicks"
              type="number"
              min="0"
              max="100"
              step="1"
              required
              value={kicks}
              onChange={(e) => setKicks(e.target.value)}
              placeholder="e.g. 7"
            />
            <span>kicks</span>
          </div>
        </label>
        <label>
          15 m time
          <div className="input-unit">
            <input
              aria-label="15 m time"
              type="number"
              min="0.01"
              max="300"
              step="0.01"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g. 6.31"
            />
            <span>s</span>
          </div>
        </label>
      </div>
      <label className="notes-label">
        Notes <span className="muted">Optional</span>
        <textarea
          aria-label="Notes"
          maxLength={500}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did it feel? Start or turn, effort, conditions…"
        />
      </label>
      {similar && (
        <p className="inline-note">
          <Info size={14} /> Similar distance recorded. Repeats are kept as
          separate observations.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-footer">
        {onCancel ? (
          <button className="button secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : (
          <span className="muted form-tip">
            Same conditions. Better comparisons.
          </span>
        )}
        <button type="submit" className="button primary">
          {initial ? "Save changes" : "Add test"}
          {initial ? <ArrowUpRight size={16} /> : <Plus size={16} />}
        </button>
      </div>
    </form>
  );
}
