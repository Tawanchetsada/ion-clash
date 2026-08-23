import { describe, expect, it } from "vitest";
import { emptyErrorTally } from "../domain/chemistry/types";
import { CSV_COLUMNS, parseDelimited, toCsv, toTsv } from "./csv";
import type { ResearchEvent } from "./types";

describe("Research CSV / TSV Serialization", () => {
  const sampleEvents: ResearchEvent[] = [
    {
      playerName: "สมชาย ใจดี",
      installId: "install-123",
      levelId: 1,
      attemptNo: 1,
      startedAt: "2026-08-23T08:00:00.000Z",
      finishedAt: "2026-08-23T08:02:15.000Z",
      elapsedMs: 135000,
      completed: true,
      score: 90,
      stars: 3,
      hintsUsed: 1,
      wrongAttempts: 0,
      errorsByCode: {
        ...emptyErrorTally(),
        "E-PAIR": 1,
      },
    },
    {
      playerName: 'นักเรียน "A", ห้อง 4/1\nกลุ่ม 2',
      installId: "install-456",
      levelId: 2,
      attemptNo: 2,
      startedAt: "2026-08-23T08:05:00.000Z",
      finishedAt: "2026-08-23T08:07:30.000Z",
      elapsedMs: 150000,
      completed: true,
      score: 70,
      stars: 2,
      hintsUsed: 2,
      wrongAttempts: 3,
      errorsByCode: {
        "E-CHARGE": 2,
        "E-PAIR": 1,
        "E-PHASE": 0,
        "E-BALANCE": 0,
        "E-RATIO": 0,
        "E-SPECTATOR": 0,
      },
    },
  ];

  it("toCsv มี UTF-8 BOM (\\uFEFF) นำหน้าเสมอ", () => {
    const csv = toCsv(sampleEvents);
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it("toCsv และ parseDelimited ทำ round-trip ได้ข้อมูลครบถ้วน", () => {
    const csv = toCsv(sampleEvents);
    const parsed = parseDelimited(csv);

    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual(sampleEvents[0]);
    expect(parsed[1]).toEqual(sampleEvents[1]);
  });

  it("toTsv และ parseDelimited ทำ round-trip ได้ข้อมูลครบถ้วน", () => {
    const tsv = toTsv(sampleEvents);
    const parsed = parseDelimited(tsv);

    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual(sampleEvents[0]);
    expect(parsed[1]).toEqual(sampleEvents[1]);
  });

  it("TSV มีจำนวนแท็บถูกต้องตามหัวคอลัมน์", () => {
    const cleanEvents: ResearchEvent[] = [
      sampleEvents[0]!,
      {
        ...sampleEvents[1]!,
        playerName: "นักเรียน B",
      },
    ];
    const tsv = toTsv(cleanEvents);
    const lines = tsv.split("\n");
    expect(lines).toHaveLength(3); // header + 2 rows

    const expectedTabCount = CSV_COLUMNS.length - 1;
    for (const line of lines) {
      const tabCount = (line.match(/\t/g) || []).length;
      expect(tabCount).toBe(expectedTabCount);
    }
  });

  it("ชื่อผู้เล่นที่มีคอมมา เครื่องหมายคำพูด และขึ้นบรรทัดใหม่ ไม่ทำให้คอลัมน์เพี้ยน", () => {
    const complexEvent: ResearchEvent = {
      playerName: 'นาย ก, "ห้อง 4/2"\n(กลุ่ม 1)',
      installId: "complex-id",
      levelId: 10,
      attemptNo: 1,
      startedAt: "2026-08-23T08:10:00.000Z",
      finishedAt: "2026-08-23T08:12:00.000Z",
      elapsedMs: 120000,
      completed: true,
      score: 100,
      stars: 3,
      hintsUsed: 0,
      wrongAttempts: 0,
      errorsByCode: emptyErrorTally(),
    };

    const csv = toCsv([complexEvent]);
    const parsed = parseDelimited(csv);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.playerName).toBe('นาย ก, "ห้อง 4/2"\n(กลุ่ม 1)');
    expect(parsed[0]?.levelId).toBe(10);
  });

  it("parseDelimited ข้ามแถวที่ข้อมูลไม่สมบูรณ์โดยไม่ throw", () => {
    const brokenData = `playerName,levelId,score,stars\nValid,1,100,3\nInvalid,abc,not_a_number,xyz\nAnother,2,80,2`;
    const parsed = parseDelimited(brokenData);

    expect(parsed).toHaveLength(2);
    expect(parsed[0]?.levelId).toBe(1);
    expect(parsed[1]?.levelId).toBe(2);
  });

  it("parseDelimited คืนค่า array ว่างเมื่อข้อความว่างเปล่า", () => {
    expect(parseDelimited("")).toEqual([]);
    expect(parseDelimited("   ")).toEqual([]);
    expect(parseDelimited("\uFEFF")).toEqual([]);
  });
});
