import { describe, expect, it } from "vitest";
import {
  addDemo,
  analyze,
  decimal,
  emptyData,
  sessionTests,
  sessionComplete,
  validDate,
  validateTrial,
} from "./model";

describe("session and observed analysis", () => {
  const demo = addDemo(emptyData());
  it("keeps demo in a separate athlete/session without changing original data", () => {
    const next = addDemo(demo);
    expect(next.tests).toHaveLength(8);
    expect(next.athletes).toHaveLength(2);
    expect(demo.tests).toHaveLength(4);
    const active = next.sessions.find((s) => s.id === next.selectedSessionId)!;
    expect(sessionTests(next, active)).toHaveLength(4);
    expect(sessionComplete(active)).toBe(true);
    expect(sessionTests(next, undefined)).toEqual([]);
  });
  it("finds the lowest individual time, ties and best-worst spread", () => {
    const a = analyze(demo.tests);
    expect(a.best).toMatchObject({ distance: 12, kicks: 7, time: 6.31 });
    expect(a.spread).toBeCloseTo(0.2);
    expect(a.preliminary).toBe(true);
    const b = analyze([
      ...demo.tests,
      { ...demo.tests[2], id: "tie", distance: 10 },
    ]);
    expect(b.tied).toHaveLength(2);
    expect(b.best?.id).toBe("tie");
  });
  it("calculates mean, even/odd medians, sample SD and separates exact distances", () => {
    const base = demo.tests[0];
    const ts = [6, 7, 8, 6.2].map((time, i) => ({
      ...base,
      id: String(i),
      time,
      distance: i === 3 ? 8.01 : 8,
    }));
    const a = analyze(ts);
    expect(a.groups).toHaveLength(2);
    expect(a.groups[0]).toMatchObject({
      count: 3,
      mean: 7,
      median: 7,
      sd: 1,
      min: 6,
      max: 8,
      best: 6,
    });
    expect(a.groups[1].sd).toBeNull();
    expect(a.best?.distance).toBe(8);
    expect(a.bestMean?.distance).toBe(8.01);
    expect(analyze(ts.slice(0, 2)).groups[0].median).toBe(6.5);
  });
  it("does not invent variability or comparisons for missing observations", () => {
    expect(analyze([]).best).toBeUndefined();
    expect(analyze([]).bestMean).toBeUndefined();
    expect(analyze([demo.tests[0]]).groups[0].sd).toBeNull();
    expect(analyze([demo.tests[0]]).preliminary).toBe(true);
  });
  it("parses comma/dot decimals and rejects malformed, nonfinite and invalid input", () => {
    expect(decimal(" 6,31 ")).toBe(6.31);
    expect(decimal("12.01")).toBe(12.01);
    for (const v of ["", "1,2,3", "6abc", "1e2", "Infinity", "-1"])
      expect(decimal(v)).toBeNaN();
    for (const change of [
      { distance: 0 },
      { distance: 15.01 },
      { time: 0 },
      { time: NaN },
      { kicks: 1.5 },
      { kicks: -1 },
      { notes: "x".repeat(501) },
    ])
      expect(validateTrial({ ...demo.tests[0], ...change })).not.toBeNull();
    expect(validDate("2026-02-30")).toBe(false);
    expect(validDate("2024-02-29")).toBe(true);
  });
});
