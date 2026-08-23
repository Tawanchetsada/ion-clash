import { ERROR_CODES } from "../domain/chemistry/types";
import type { ErrorCode } from "../domain/chemistry/types";
import type { ResearchEvent } from "./types";

export const CSV_COLUMNS = [
  "playerName",
  "installId",
  "levelId",
  "attemptNo",
  "completed",
  "score",
  "stars",
  "elapsedMs",
  "hintsUsed",
  "wrongAttempts",
  "E-CHARGE",
  "E-PAIR",
  "E-PHASE",
  "E-BALANCE",
  "E-RATIO",
  "E-SPECTATOR",
  "startedAt",
  "finishedAt",
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];

const UTF8_BOM = "\uFEFF";

function escapeField(value: unknown, delimiter: string): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  const needsQuotes =
    str.includes(delimiter) ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r");

  if (!needsQuotes) {
    return str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

function eventToRow(event: ResearchEvent, delimiter: string): string {
  const rowValues: Record<CsvColumn, unknown> = {
    playerName: event.playerName,
    installId: event.installId,
    levelId: event.levelId,
    attemptNo: event.attemptNo,
    completed: event.completed,
    score: event.score,
    stars: event.stars,
    elapsedMs: event.elapsedMs,
    hintsUsed: event.hintsUsed,
    wrongAttempts: event.wrongAttempts,
    "E-CHARGE": event.errorsByCode["E-CHARGE"] ?? 0,
    "E-PAIR": event.errorsByCode["E-PAIR"] ?? 0,
    "E-PHASE": event.errorsByCode["E-PHASE"] ?? 0,
    "E-BALANCE": event.errorsByCode["E-BALANCE"] ?? 0,
    "E-RATIO": event.errorsByCode["E-RATIO"] ?? 0,
    "E-SPECTATOR": event.errorsByCode["E-SPECTATOR"] ?? 0,
    startedAt: event.startedAt,
    finishedAt: event.finishedAt ?? "",
  };

  return CSV_COLUMNS.map((col) => escapeField(rowValues[col], delimiter)).join(
    delimiter,
  );
}

export function toTsv(events: readonly ResearchEvent[]): string {
  const header = CSV_COLUMNS.join("\t");
  const rows = events.map((ev) => eventToRow(ev, "\t"));
  return [header, ...rows].join("\n");
}

export function toCsv(events: readonly ResearchEvent[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = events.map((ev) => eventToRow(ev, ","));
  return UTF8_BOM + [header, ...rows].join("\n");
}

/**
 * ตัวแบ่งแถวและคอลัมน์มาตรฐาน RFC 4180
 * รองรับข้อความที่มี comma/tab, newline, และ quote ภายในช่อง
 */
function parseRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      currentField += char;
      i++;
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
      } else if (char === delimiter) {
        currentRow.push(currentField);
        currentField = "";
        i++;
      } else if (char === "\r") {
        if (i + 1 < text.length && text[i + 1] === "\n") {
          i++;
        }
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
        i++;
      } else if (char === "\n") {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
        i++;
      } else {
        currentField += char;
        i++;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

export function parseDelimited(text: string): ResearchEvent[] {
  let cleanText = text;
  if (cleanText.startsWith(UTF8_BOM)) {
    cleanText = cleanText.slice(UTF8_BOM.length);
  }
  cleanText = cleanText.trim();
  if (!cleanText) return [];

  // ตรวจสอบ delimiter จากบรรทัดแรก
  const firstLine = cleanText.split(/\r?\n/)[0] ?? "";
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = tabCount >= commaCount && tabCount > 0 ? "\t" : ",";

  const rawRows = parseRows(cleanText, delimiter);
  if (rawRows.length < 2) return [];

  const headerRow = rawRows[0]!.map((h) => h.trim());
  const headerMap = new Map<string, number>();
  headerRow.forEach((name, idx) => {
    headerMap.set(name, idx);
  });

  const getColVal = (row: string[], colName: string): string => {
    const idx = headerMap.get(colName);
    if (idx === undefined || idx >= row.length) return "";
    return row[idx]!.trim();
  };

  const results: ResearchEvent[] = [];

  for (let r = 1; r < rawRows.length; r++) {
    const row = rawRows[r]!;
    if (row.length === 0 || (row.length === 1 && row[0] === "")) continue;

    try {
      const levelId = Number(getColVal(row, "levelId"));
      if (!Number.isInteger(levelId) || levelId < 1 || levelId > 50) {
        continue;
      }

      const attemptNo = Number(getColVal(row, "attemptNo")) || 1;
      const score = Math.max(0, Math.min(100, Number(getColVal(row, "score")) || 0));
      const rawStars = Number(getColVal(row, "stars")) || 0;
      const stars = (rawStars >= 0 && rawStars <= 3 ? rawStars : 0) as 0 | 1 | 2 | 3;
      const elapsedMs = Math.max(0, Number(getColVal(row, "elapsedMs")) || 0);
      const hintsUsed = Math.max(0, Math.min(3, Number(getColVal(row, "hintsUsed")) || 0));
      const wrongAttempts = Math.max(0, Number(getColVal(row, "wrongAttempts")) || 0);

      const rawCompleted = getColVal(row, "completed").toLowerCase();
      const completed = rawCompleted === "true" || rawCompleted === "1";

      const errorsByCode = {} as Record<ErrorCode, number>;
      for (const code of ERROR_CODES) {
        errorsByCode[code] = Math.max(0, Number(getColVal(row, code)) || 0);
      }

      const startedAt = getColVal(row, "startedAt") || new Date(0).toISOString();
      const rawFinishedAt = getColVal(row, "finishedAt");
      const finishedAt = rawFinishedAt && rawFinishedAt !== "" ? rawFinishedAt : null;

      const playerName = getColVal(row, "playerName");
      const installId = getColVal(row, "installId");

      results.push({
        playerName,
        installId,
        levelId,
        attemptNo,
        startedAt,
        finishedAt,
        elapsedMs,
        completed,
        score,
        stars,
        hintsUsed,
        wrongAttempts,
        errorsByCode,
      });
    } catch {
      // ข้ามแถวที่ parse ไม่ผ่านโดยไม่ throw
    }
  }

  return results;
}
