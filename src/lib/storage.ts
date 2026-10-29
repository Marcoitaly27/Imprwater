import { emptyData, events, strokes, validateTrial } from "./model";
import type { AppData, Trial, Profile } from "./model";
export const STORAGE_KEY = "underwater-optimizer:v1";
function validProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const p = value as Profile;
  return (
    strokes.includes(p.stroke) &&
    events.includes(p.event) &&
    typeof p.personalBest === "string" &&
    (p.personalBest === "" ||
      (Number.isFinite(Number(p.personalBest)) &&
        Number(p.personalBest) > 0 &&
        Number(p.personalBest) <= 3600))
  );
}
function validTrial(value: unknown): value is Trial {
  if (!value || typeof value !== "object") return false;
  const t = value as Trial;
  return (
    typeof t.id === "string" &&
    t.id.length > 0 &&
    strokes.includes(t.stroke) &&
    events.includes(t.event) &&
    typeof t.notes === "string" &&
    typeof t.createdAt === "string" &&
    Number.isFinite(Date.parse(t.createdAt)) &&
    validateTrial(t) === null
  );
}
export function loadData(): { data: AppData; error: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: emptyData(), error: null };
    const parsed = JSON.parse(raw) as AppData;
    if (
      parsed.version !== 1 ||
      !validProfile(parsed.profile) ||
      !Array.isArray(parsed.tests) ||
      !parsed.tests.every(validTrial) ||
      new Set(parsed.tests.map((t) => t.id)).size !== parsed.tests.length ||
      !parsed.personalBests ||
      typeof parsed.personalBests !== "object" ||
      !Object.entries(parsed.personalBests).every(
        ([key, value]) =>
          /^(Freestyle|Backstroke|Butterfly)-(50|100|200)$/.test(key) &&
          typeof value === "string" &&
          (value === "" ||
            (Number.isFinite(Number(value)) &&
              Number(value) > 0 &&
              Number(value) <= 3600)),
      )
    ) {
      throw new Error("Invalid saved data");
    }
    return { data: parsed, error: null };
  } catch {
    return {
      data: emptyData(),
      error:
        "Saved data could not be read. It has not been overwritten. You can continue in memory or explicitly enable saving to replace it.",
    };
  }
}
export function saveData(data: AppData): string | null {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return null;
  } catch {
    return "Browser storage is unavailable or full. Your changes are only kept in this tab until saving succeeds.";
  }
}
