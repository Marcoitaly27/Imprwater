import type { AppData, Session } from "./model";
import { sessionTests } from "./model";
function cell(value: string | number) {
  let s = String(value);
  // Prevent spreadsheet formula execution in user-provided names and notes.
  if (/^[\s]*[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replaceAll('"', '""')}"`;
}
export function csvForSession(data: AppData, session: Session): string {
  const athlete = data.athletes.find((a) => a.id === session.athleteId)!;
  const rows: (string | number)[][] = [
    [
      "Athlete",
      "Session",
      "Date",
      "Stroke",
      "Event (m)",
      "Pool (m)",
      "Start type",
      "Test ID",
      "Recorded at",
      "Breakout (m)",
      "Kicks",
      "15 m time (s)",
      "Notes",
    ],
  ];
  sessionTests(data, session).forEach((t) =>
    rows.push([
      athlete.name,
      session.name,
      session.date ?? "Unknown",
      session.stroke,
      session.event,
      session.pool ?? "Unknown",
      session.startType ?? "Unknown",
      t.id,
      t.createdAt,
      t.distance,
      t.kicks,
      t.time,
      t.notes,
    ]),
  );
  return "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
export function download(contents: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
