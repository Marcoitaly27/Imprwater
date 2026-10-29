import { describe, expect, it } from "vitest";
import { analyze, emptyData, makeDemo, validateTrial } from "./model";

describe("observation analysis", () => {
  const demo = makeDemo(emptyData().profile);
  it("finds the actual fastest result and gain in the requested demo", () => {
    const result = analyze(demo);
    expect(result.best).toMatchObject({ distance: 12, kicks: 7, time: 6.31 });
    expect(result.worst?.time).toBe(6.51);
    expect(result.improvement).toBeCloseTo(0.2);
    expect(result.longer?.time).toBe(6.43);
    expect(result.longer!.time - result.best!.time).toBeCloseTo(0.12);
  });
  it("handles empty and single observations without inventing a comparison", () => {
    expect(analyze([]).best).toBeUndefined();
    expect(analyze([]).improvement).toBe(0);
    expect(analyze([demo[0]]).improvement).toBe(0);
    expect(analyze([demo[0]]).longer).toBeUndefined();
  });
  it("keeps repeated observations and reports all fastest ties, shortest first", () => {
    const repeat = { ...demo[2], id: "repeat", distance: 10 };
    const result = analyze([...demo, repeat]);
    expect(result.sorted).toHaveLength(5);
    expect(result.best?.id).toBe("repeat");
    expect(result.tied).toHaveLength(2);
    expect(demo.map((t) => t.distance)).toEqual([8, 10, 12, 14]);
  });
  it("rejects out of range, nonfinite and fractional kick values", () => {
    for (const change of [
      { distance: 0 },
      { distance: 15.01 },
      { time: 0 },
      { time: NaN },
      { kicks: -1 },
      { kicks: 1.5 },
      { kicks: Infinity },
      { notes: "x".repeat(501) },
    ]) {
      expect(
        validateTrial({
          distance: 12,
          kicks: 7,
          time: 6.31,
          notes: "",
          ...change,
        }),
      ).not.toBeNull();
    }
    expect(
      validateTrial({ distance: 15, kicks: 0, time: 6, notes: "" }),
    ).toBeNull();
  });
});
