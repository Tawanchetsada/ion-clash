import { describe, expect, it } from "vitest";
import { MESSAGES } from "./messages";
import { ERROR_CODES } from "../domain/chemistry/types";

describe("MESSAGES", () => {
  it("มีข้อความ error ครบทั้ง 6 รหัสตาม ERROR_CODES", () => {
    for (const code of ERROR_CODES) {
      expect(MESSAGES.error[code]).toBeDefined();
      expect(typeof MESSAGES.error[code]).toBe("string");
      expect(MESSAGES.error[code].length).toBeGreaterThan(0);
    }
  });

  it("ข้อความ error ไม่มีสูตรเคมีของสารตั้งต้นหรือผลิตภัณฑ์ (ไม่เฉลยคำตอบ)", () => {
    for (const code of ERROR_CODES) {
      const msg = MESSAGES.error[code];
      // ต้องไม่มีสูตรที่ระบุสารเจาะจง เช่น AgCl, BaSO4, Na+, etc.
      expect(msg).not.toMatch(/[A-Z][a-z]?\d*/);
      expect(msg).not.toMatch(/[⁺⁻]/);
    }
  });

  it("มีข้อความ success, save, toast, ui ครบถ้วน", () => {
    expect(Object.keys(MESSAGES.success).length).toBe(6);
    expect(Object.keys(MESSAGES.save).length).toBeGreaterThanOrEqual(4);
    expect(MESSAGES.ui.steps.length).toBe(5);
    expect(typeof MESSAGES.toast.unlocked(5)).toBe("string");
    expect(MESSAGES.toast.unlocked(5)).toContain("5");
    expect(MESSAGES.ui.hintButton(2)).toContain("2");
  });
});
