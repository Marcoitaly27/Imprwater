import { useState } from "react";
import type { FormEvent } from "react";
import {
  events,
  strokes,
  startTypes,
  localDate,
  validDate,
} from "../lib/model";
import type { Session } from "../lib/model";
export function NameForm({
  initial = "",
  onSave,
  onCancel,
}: {
  initial?: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial);
  return (
    <form
      className="context-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) onSave(name.trim());
      }}
    >
      <label>
        Name
        <input
          autoFocus
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <div className="modal-actions">
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="button primary">Save athlete</button>
      </div>
    </form>
  );
}
export function SessionForm({
  initial,
  hasTests = false,
  onSave,
  onCancel,
}: {
  initial?: Session;
  hasTests?: boolean;
  onSave: (s: Omit<Session, "id" | "athleteId" | "imported">) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState({
    name: initial?.name ?? "Pool session",
    date: initial?.date ?? "",
    stroke: initial?.stroke ?? "Freestyle",
    event: initial?.event ?? 100,
    pool: initial?.pool ?? null,
    startType: initial?.startType ?? null,
  });
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  function submit(e: FormEvent) {
    e.preventDefault();
    if (
      !value.name.trim() ||
      !validDate(value.date) ||
      !value.pool ||
      !value.startType
    ) {
      setError("Complete the name, valid date, pool length and start type.");
      return;
    }
    if (hasTests && !confirmed) {
      setError("Confirm that the observations belong to these conditions.");
      return;
    }
    onSave({ ...value, name: value.name.trim() });
  }
  return (
    <form className="context-form" onSubmit={submit}>
      <label>
        Session name
        <input
          autoFocus
          required
          maxLength={100}
          value={value.name}
          onChange={(e) => setValue({ ...value, name: e.target.value })}
        />
      </label>
      <div className="context-grid">
        <label>
          Date
          <input
            type="date"
            aria-label="Date"
            required
            value={value.date}
            onChange={(e) => setValue({ ...value, date: e.target.value })}
          />
          {!initial && (
            <button
              type="button"
              className="text-button"
              onClick={() => setValue({ ...value, date: localDate() })}
            >
              Use today
            </button>
          )}
        </label>
        <label>
          Pool length
          <select
            required
            value={value.pool ?? ""}
            onChange={(e) =>
              setValue({ ...value, pool: Number(e.target.value) as 25 | 50 })
            }
          >
            <option value="" disabled>
              Select pool
            </option>
            <option value="25">25 m</option>
            <option value="50">50 m</option>
          </select>
        </label>
        <label>
          Stroke
          <select
            disabled={hasTests}
            value={value.stroke}
            onChange={(e) =>
              setValue({
                ...value,
                stroke: e.target.value as Session["stroke"],
              })
            }
          >
            {strokes.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Event
          <select
            disabled={hasTests}
            value={value.event}
            onChange={(e) =>
              setValue({
                ...value,
                event: Number(e.target.value) as Session["event"],
              })
            }
          >
            {events.map((e) => (
              <option key={e} value={e}>
                {e} m
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Start type
        <select
          required
          value={value.startType ?? ""}
          onChange={(e) =>
            setValue({
              ...value,
              startType: e.target.value as Session["startType"],
            })
          }
        >
          <option value="" disabled>
            Select start type
          </option>
          {startTypes.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      {hasTests && (
        <label className="confirm-check">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          I have checked that every test in this session shares these conditions
          and date. If not, I will move individual tests into separate sessions
          first.
        </label>
      )}
      {hasTests && (
        <p className="muted">
          Stroke and event are locked to preserve existing observations.
          Renaming or completing other conditions requires confirmation.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="button primary">Save session</button>
      </div>
    </form>
  );
}
