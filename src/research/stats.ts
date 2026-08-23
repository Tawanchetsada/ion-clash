import { ERROR_CODES } from "../domain/chemistry/types";
import type { ErrorCode, ErrorTally } from "../domain/chemistry/types";
import type { ResearchEvent } from "./types";

export type ParticipantStats = {
  playerName: string;
  installId: string;
  completedLevelsCount: number;
  totalScore: number;
  totalTimeMs: number;
  e1: number;
  events: ResearchEvent[];
};

export type ErrorAnalysis = {
  tally: ErrorTally;
  totalErrors: number;
  percentages: Record<ErrorCode, number>;
  mostFrequent: ErrorCode[];
};

export type ResearchSummary = {
  participants: ParticipantStats[];
  overallE1: number;
  overallE2: number | null;
  e1Passed: boolean;
  e2Passed: boolean | null;
  benchmarkPassed: boolean | null;
  errorAnalysis: ErrorAnalysis;
  totalEventsCount: number;
};

/**
 * ตัดแถวซ้ำโดยใช้ installId + levelId + attemptNo
 * หากพบรายการซ้ำ ให้เลือกรายการที่เสร็จสมบูรณ์กว่า หรือบันทึกล่าสุด
 */
export function deduplicateEvents(
  events: readonly ResearchEvent[],
): ResearchEvent[] {
  const map = new Map<string, ResearchEvent>();

  for (const ev of events) {
    const pKey = ev.playerName.trim() ? ev.playerName.trim() : (ev.installId || "anon");
    const key = `${pKey}:${ev.levelId}:${ev.attemptNo}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, ev);
    } else {
      // หากมีอยู่แล้ว เลือกรายการที่ completed หรือมีคะแนนมากกว่า
      if (!existing.completed && ev.completed) {
        map.set(key, ev);
      } else if (ev.score > existing.score) {
        map.set(key, ev);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * คำนวณ E1 รายบุคคล (D-12, D-13)
 * E1 = (ผลรวมคะแนนของด่านที่เล่นจบ / (จำนวนด่านที่เล่นจบ * 100)) * 100
 */
export function calculateParticipantE1(
  events: readonly ResearchEvent[],
): { completedCount: number; totalScore: number; totalTimeMs: number; e1: number } {
  const completedEvents = events.filter((e) => e.completed);
  const completedCount = completedEvents.length;
  if (completedCount === 0) {
    return { completedCount: 0, totalScore: 0, totalTimeMs: 0, e1: 0 };
  }

  const totalScore = completedEvents.reduce((sum, e) => sum + e.score, 0);
  const totalTimeMs = completedEvents.reduce((sum, e) => sum + e.elapsedMs, 0);
  const e1 = (totalScore / (completedCount * 100)) * 100;

  return {
    completedCount,
    totalScore,
    totalTimeMs,
    e1: Math.round(e1 * 100) / 100,
  };
}

/**
 * คำนวณ E1 รวมของทุกคน
 * E1 รวม = ค่าเฉลี่ยของ E1 รายคน
 */
export function calculateOverallE1(participantE1s: readonly number[]): number {
  if (participantE1s.length === 0) return 0;
  const sum = participantE1s.reduce((a, b) => a + b, 0);
  return Math.round((sum / participantE1s.length) * 100) / 100;
}

/**
 * คำนวณ E2 รายบุคคล (D-07)
 * E2 = (คะแนนแบบทดสอบหลังเรียน / คะแนนเต็ม) * 100
 */
export function calculateParticipantE2(
  score: number,
  maxScore: number,
): number {
  if (maxScore <= 0 || score < 0) return 0;
  const e2 = (score / maxScore) * 100;
  return Math.round(e2 * 100) / 100;
}

/**
 * คำนวณ E2 รวมของทุกคน
 * E2 รวม = ค่าเฉลี่ยของ E2 รายคน
 */
export function calculateOverallE2(participantE2s: readonly number[]): number {
  if (participantE2s.length === 0) return 0;
  const sum = participantE2s.reduce((a, b) => a + b, 0);
  return Math.round((sum / participantE2s.length) * 100) / 100;
}

/**
 * วิเคราะห์ข้อผิดพลาดของผู้เรียนทั้ง 6 รหัส
 */
export function calculateErrorStats(
  events: readonly ResearchEvent[],
): ErrorAnalysis {
  const tally = {} as Record<ErrorCode, number>;
  for (const code of ERROR_CODES) {
    tally[code] = 0;
  }

  for (const ev of events) {
    if (ev.errorsByCode) {
      for (const code of ERROR_CODES) {
        tally[code] += ev.errorsByCode[code] ?? 0;
      }
    }
  }

  const totalErrors = Object.values(tally).reduce((sum, v) => sum + v, 0);

  const percentages = {} as Record<ErrorCode, number>;
  let maxCount = 0;

  for (const code of ERROR_CODES) {
    const count = tally[code];
    percentages[code] =
      totalErrors > 0 ? Math.round((count / totalErrors) * 1000) / 10 : 0;
    if (count > maxCount) {
      maxCount = count;
    }
  }

  const mostFrequent: ErrorCode[] =
    maxCount > 0
      ? ERROR_CODES.filter((code) => tally[code] === maxCount)
      : [];

  return {
    tally,
    totalErrors,
    percentages,
    mostFrequent,
  };
}

/**
 * จัดกลุ่ม events ตามผู้เรียน และคำนวณสถิติภาพรวม
 */
export function summarizeResearchData(
  events: readonly ResearchEvent[],
  e2Scores: Readonly<Record<string, { score: number; maxScore: number }>> = {},
): ResearchSummary {
  const deduped = deduplicateEvents(events);

  // จัดกลุ่มตามผู้เรียน (ใช้ playerName เป็นหลัก หากไม่มีให้ใช้ installId)
  const groupMap = new Map<string, ResearchEvent[]>();
  for (const ev of deduped) {
    const key = ev.playerName.trim() || ev.installId || "Unknown";
    const list = groupMap.get(key) ?? [];
    list.push(ev);
    groupMap.set(key, list);
  }

  const participants: ParticipantStats[] = [];
  const participantE1List: number[] = [];
  const participantE2List: number[] = [];

  for (const [name, pEvents] of groupMap.entries()) {
    const e1Stats = calculateParticipantE1(pEvents);
    const installId = pEvents[0]?.installId ?? "";

    participants.push({
      playerName: name,
      installId,
      completedLevelsCount: e1Stats.completedCount,
      totalScore: e1Stats.totalScore,
      totalTimeMs: e1Stats.totalTimeMs,
      e1: e1Stats.e1,
      events: pEvents,
    });

    if (e1Stats.completedCount > 0) {
      participantE1List.push(e1Stats.e1);
    }

    const e2Entry = e2Scores[name];
    if (e2Entry && e2Entry.maxScore > 0) {
      const e2 = calculateParticipantE2(e2Entry.score, e2Entry.maxScore);
      participantE2List.push(e2);
    }
  }

  // เรียงตามชื่อผู้เรียน
  participants.sort((a, b) => a.playerName.localeCompare(b.playerName, "th"));

  const overallE1 = calculateOverallE1(participantE1List);
  const overallE2 =
    participantE2List.length > 0
      ? calculateOverallE2(participantE2List)
      : null;

  const e1Passed = overallE1 >= 80;
  const e2Passed = overallE2 !== null ? overallE2 >= 80 : null;
  const benchmarkPassed =
    e2Passed !== null ? e1Passed && e2Passed : null;

  const errorAnalysis = calculateErrorStats(deduped);

  return {
    participants,
    overallE1,
    overallE2,
    e1Passed,
    e2Passed,
    benchmarkPassed,
    errorAnalysis,
    totalEventsCount: deduped.length,
  };
}
