import { expect, it } from "vitest";
import { addDemo, emptyData } from "./model";
import { csvForSession } from "./export";
it("exports only the selected session and quotes delimiters, unicode, newlines and formula-like notes", () => {
  const d = addDemo(addDemo(emptyData()));
  const s = d.sessions[0];
  d.athletes[0].name = 'Éva, "Coach"';
  d.tests[0].notes = '=HYPERLINK("bad")';
  d.tests[1].notes = 'Line one\nLine two, "quoted"';
  const csv = csvForSession(d, s);
  expect(csv).toContain('"Éva, ""Coach"""');
  expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
  expect(csv).toContain('"Line one\nLine two, ""quoted"""');
  expect(csv).toContain(d.tests[0].id);
  expect(csv).not.toContain(d.tests[4].id);
});
