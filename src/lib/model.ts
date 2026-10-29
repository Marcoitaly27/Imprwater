export const strokes = ["Freestyle", "Backstroke", "Butterfly"] as const;
export const events = [50, 100, 200] as const;
export type Stroke = (typeof strokes)[number];
export type RaceEvent = (typeof events)[number];
export type Profile = {
  stroke: Stroke;
  event: RaceEvent;
  personalBest: string;
};
export type Trial = {
  id: string;
  stroke: Stroke;
  event: RaceEvent;
  distance: number;
  kicks: number;
  time: number;
  notes: string;
  createdAt: string;
};
export type TrialInput = Pick<Trial, "distance" | "kicks" | "time" | "notes">;
export type AppData = {
  version: 1;
  profile: Profile;
  personalBests: Record<string, string>;
  tests: Trial[];
};
export const profileKey = (profile: Pick<Profile, "stroke" | "event">) =>
  `${profile.stroke}-${profile.event}`;
export const emptyData = (): AppData => ({
  version: 1,
  profile: { stroke: "Freestyle", event: 100, personalBest: "" },
  personalBests: {},
  tests: [],
});
export function validateTrial(input: TrialInput): string | null {
  if (
    !Number.isFinite(input.distance) ||
    input.distance < 1 ||
    input.distance > 15
  )
    return "Breakout distance must be between 1 and 15 meters.";
  if (!Number.isInteger(input.kicks) || input.kicks < 0 || input.kicks > 100)
    return "Enter a whole number of kicks between 0 and 100.";
  if (!Number.isFinite(input.time) || input.time <= 0 || input.time > 300)
    return "15 m time must be greater than 0 and no more than 300 seconds.";
  if (input.notes.length > 500) return "Notes must be 500 characters or fewer.";
  return null;
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
  const tied = best ? sorted.filter((t) => t.time === best.time) : [];
  const longer = best
    ? sorted
        .filter((t) => t.distance > best.distance)
        .sort((a, b) => a.distance - b.distance || a.time - b.time)[0]
    : undefined;
  return {
    sorted,
    best,
    worst,
    tied,
    longer,
    improvement: best && worst ? worst.time - best.time : 0,
  };
}
export function makeDemo(profile: Profile): Trial[] {
  return [
    [8, 4, 6.51],
    [10, 5, 6.39],
    [12, 7, 6.31],
    [14, 9, 6.43],
  ].map(([distance, kicks, time], i) => ({
    id: crypto.randomUUID(),
    stroke: profile.stroke,
    event: profile.event,
    distance,
    kicks,
    time,
    notes: "Demo test",
    createdAt: new Date(Date.now() + i).toISOString(),
  }));
}
