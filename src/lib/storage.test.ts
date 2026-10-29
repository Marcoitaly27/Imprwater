import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyData, makeDemo } from "./model";
import { loadData, saveData, STORAGE_KEY } from "./storage";

describe("browser storage boundary", () => {
  let stored: Map<string, string>;
  beforeEach(() => {
    stored = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => stored.set(key, value),
    });
  });
  afterEach(() => vi.unstubAllGlobals());
  it("restores a saved profile and observations exactly", () => {
    const data = emptyData();
    data.tests = makeDemo(data.profile);
    data.profile.personalBest = "52.40";
    data.personalBests["Freestyle-100"] = "52.40";
    expect(saveData(data)).toBeNull();
    expect(loadData()).toEqual({ data, error: null });
  });
  it("keeps corrupt original data intact and returns a clear warning", () => {
    stored.set(STORAGE_KEY, "{invalid");
    expect(loadData().error).toMatch(/not been overwritten/);
    expect(stored.get(STORAGE_KEY)).toBe("{invalid");
  });
  it("rejects invalid persisted observations and unsupported schemas", () => {
    const data = emptyData();
    data.tests = makeDemo(data.profile);
    data.tests[0].distance = 16;
    stored.set(STORAGE_KEY, JSON.stringify(data));
    expect(loadData().error).not.toBeNull();
    stored.set(STORAGE_KEY, JSON.stringify({ ...emptyData(), version: 2 }));
    expect(loadData().error).not.toBeNull();
  });
  it("reports inaccessible or full storage instead of crashing", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("Blocked");
      },
      setItem: () => {
        throw new Error("Full");
      },
    });
    expect(loadData().error).not.toBeNull();
    expect(saveData(emptyData())).toMatch(/only kept in this tab/);
  });
});
