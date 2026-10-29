import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
const KEY = "underwater-optimizer:v2";
async function createAthlete(page: Page, name = "Marco") {
  await page
    .getByRole("button", { name: "Create athlete", exact: true })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Name", exact: true })
    .fill(name);
  await page.getByRole("button", { name: "Save athlete", exact: true }).click();
}
async function createSession(
  page: Page,
  name = "Morning turns",
  start = "Push after turn",
  pool = "25",
) {
  await page
    .getByRole("button", { name: "Create session", exact: true })
    .first()
    .click();
  const d = page.getByRole("dialog");
  await d.getByRole("textbox", { name: "Session name" }).fill(name);
  await d.getByLabel("Date", { exact: true }).fill("2026-10-29");
  await d.getByRole("combobox", { name: "Pool length" }).selectOption(pool);
  await d.getByRole("combobox", { name: "Start type" }).selectOption(start);
  await d.getByRole("button", { name: "Save session" }).click();
}
async function addTest(
  page: Page,
  distance = "12",
  kicks = "7",
  time = "6,31",
  notes = "",
) {
  await page
    .locator(".record-toolbar")
    .getByRole("button", { name: "New test", exact: true })
    .click();
  const d = page.getByRole("dialog");
  await d
    .getByRole("textbox", { name: "Breakout distance", exact: true })
    .fill(distance);
  await d
    .getByRole("textbox", { name: "Dolphin kicks", exact: true })
    .fill(kicks);
  await d.getByRole("textbox", { name: "15 m time", exact: true }).fill(time);
  if (notes)
    await d.getByRole("textbox", { name: "Notes", exact: true }).fill(notes);
  await d.getByRole("button", { name: "Add test", exact: true }).click();
}
async function utilityAction(page: Page, name: string) {
  const menu = page.locator(".workspace-menu");
  await menu.locator("summary").click();
  await menu.getByRole("button", { name, exact: true }).click();
}
async function saved(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), KEY);
}

