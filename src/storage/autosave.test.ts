import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_AUTOSAVE_DELAY_MS,
  createAutosaveScheduler,
} from "./autosave";

describe("จังหวะบันทึกอัตโนมัติ", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("หน่วงก่อนบันทึก ไม่บันทึกทันที", () => {
    const save = vi.fn();
    createAutosaveScheduler({ save }).schedule();

    expect(save).not.toHaveBeenCalled();
    vi.advanceTimersByTime(DEFAULT_AUTOSAVE_DELAY_MS);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("เรียกรัว ๆ หลายครั้งรวมเป็นการบันทึกครั้งเดียว", () => {
    const save = vi.fn();
    const scheduler = createAutosaveScheduler({ save, delayMs: 300 });

    for (let index = 0; index < 10; index += 1) {
      scheduler.schedule();
      vi.advanceTimersByTime(50);
    }
    expect(save).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("flushNow บันทึกทันทีโดยไม่ต้องรอ", () => {
    const save = vi.fn();
    const scheduler = createAutosaveScheduler({ save });

    scheduler.schedule();
    scheduler.flushNow();

    expect(save).toHaveBeenCalledTimes(1);
    // งานที่ค้างถูกเคลียร์แล้ว ตัวจับเวลาเดิมต้องไม่ยิงซ้ำ
    vi.advanceTimersByTime(DEFAULT_AUTOSAVE_DELAY_MS * 2);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("flushNow ตอนไม่มีงานค้างไม่บันทึกซ้ำ", () => {
    const save = vi.fn();
    const scheduler = createAutosaveScheduler({ save });

    scheduler.flushNow();
    expect(save).not.toHaveBeenCalled();
  });

  it("dispose บันทึกงานที่ค้างก่อนเลิกเสมอ", () => {
    // กับดักที่แผนเตือนไว้ตรง ๆ — ผู้เล่นแก้คำตอบแล้วกดออกภายใน 500 ms
    // ถ้า dispose ทิ้งงานค้าง ข้อมูลรอบนั้นหายทันที
    const save = vi.fn();
    const scheduler = createAutosaveScheduler({ save });

    scheduler.schedule();
    scheduler.dispose();

    expect(save).toHaveBeenCalledTimes(1);
  });

  it("หลัง dispose แล้วสั่งงานเพิ่มไม่มีผล", () => {
    const save = vi.fn();
    const scheduler = createAutosaveScheduler({ save });

    scheduler.dispose();
    scheduler.schedule();
    vi.advanceTimersByTime(DEFAULT_AUTOSAVE_DELAY_MS * 2);
    scheduler.flushNow();

    expect(save).not.toHaveBeenCalled();
  });

  it("ใช้ตัวจับเวลาที่ฉีดเข้ามาแทนของจริงได้", () => {
    const save = vi.fn();
    const setTimeoutFn = vi.fn().mockReturnValue(7);
    const clearTimeoutFn = vi.fn();

    const scheduler = createAutosaveScheduler({
      save,
      setTimeoutFn,
      clearTimeoutFn,
    });
    scheduler.schedule();
    scheduler.schedule();

    expect(setTimeoutFn).toHaveBeenCalledTimes(2);
    expect(clearTimeoutFn).toHaveBeenCalledWith(7);
  });
});
