import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addDemo, emptyData, sessionComplete } from "./model";
import {
  loadData,
  saveData,
  STORAGE_KEY,
  LEGACY_KEY,
  migrateLegacy,
  parseBackup,
  validateData,
} from "./storage";
const legacy = () => ({
  version: 1,
  profile: { stroke: "Freestyle", event: 100, personalBest: "52.40" },
  personalBests: { "Freestyle-100": "52.40", "Butterfly-50": "28.3" },
  tests: [
    {
      id: "original",
      stroke: "Freestyle",
      event: 100,
      distance: 12,
      kicks: 7,
      time: 6.31,
      notes: "Original note",
      createdAt: "2026-10-29T12:00:00.000Z",
    },
    {
      id: "other",
      stroke: "Butterfly",
      event: 50,
      distance: 9,
      kicks: 5,
      time: 7.1,
      notes: "Other stroke",
      createdAt: "2026-10-29T12:01:00.000Z",
    },
  ],
});
describe("versioned storage, migration and restore validation", () => {
  let stored: Map<string, string>;
  beforeEach(() => {
    stored = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => stored.get(k) ?? null,
      setItem: (k: string, v: string) => stored.set(k, v),
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  it("round trips the complete v2 workspace", () => {
    const data = addDemo(emptyData());
    expect(saveData(data)).toBeNull();
    expect(loadData()).toEqual({ data, error: null, migrated: false });
  });
  it("migrates all legacy observations and personal bests without inventing conditions", () => {
    const d = migrateLegacy(legacy());
    expect(d.tests.map((t) => t.id)).toEqual(["original", "other"]);
    expect(d.tests[0]).toMatchObject({
      time: 6.31,
      notes: "Original note",
      createdAt: "2026-10-29T12:00:00.000Z",
    });
    expect(d.sessions).toHaveLength(2);
    expect(
      d.sessions.every(
        (s) =>
          s.date === null &&
          s.pool === null &&
          s.startType === null &&
          !sessionComplete(s),
      ),
    ).toBe(true);
    expect(d.athletes[0].personalBests).toEqual(legacy().personalBests);
  });
  it("retains original v1 bytes and gives v2 precedence on later reloads", () => {
    const raw = JSON.stringify(legacy());
    stored.set(LEGACY_KEY, raw);
    const first = loadData();
    expect(first.migrated).toBe(true);
    expect(saveData(first.data)).toBeNull();
    expect(stored.get(LEGACY_KEY)).toBe(raw);
    expect(loadData().data).toEqual(first.data);
    expect(loadData().migrated).toBe(false);
  });
  it("does not silently recover from corrupt v2 by replacing it with old data", () => {
    stored.set(STORAGE_KEY, "{invalid");
    stored.set(LEGACY_KEY, JSON.stringify(legacy()));
    expect(loadData().error).toContain("not been overwritten");
    expect(stored.get(STORAGE_KEY)).toBe("{invalid");
  });
  it("rejects bad foreign keys, duplicates, impossible dates, null entries and unsupported versions", () => {
    const data = addDemo(emptyData());
    for (const bad of [
      { ...data, version: 3 },
      { ...data, tests: [...data.tests, data.tests[0]] },
      { ...data, athletes: [null] },
      { ...data, sessions: [{ ...data.sessions[0], date: "2026-02-30" }] },
      { ...data, tests: [{ ...data.tests[0], sessionId: "missing" }] },
      { ...data, selectedAthleteId: "missing" },
    ])
      expect(() => validateData(bad)).toThrow();
    expect(() => parseBackup("{bad")).toThrow();
    expect(() =>
      parseBackup(JSON.stringify({ ...data, version: 99 })),
    ).toThrow();
    expect(() => parseBackup("x".repeat(10_000_001))).toThrow(/10 MB/);
    expect(parseBackup(JSON.stringify(legacy())).tests).toHaveLength(2);
  });
  it("reports denied reads/writes without losing the legacy original", () => {
    const raw = JSON.stringify(legacy());
    stored.set(LEGACY_KEY, raw);
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => stored.get(k) ?? null,
      setItem: () => {
        throw new Error("Quota exceeded");
      },
    });
    const loaded = loadData();
    expect(loaded.data.tests).toHaveLength(2);
    expect(saveData(loaded.data)).toContain("only in this tab");
    expect(stored.get(LEGACY_KEY)).toBe(raw);
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("Denied");
      },
    });
    expect(loadData().error).not.toBeNull();
  });
});