test("athletes/sessions, comma input, quick repeats, independent averages, edit/delete and persistence", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning")
      errors.push(msg.text());
  });
  await page.goto("/");
  await createAthlete(page);
  await createSession(page);
  await addTest(page, "12,01", "7", "6,31", "First repeat");
  await page
    .getByRole("button", { name: "Repeat last test", exact: true })
    .click();
  let d = page.getByRole("dialog");
  await expect(
    d.getByRole("textbox", { name: "Breakout distance", exact: true }),
  ).toHaveValue("12.01");
  await expect(
    d.getByRole("textbox", { name: "Dolphin kicks", exact: true }),
  ).toHaveValue("7");
  await expect(
    d.getByRole("textbox", { name: "15 m time", exact: true }),
  ).toHaveValue("");
  await expect(
    d.getByRole("textbox", { name: "Notes", exact: true }),
  ).toHaveValue("");
  await d.getByRole("textbox", { name: "15 m time", exact: true }).fill("6.51");
  await d.getByRole("button", { name: "Add test", exact: true }).click();
  await addTest(page, "10", "5", "6.35");
  await expect(page.locator(".v2-best")).toContainText("6.31 s");
  await expect(page.locator(".no-print .mean-callout")).toContainText(
    "10 m · 6.35 s",
  );
  await expect(page.locator(".no-print .stats-panel")).toContainText(
    "Preliminary result",
  );
  await page.reload();
  await expect(page.locator(".v2-best")).toContainText("6.31 s");
  expect((await saved(page)).tests).toHaveLength(3);
  await page
    .getByRole("button", { name: "Edit test 1", exact: true })
    .filter({ visible: true })
    .click();
  d = page.getByRole("dialog");
  await d.getByRole("textbox", { name: "15 m time", exact: true }).fill("6.10");
  await d.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".v2-best")).toContainText("6.10 s");
  await expect(page.locator(".chart-area svg").first()).toBeVisible();
  await page.getByRole("button", { name: "Detail", exact: true }).click();
  await expect(page.locator(".axis-notice")).toContainText(
    "Does not start at zero",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const dismiss = page.getByRole("button", { name: "Dismiss notification" });
  if (await dismiss.isVisible()) await dismiss.click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/dashboard-aqua-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Delete test 1", exact: true })
    .filter({ visible: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel" })
    .click();
  expect((await saved(page)).tests).toHaveLength(3);
  await page
    .getByRole("button", { name: "Delete test 1", exact: true })
    .filter({ visible: true })
    .click();
  await page.getByRole("button", { name: "Confirm removal" }).click();
  expect((await saved(page)).tests).toHaveLength(2);
  await createSession(page, "Block starts", "Block start", "50");
  await expect(page.locator(".v2-best")).toContainText("No observations yet");
  await addTest(page, "8", "4", "5.9");
  expect((await saved(page)).tests).toHaveLength(3);
  await createAthlete(page, "Other swimmer");
  await expect(
    page.getByRole("heading", { name: "Start a session for Other swimmer." }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Athlete", exact: true })
    .selectOption({ label: "Marco" });
  await expect(page.locator(".v2-best")).toContainText("6.31 s");
  await page.getByRole("button", { name: "Rename athlete" }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Marco S.");
  await page.getByRole("button", { name: "Save athlete" }).click();
  await page
    .getByRole("button", { name: "Load demo data", exact: true })
    .first()
    .click();
  expect((await saved(page)).tests).toHaveLength(7);
  await expect(page.locator(".demo-tag")).toBeVisible();
  await page
    .getByRole("combobox", { name: "Athlete", exact: true })
    .selectOption({ label: "Marco S." });
  await expect(page.locator(".v2-best")).toContainText("6.31 s");
  expect(errors).toEqual([]);
});

test("legacy migration preserves original, requires verified conditions, and supports moving observations", async ({
  page,
}) => {
  const old = {
    version: 1,
    profile: { stroke: "Freestyle", event: 100, personalBest: "52.4" },
    personalBests: { "Freestyle-100": "52.4" },
    tests: [
      {
        id: "legacy-test",
        stroke: "Freestyle",
        event: 100,
        distance: 12,
        kicks: 7,
        time: 6.31,
        notes: "Original note",
        createdAt: "2026-10-28T10:00:00.000Z",
      },
    ],
  };
  await page.addInitScript((value) => {
    if (!localStorage.getItem("underwater-optimizer:v1"))
      localStorage.setItem("underwater-optimizer:v1", JSON.stringify(value));
  }, old);
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Imported session · conditions need review",
    }),
  ).toBeVisible();
  await expect(page.locator(".v2-best")).toHaveCount(0);
  expect((await saved(page)).sessions[0]).toMatchObject({
    date: null,
    pool: null,
    startType: null,
  });
  await createSession(page, "Verified turns");
  const current = await saved(page);
  await page
    .getByRole("combobox", { name: "Session", exact: true })
    .selectOption(current.sessions[0].id);
  await page
    .getByRole("button", { name: "Move test 1", exact: true })
    .filter({ visible: true })
    .click();
  const d = page.getByRole("dialog");
  await d
    .getByRole("combobox", { name: "Destination session" })
    .selectOption(current.sessions[1].id);
  await d
    .getByRole("button", { name: "Move observation", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Session", exact: true })
    .selectOption(current.sessions[1].id);
  await expect(page.locator(".v2-best")).toContainText("6.31 s");
  expect((await saved(page)).tests[0]).toMatchObject({
    id: "legacy-test",
    notes: "Original note",
  });
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("underwater-optimizer:v1")!),
    ),
  ).toEqual(old);
  await page
    .getByRole("combobox", { name: "Session", exact: true })
    .selectOption(current.sessions[0].id);
  await page
    .getByRole("button", { name: "Complete session conditions" })
    .click();
  await d.getByLabel("Date", { exact: true }).fill("2026-10-28");
  await d.getByRole("combobox", { name: "Pool length" }).selectOption("25");
  await d
    .getByRole("combobox", { name: "Start type" })
    .selectOption("Push after turn");
  await d
    .getByRole("textbox", { name: "Session name" })
    .fill("Imported completed");
  await d.getByRole("button", { name: "Save session" }).click();
  await expect(page.locator(".incomplete-banner")).toHaveCount(0);
  await page.reload();
  expect((await saved(page)).tests).toHaveLength(1);
});

