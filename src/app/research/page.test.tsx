import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyErrorTally } from "../../domain/chemistry/types";
import { toTsv } from "../../research/csv";
import type { ResearchEvent } from "../../research/types";
import { ResearchProvider } from "../../session/ResearchProvider";
import { SaveProvider } from "../../session/SaveProvider";
import { ToastProvider } from "../../session/ToastProvider";
import { createFakeStorage } from "../../storage/__fixtures__/fakeStorage";
import { createGameSaveRepository } from "../../storage/repository";
import ResearchPage from "./page";

const pushSpy = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushSpy,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("Research Dashboard Page (/research)", () => {
  beforeEach(() => {
    pushSpy.mockClear();
  });

  const sampleEvents: ResearchEvent[] = [
    {
      playerName: "Student-01",
      installId: "i-1",
      levelId: 1,
      attemptNo: 1,
      startedAt: "2026-08-23T08:00:00.000Z",
      finishedAt: "2026-08-23T08:02:00.000Z",
      elapsedMs: 120000,
      completed: true,
      score: 90,
      stars: 3,
      hintsUsed: 0,
      wrongAttempts: 0,
      errorsByCode: {
        ...emptyErrorTally(),
        "E-CHARGE": 2,
      },
    },
    {
      playerName: "Student-02",
      installId: "i-2",
      levelId: 1,
      attemptNo: 1,
      startedAt: "2026-08-23T08:00:00.000Z",
      finishedAt: "2026-08-23T08:02:00.000Z",
      elapsedMs: 100000,
      completed: true,
      score: 80,
      stars: 2,
      hintsUsed: 1,
      wrongAttempts: 1,
      errorsByCode: {
        ...emptyErrorTally(),
        "E-PAIR": 1,
      },
    },
  ];

  it("render หน้าแดชบอร์ดข้อมูลวิจัยครบทั้ง 5 ส่วน", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    render(
      <SaveProvider repository={repo}>
        <ToastProvider>
          <ResearchProvider>
            <ResearchPage />
          </ResearchProvider>
        </ToastProvider>
      </SaveProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /แดชบอร์ดข้อมูลวิจัยและการประเมิน E1\/E2/,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("1. นำเข้าข้อมูลผลการเรียนรู้")).toBeInTheDocument();
    expect(
      screen.getByText("2. สรุปผลประสิทธิภาพตามเกณฑ์ 80/80"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/3. สรุปผลรายบุคคลและกรอกคะแนน E2/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("4. สถิติข้อผิดพลาดของผู้เรียน (Error Analysis)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/5. บันทึกเหตุการณ์รายด่านทั้งหมด/),
    ).toBeInTheDocument();
  });

  it("นำเข้าข้อความ TSV และคำนวณ E1, แสดงข้อผิดพลาดถูกต้อง", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    render(
      <SaveProvider repository={repo}>
        <ToastProvider>
          <ResearchProvider>
            <ResearchPage />
          </ResearchProvider>
        </ToastProvider>
      </SaveProvider>,
    );

    const tsvData = toTsv(sampleEvents);
    const textarea = screen.getByPlaceholderText("วางข้อมูล TSV หรือ CSV ที่นี่...");

    act(() => {
      fireEvent.change(textarea, { target: { value: tsvData } });
    });

    const processBtn = screen.getByRole("button", { name: "ประมวลผลข้อความ" });
    act(() => {
      fireEvent.click(processBtn);
    });

    // E1 for S01=90, S02=80 -> avg = 85.0%
    expect(screen.getByText("85.0%")).toBeInTheDocument();
    expect(screen.getByText("ผ่านเกณฑ์ (≥80)")).toBeInTheDocument();
    expect(screen.getAllByText("Student-01").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Student-02").length).toBeGreaterThanOrEqual(1);
  });

  it("กรอกคะแนน E2 คำนวณ E2 และแสดงสถานะผ่านเกณฑ์ 80/80", async () => {
    const storage = createFakeStorage();
    const repo = createGameSaveRepository({ storage });

    render(
      <SaveProvider repository={repo}>
        <ToastProvider>
          <ResearchProvider>
            <ResearchPage />
          </ResearchProvider>
        </ToastProvider>
      </SaveProvider>,
    );

    const tsvData = toTsv(sampleEvents);
    const textarea = screen.getByPlaceholderText("วางข้อมูล TSV หรือ CSV ที่นี่...");

    act(() => {
      fireEvent.change(textarea, { target: { value: tsvData } });
      fireEvent.click(screen.getByRole("button", { name: "ประมวลผลข้อความ" }));
    });

    // Student-01 E2 score input (24 / 30 = 80%)
    // Student-02 E2 score input (27 / 30 = 90%)
    const e2Inputs = screen.getAllByPlaceholderText("0");
    expect(e2Inputs).toHaveLength(2);

    act(() => {
      fireEvent.change(e2Inputs[0]!, { target: { value: "24" } });
      fireEvent.change(e2Inputs[1]!, { target: { value: "27" } });
    });

    // Overall E1 = 85.0%, Overall E2 = 85.0% -> ผ่านเกณฑ์ 80/80
    expect(screen.getByText("85.0 / 85.0")).toBeInTheDocument();
    expect(screen.getByText("✓ ผ่านเกณฑ์ 80/80")).toBeInTheDocument();
  });
});
