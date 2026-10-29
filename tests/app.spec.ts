import { test, expect } from "@playwright/test";

test("demo analysis, persistence, editing, repeats and deletion", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning")
      errors.push(msg.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "No tests recorded yet." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Load demo data", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await expect(page.locator(".optimal-distance")).toHaveText("12.0m");
  await expect(page.locator(".gain-note")).toContainText("0.20 s faster");
  await expect(page.locator(".insights")).toContainText("0.12 s slower");
  await expect(page.locator(".chart-area svg").first()).toBeVisible();
  await page.reload();
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await expect(page.locator(".chart-area svg").first()).toBeVisible();
  await page.screenshot({
    path: `test-results/dashboard-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Edit test 3", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("spinbutton", { name: "15 m time", exact: true })
    .fill("6.20");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".optimal-details")).toContainText("6.20 s");
  await page
    .getByRole("spinbutton", { name: "Breakout distance", exact: true })
    .fill("12");
  await expect(page.getByText("Similar distance recorded.")).toBeVisible();
  await page
    .getByRole("spinbutton", { name: "Dolphin kicks", exact: true })
    .fill("6");
  await page
    .getByRole("spinbutton", { name: "15 m time", exact: true })
    .fill("6.10");
  await page
    .getByRole("textbox", { name: "Notes", exact: true })
    .fill("<script>test</script>");
  await page.getByRole("button", { name: "Add test", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await expect(page.locator(".optimal-details")).toContainText("6.10 s");
  await page
    .getByRole("button", { name: "Delete test 5", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await page
    .getByRole("button", { name: "Delete test 5", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete test", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await page.getByRole("button", { name: "Clear data", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Clear tests", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "No tests recorded yet." }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("profile isolation, navigation, bounds and 15 meter marker", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Load demo data", exact: true })
    .click();
  await page.getByRole("spinbutton", { name: "Personal best" }).fill("52.40");
  await page
    .getByRole("combobox", { name: "Stroke" })
    .selectOption("Backstroke");
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await expect(
    page.getByRole("spinbutton", { name: "Personal best" }),
  ).toHaveValue("");
  await page
    .getByRole("spinbutton", { name: "Breakout distance", exact: true })
    .fill("16");
  await page
    .getByRole("spinbutton", { name: "Dolphin kicks", exact: true })
    .fill("7");
  await page
    .getByRole("spinbutton", { name: "15 m time", exact: true })
    .fill("7.1");
  await page.getByRole("button", { name: "Add test", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await page
    .getByRole("spinbutton", { name: "Breakout distance", exact: true })
    .fill("15");
  await page.getByRole("button", { name: "Add test", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("combobox", { name: "Stroke" })
    .selectOption("Freestyle");
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await expect(
    page.getByRole("spinbutton", { name: "Personal best" }),
  ).toHaveValue("52.40");
  await page
    .getByRole("combobox", { name: "Event", exact: true })
    .selectOption("50");
  await expect(page.locator("tbody tr")).toHaveCount(0);
  await page.getByRole("button", { name: "Tests", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Every test tells a story." }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Simulator/ }).click();
  await expect(page.getByText("COMING IN V0.3")).toBeVisible();
  await page.getByRole("button", { name: "Back to dashboard" }).click();
  await expect(
    page.getByRole("heading", { name: "Find your fastest breakout." }),
  ).toBeVisible();
});

test("corrupted storage is protected until the user enables saving", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("underwater-optimizer:v1", "{invalid"),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "Saved data could not be read",
  );
  await page
    .getByRole("button", { name: "Load demo data", exact: true })
    .click();
  expect(
    await page.evaluate(() => localStorage.getItem("underwater-optimizer:v1")),
  ).toBe("{invalid");
  await page.getByRole("button", { name: "Enable saving" }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("underwater-optimizer:v1")!).tests,
  );
  expect(saved).toHaveLength(4);
});

test("storage failures preserve a usable in-memory workflow", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "Browser storage is unavailable or full",
  );
  await page
    .getByRole("button", { name: "Load demo data", exact: true })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(4);
  await expect(page.locator(".optimal-distance")).toHaveText("12.0m");
});
