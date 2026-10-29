import {
  emptyData,
  events,
  strokes,
  startTypes,
  validDate,
  validateTrial,
} from "./model";
import type {
  AppData,
  Athlete,
  Session,
  Trial,
  Stroke,
  RaceEvent,
} from "./model";
export const STORAGE_KEY = "underwater-optimizer:v2";
export const LEGACY_KEY = "underwater-optimizer:v1";
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const id = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.length <= 200;
const name = (v: unknown): v is string =>
  typeof v === "string" && v.trim().length > 0 && v.length <= 100;
const pb = (v: unknown): v is Record<string, string> =>
  record(v) &&
  Object.entries(v).every(
    ([k, v]) =>
      /^(Freestyle|Backstroke|Butterfly)-(50|100|200)$/.test(k) &&
      typeof v === "string" &&
      (v === "" ||
        (Number.isFinite(Number(v)) && Number(v) > 0 && Number(v) <= 3600)),
  );
const unique = (values: string[]) => new Set(values).size === values.length;
export function validateData(value: unknown): AppData {
  if (
    !record(value) ||
    value.version !== 2 ||
    !Array.isArray(value.athletes) ||
    !Array.isArray(value.sessions) ||
    !Array.isArray(value.tests)
  )
    throw new Error(
      "Unsupported or invalid backup format. Expected version 2.",
    );
  const d = value as unknown as AppData;
  if (
    !d.athletes.every(
      (a: Athlete) =>
        record(a) &&
        id(a.id) &&
        name(a.name) &&
        typeof a.isDemo === "boolean" &&
        pb(a.personalBests),
    ) ||
    !unique(d.athletes.map((a) => a.id))
  )
    throw new Error("Invalid athletes or duplicate athlete IDs.");
  if (
    !d.sessions.every(
      (s: Session) =>
        record(s) &&
        id(s.id) &&
        d.athletes.some((a) => a.id === s.athleteId) &&
        name(s.name) &&
        (s.date === null || validDate(s.date)) &&
        strokes.includes(s.stroke) &&
        events.includes(s.event) &&
        [25, 50, null].includes(s.pool) &&
        (s.startType === null || startTypes.includes(s.startType)) &&
        typeof s.imported === "boolean",
    ) ||
    !unique(d.sessions.map((s) => s.id))
  )
    throw new Error("Invalid session conditions or athlete references.");
  if (
    !d.tests.every(
      (t: Trial) =>
        record(t) &&
        id(t.id) &&
        d.sessions.some((s) => s.id === t.sessionId) &&
        typeof t.createdAt === "string" &&
        Number.isFinite(Date.parse(t.createdAt)) &&
        validateTrial(t) === null,
    ) ||
    !unique(d.tests.map((t) => t.id))
  )
    throw new Error(
      "Invalid observations, duplicate IDs, or session references.",
    );
  if (
    !(
      d.selectedAthleteId === null ||
      d.athletes.some((a) => a.id === d.selectedAthleteId)
    ) ||
    !(
      d.selectedSessionId === null ||
      d.sessions.some(
        (s) =>
          s.id === d.selectedSessionId && s.athleteId === d.selectedAthleteId,
      )
    )
  )
    throw new Error("Invalid active context.");
  // Strip unknown properties instead of carrying them into future saves.
  return {
    version: 2,
    athletes: d.athletes.map(({ id, name, isDemo, personalBests }) => ({
      id,
      name,
      isDemo,
      personalBests: { ...personalBests },
    })),
    sessions: d.sessions.map(
      ({
        id,
        athleteId,
        name,
        date,
        stroke,
        event,
        pool,
        startType,
        imported,
      }) => ({
        id,
        athleteId,
        name,
        date,
        stroke,
        event,
        pool,
        startType,
        imported,
      }),
    ),
    tests: d.tests.map(
      ({ id, sessionId, distance, kicks, time, notes, createdAt }) => ({
        id,
        sessionId,
        distance,
        kicks,
        time,
        notes,
        createdAt,
      }),
    ),
    selectedAthleteId: d.selectedAthleteId,
    selectedSessionId: d.selectedSessionId,
  };
}
export function migrateLegacy(value: unknown): AppData {
  if (
    !record(value) ||
    value.version !== 1 ||
    !record(value.profile) ||
    !strokes.includes(value.profile.stroke as Stroke) ||
    !events.includes(value.profile.event as RaceEvent) ||
    !pb(value.personalBests) ||
    !Array.isArray(value.tests) ||
    typeof value.profile.personalBest !== "string" ||
    !pb({
      [`${value.profile.stroke}-${value.profile.event}`]:
        value.profile.personalBest,
    })
  )
    throw new Error("Invalid legacy data.");
  const old = value.tests;
  if (
    !old.every(
      (t) =>
        record(t) &&
        id(t.id) &&
        strokes.includes(t.stroke as Stroke) &&
        events.includes(t.event as RaceEvent) &&
        typeof t.createdAt === "string" &&
        Number.isFinite(Date.parse(t.createdAt)) &&
        validateTrial(t as unknown as Trial) === null,
    ) ||
    !unique(old.map((t) => t.id))
  )
    throw new Error("Invalid legacy observations.");
  const athleteId = crypto.randomUUID();
  const data = emptyData();
  data.athletes = [
    {
      id: athleteId,
      name: "Imported athlete",
      isDemo: false,
      personalBests: {
        ...value.personalBests,
        [`${value.profile.stroke}-${value.profile.event}`]:
          value.profile.personalBest,
      },
    },
  ];
  // Legacy data had no session dates, pool lengths, or start types. Never infer them from timestamps.
  const contexts = [
    ...new Set([
      `${value.profile.stroke}-${value.profile.event}`,
      ...old.map((t) => `${t.stroke}-${t.event}`),
    ]),
  ];
  for (const key of contexts) {
    const [stroke, event] = key.split("-") as [Stroke, string];
    const sessionId = crypto.randomUUID();
    data.sessions.push({
      id: sessionId,
      athleteId,
      name: `Imported · ${stroke} ${event} m`,
      date: null,
      stroke,
      event: Number(event) as RaceEvent,
      pool: null,
      startType: null,
      imported: true,
    });
    data.tests.push(
      ...old
        .filter((t) => t.stroke === stroke && t.event === Number(event))
        .map((t) => ({
          id: t.id,
          sessionId,
          distance: t.distance,
          kicks: t.kicks,
          time: t.time,
          notes: t.notes,
          createdAt: t.createdAt,
        })),
    );
  }
  data.selectedAthleteId = athleteId;
  data.selectedSessionId = data.sessions[0].id;
  return validateData(data);
}
export function loadData(): {
  data: AppData;
  error: string | null;
  migrated: boolean;
} {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    if (current !== null)
      return {
        data: validateData(JSON.parse(current)),
        error: null,
        migrated: false,
      };
    const legacy = localStorage.getItem(LEGACY_KEY);
    return {
      data: legacy !== null ? migrateLegacy(JSON.parse(legacy)) : emptyData(),
      error: null,
      migrated: legacy !== null,
    };
  } catch {
    return {
      data: emptyData(),
      error:
        "Saved data could not be read. The original has not been overwritten. Continue in this tab, download a backup, or explicitly enable saving to replace the unreadable v2 data.",
      migrated: false,
    };
  }
}
export function saveData(data: AppData): string | null {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validateData(data)));
    return null;
  } catch {
    return "Browser storage is unavailable or full. Changes are only in this tab. Download a backup before closing, or retry saving.";
  }
}
export function parseBackup(raw: string): AppData {
  if (raw.length > 10_000_000)
    throw new Error("Backup exceeds the 10 MB limit.");
  const value: unknown = JSON.parse(raw);
  return record(value) && value.version === 1
    ? migrateLegacy(value)
    : validateData(value);
}
