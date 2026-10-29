import { useState } from "react";
import type { FormEvent } from "react";
import { Info } from "lucide-react";
import type { Trial, TrialInput } from "../lib/model";
import { decimal, validateTrial } from "../lib/model";
export function TestForm({
  initial,
  repeat,
  tests,
  onSave,
  onCancel,
}: {
  initial?: Trial;
  repeat?: Trial;
  tests: Trial[];
  onSave: (t: TrialInput) => void;
  onCancel: () => void;
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
  }
  return (
    <form onSubmit={submit} className="test-form">
      {repeat && (
        <p className="repeat-note">
          Distance and kicks copied from the last observation. Enter a new time;
          notes are not copied.
        </p>
      )}
      <div className="form-grid">
        <label>
          Breakout distance
          <div className="input-unit">
            <input
              aria-label="Breakout distance"
              type="text"
              inputMode="decimal"
              autoFocus={!repeat && !initial}
              required
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="12.0"
            />
            <span>m</span>
          </div>
        </label>
        <label>
          Dolphin kicks
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
        </label>
        <label>
          15 m time
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
        Use a dot or comma for decimals. Breakout: 1–15 m. Time: 0–300 s,
        excluding zero.
      </p>
      <label className="notes-label">
        Notes (optional)
        <textarea
          aria-label="Notes"
          maxLength={500}
          value={notes}
          rows={3}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Effort, rest, timing method, conditions…"
        />
      </label>
      {similar && (
        <p className="inline-note">
          <Info size={16} />
          Similar distance recorded. This remains a separate test; statistics
          group only exactly equal distances.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-footer">
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="button primary">
          {initial ? "Save changes" : "Add test"}
        </button>
      </div>
    </form>
  );
}
