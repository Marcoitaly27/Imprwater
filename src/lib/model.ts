export const strokes = ["Freestyle", "Backstroke", "Butterfly"] as const;
export const events = [50, 100, 200] as const;
export const startTypes = [
  "Block start",
  "In-water start",
  "Push after turn",
] as const;
export type Stroke = (typeof strokes)[number];
export type RaceEvent = (typeof events)[number];
export type StartType = (typeof startTypes)[number];
export type Athlete = {
  id: string;
  name: string;
  isDemo: boolean;
  personalBests: Record<string, string>;
};
export type Session = {
  id: string;
  athleteId: string;
  name: string;
  date: string | null;
  stroke: Stroke;
  event: RaceEvent;
  pool: 25 | 50 | null;
  startType: StartType | null;
  imported: boolean;
};
export type TrialInput = {
  distance: number;
  kicks: number;
  time: number;
  notes: string;
};
export type Trial = TrialInput & {
  id: string;
  sessionId: string;
  createdAt: string;
};
export type AppData = {
  version: 2;
  athletes: Athlete[];
  sessions: Session[];
  tests: Trial[];
  selectedAthleteId: string | null;
  selectedSessionId: string | null;
};
export const emptyData = (): AppData => ({
  version: 2,
  athletes: [],
  sessions: [],
  tests: [],
  selectedAthleteId: null,
  selectedSessionId: null,
});
export function decimal(value: string): number {
  const normalized = value.trim().replace(",", ".");
  return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
}
export function validateTrial(t: TrialInput): string | null {
  if (!Number.isFinite(t.distance) || t.distance < 1 || t.distance > 15)
    return "Breakout distance must be between 1 and 15 m.";
  if (!Number.isInteger(t.kicks) || t.kicks < 0 || t.kicks > 100)
    return "Enter a whole number of kicks between 0 and 100.";
  if (!Number.isFinite(t.time) || t.time <= 0 || t.time > 300)
    return "15 m time must be greater than 0 and at most 300 seconds.";
  if (typeof t.notes !== "string" || t.notes.length > 500)
    return "Notes must be at most 500 characters.";
  return null;
}
export function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
export const sessionComplete = (s: Session) =>
  !!s.date && s.pool !== null && s.startType !== null;
export function sessionTests(
  data: AppData,
  session: Session | undefined,
): Trial[] {
  if (!session || !data.athletes.some((a) => a.id === session.athleteId))
    return [];
  return data.tests.filter((t) => t.sessionId === session.id);
}
export function analyze(tests: Trial[]) {
  const sorted = [...tests].sort(
    (a, b) =>
      a.distance - b.distance ||
      a.time - b.time ||
      a.createdAt.localeCompare(b.createdAt),
  );
  const best = [...sorted].sort((a, b) => a.time - b.time)[0];
  const worst = [...sorted].sort((a, b) => b.time - a.time)[0];
  const groups = [...new Set(sorted.map((t) => t.distance))].map((distance) => {
    const times = sorted
      .filter((t) => t.distance === distance)
      .map((t) => t.time)
      .sort((a, b) => a - b);
    const count = times.length;
    const mean = times.reduce((sum, v) => sum + v, 0) / count;
    const median =
      count % 2
        ? times[Math.floor(count / 2)]
        : (times[count / 2 - 1] + times[count / 2]) / 2;
    const sd =
      count > 1
        ? Math.sqrt(
            times.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (count - 1),
          )
        : null;
    return {
      distance,
      count,
      mean,
      median,
      best: times[0],
      min: times[0],
      max: times[count - 1],
      sd,
    };
  });
  const bestMean = [...groups].sort(
    (a, b) => a.mean - b.mean || a.distance - b.distance,
  )[0];
  const meanTies = bestMean
    ? groups.filter((g) => g.mean === bestMean.mean)
    : [];
  return {
    sorted,
    best,
    worst,
    groups,
    bestMean,
    meanTies,
    tied: best ? sorted.filter((t) => t.time === best.time) : [],
    spread: best && worst ? worst.time - best.time : 0,
    preliminary: groups.length < 2 || groups.some((g) => g.count < 3),
  };
}
export function addDemo(data: AppData): AppData {
  const athleteId = crypto.randomUUID(),
    sessionId = crypto.randomUUID();
  const tests = [
    [8, 4, 6.51],
    [10, 5, 6.39],
    [12, 7, 6.31],
    [14, 9, 6.43],
  ].map(([distance, kicks, time], i) => ({
    id: crypto.randomUUID(),
    sessionId,
    distance,
    kicks,
    time,
    notes: "Demo observation",
    createdAt: new Date(Date.now() + i).toISOString(),
  }));
  return {
    ...data,
    athletes: [
      ...data.athletes,
      { id: athleteId, name: "Demo swimmer", isDemo: true, personalBests: {} },
    ],
    sessions: [
      ...data.sessions,
      {
        id: sessionId,
        athleteId,
        name: "Demo · breakout exploration",
        date: localDate(),
        stroke: "Freestyle",
        event: 100,
        pool: 25,
        startType: "Push after turn",
        imported: false,
      },
    ],
    tests: [...data.tests, ...tests],
    selectedAthleteId: athleteId,
    selectedSessionId: sessionId,
  };
}