test("CSV and JSON downloads, invalid import, restore preview, cancel and confirmed replacement", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Load demo data", exact: true })
    .first()
    .click();
  const before = await saved(page);
  let downloadPromise = page.waitForEvent("download");
  await utilityAction(page, "Export CSV");
  const csv = await downloadPromise;
  expect(csv.suggestedFilename()).toBe("underwater-session.csv");
  const fs = await import("node:fs/promises");
  const text = await fs.readFile((await csv.path())!, "utf8");
  expect(text).toContain("Breakout (m)");
  expect(text).toContain("6.31");
  downloadPromise = page.waitForEvent("download");
  await utilityAction(page, "Backup JSON");
  const backup = await downloadPromise;
  const raw = await fs.readFile((await backup.path())!, "utf8");
  expect(JSON.parse(raw)).toEqual(before);
  await page.getByLabel("Backup file", { exact: true }).setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{bad"),
  });
  await expect(page.getByRole("alert")).toContainText(
    "Current data is unchanged",
  );
  expect(await saved(page)).toEqual(before);
  await page.getByLabel("Backup file", { exact: true }).setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(raw),
  });
  await expect(page.getByRole("dialog")).toContainText(
    "1 athletes, 1 sessions, 4 observations",
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel" })
    .click();
  expect(await saved(page)).toEqual(before);
  await createAthlete(page, "Extra athlete");
  await page.getByLabel("Backup file", { exact: true }).setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(raw),
  });
  await page
    .getByRole("button", { name: "Replace all data and restore" })
    .click();
  expect(await saved(page)).toEqual(before);
  await page.reload();
  await expect(page.locator(".v2-best")).toContainText("6.31 s");
});

test("overlapping points are individually selectable by keyboard and printed summary contains exact context", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Load demo data", exact: true })
    .first()
    .click();
  await addTest(page, "12", "7", "6.31", "Repeated exact point");
  const chart = page.getByRole("combobox", { name: "Chart observation" });
  await expect(chart).toBeVisible();
  await expect(chart.locator("option")).toHaveCount(5);
  await chart.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.locator(".chart-selection p").first()).toContainText(
    "Test 2",
  );
  const point = page.locator(".chart-area circle[role=button]").first();
  await point.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".chart-selection p").first()).toContainText(
    "Test 1",
  );
  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".no-print")).toBeHidden();
  await expect(page.locator(".print-summary")).toBeVisible();
  await expect(page.locator(".print-summary")).toContainText("Push after turn");
  await expect(page.locator(".print-summary")).toContainText(
    "Repeated exact point",
  );
  await expect(page.locator(".print-summary")).toContainText("DEMO DATA");
  await page.emulateMedia({ media: "screen" });
  await page.getByRole("button", { name: /Simulator/ }).click();
  await expect(
    page.getByRole("heading", { name: "A full race simulator is planned." }),
  ).toBeVisible();
});

test("corrupt storage is protected and failed writes keep the app usable", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("underwater-optimizer:v2", "{invalid"),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "original has not been overwritten",
  );
  await page
    .getByRole("button", { name: "Load demo data", exact: true })
    .first()
    .click();
  expect(
    await page.evaluate(() => localStorage.getItem("underwater-optimizer:v2")),
  ).toBe("{invalid");
  await expect(page.locator(".v2-best")).toContainText("6.31 s");
  await page.getByRole("button", { name: "Enable saving" }).click();
  expect((await saved(page)).tests).toHaveLength(4);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await addTest(page, "14", "8", "6.5");
  await expect(page.getByRole("alert")).toContainText("only in this tab");
  await expect(page.locator(".no-print .table-footer")).toContainText(
    "5 observations",
  );
});

test("invalid values rejected, imported conditions require confirmation when observations remain", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Load demo data", exact: true })
    .first()
    .click();
  await page
    .locator(".record-toolbar")
    .getByRole("button", { name: "New test", exact: true })
    .click();
  let d = page.getByRole("dialog");
  await d
    .getByRole("textbox", { name: "Breakout distance", exact: true })
    .fill("16");
  await d
    .getByRole("textbox", { name: "Dolphin kicks", exact: true })
    .fill("7");
  await d.getByRole("textbox", { name: "15 m time", exact: true }).fill("6,3");
  await d.getByRole("button", { name: "Add test", exact: true }).click();
  await expect(d.getByRole("alert")).toContainText("between 1 and 15");
  await d.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: "Edit session", exact: true }).click();
  d = page.getByRole("dialog");
  await d
    .getByRole("textbox", { name: "Session name" })
    .fill("Renamed session");
  await d.getByRole("button", { name: "Save session" }).click();
  await expect(d.getByRole("alert")).toContainText("Confirm");
  await d.getByRole("checkbox").check();
  await d.getByRole("button", { name: "Save session" }).click();
  await expect(page.locator(".record-toolbar h2")).toHaveText(
    "Renamed session",
  );
  await page.getByRole("button", { name: "Clear session tests" }).click();
  await page.getByRole("button", { name: "Confirm removal" }).click();
  expect((await saved(page)).tests).toHaveLength(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("aqua layout, inline steppers, speed view and responsive pool geometry preserve session data", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning")
      errors.push(msg.text());
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Load demo data", exact: true })
    .first()
    .click();
  await expect(page.locator(".sidebar")).toHaveCount(0);
  await expect(page.locator(".topbar .brand")).toContainText(
    "UNDERWATER ADVANTAGE",
  );
  const form = page.getByRole("form", { name: "Quick test entry" });
  await form
    .getByRole("textbox", { name: "Breakout distance", exact: true })
    .fill("15");
  await form
    .getByRole("button", { name: "Increase breakout distance" })
    .click();
  await expect(
    form.getByRole("textbox", { name: "Breakout distance", exact: true }),
  ).toHaveValue("15");
  await form
    .getByRole("textbox", { name: "Breakout distance", exact: true })
    .fill("1");
  await form
    .getByRole("button", { name: "Decrease breakout distance" })
    .click();
  await expect(
    form.getByRole("textbox", { name: "Breakout distance", exact: true }),
  ).toHaveValue("1");
  await form
    .getByRole("textbox", { name: "Breakout distance", exact: true })
    .fill("10");
  await form
    .getByRole("button", { name: "Increase breakout distance" })
    .click();
  await expect(
    form.getByRole("textbox", { name: "Breakout distance", exact: true }),
  ).toHaveValue("10.5");
  await form
    .getByRole("textbox", { name: "Dolphin kicks", exact: true })
    .fill("5");
  await form.getByRole("button", { name: "Increase dolphin kicks" }).click();
  await expect(
    form.getByRole("textbox", { name: "Dolphin kicks", exact: true }),
  ).toHaveValue("6");
  await form.getByRole("button", { name: "Decrease dolphin kicks" }).click();
  await form
    .getByRole("textbox", { name: "15 m time", exact: true })
    .fill("6,30");
  await form.locator(".notes-disclosure summary").click();
  await form
    .getByRole("textbox", { name: "Notes", exact: true })
    .fill("Poolside inline test");
  await form.getByRole("button", { name: "Add test", exact: true }).click();
  await expect(page.locator(".v2-best")).toContainText(
    "10.5 m · 5 kicks · 6.30 s",
  );
  await expect(
    form.getByRole("textbox", { name: "15 m time", exact: true }),
  ).toHaveValue("");
  const before = await saved(page);
  expect(before.tests).toHaveLength(5);
  await page.getByRole("button", { name: /Average speed/ }).click();
  await expect(page.locator(".axis-notice")).toContainText(
    "15 m ÷ total 15 m time",
  );
  await expect(page.locator(".chart-selection p").first()).toContainText(
    "2.38 m/s",
  );
  expect(await saved(page)).toEqual(before);
  await page.getByRole("button", { name: "Detail", exact: true }).click();
  await expect(page.locator(".axis-notice")).toContainText(
    "Does not start at zero",
  );
  await page.getByRole("button", { name: "Time s", exact: true }).click();
  await page.locator(".workspace-menu summary").click();
  await expect(
    page.getByRole("button", { name: "Export CSV", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Export CSV", exact: true }),
  ).toBeHidden();
  const sizes =
    testInfo.project.name === "desktop"
      ? [
          { width: 768, height: 1024 },
          { width: 1024, height: 768 },
          { width: 1280, height: 900 },
        ]
      : [{ width: 320, height: 740 }];
  for (const viewport of sizes) {
    await page.setViewportSize(viewport);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const lane = await page.locator(".pool-track").boundingBox();
    const marker = await page.locator(".marker-dot").boundingBox();
    expect(lane).not.toBeNull();
    expect(marker).not.toBeNull();
    expect((marker!.x + marker!.width / 2 - lane!.x) / lane!.width).toBeCloseTo(
      10.5 / 15,
      1,
    );
    await expect(page.locator(".topbar .select-actions").first()).toBeVisible();
    const toastDismiss = page.getByRole("button", {
      name: "Dismiss notification",
    });
    if (await toastDismiss.isVisible()) await toastDismiss.click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: `test-results/aqua-${viewport.width}x${viewport.height}.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});
