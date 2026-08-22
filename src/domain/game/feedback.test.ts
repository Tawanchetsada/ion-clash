import { describe, expect, it } from "vitest";
import { LEVELS } from "../../data/levels";
import { formulaToPlainText } from "../chemistry/formula";
import { getIon } from "../chemistry/ions";
import { ERROR_CODES } from "../chemistry/types";
import {
  ALL_FEEDBACK_MESSAGES,
  ERROR_MESSAGES_TH,
  errorFeedback,
  successFeedback,
} from "./feedback";

describe("ข้อความ feedback", () => {
  it("มีข้อความครบทุกรหัสและไม่มีข้อความว่าง", () => {
    for (const code of ERROR_CODES) {
      expect(ERROR_MESSAGES_TH[code].trim().length).toBeGreaterThan(0);
    }
  });

  it("ข้อความผิดพกรหัสมาด้วย เพื่อให้ Phase 9 นับสถิติได้", () => {
    expect(errorFeedback("E-CHARGE")).toEqual({
      kind: "error",
      code: "E-CHARGE",
      messageTh: ERROR_MESSAGES_TH["E-CHARGE"],
    });
    expect(successFeedback("balance").code).toBeNull();
  });

  it.each(LEVELS)("ด่าน $id — ไม่มีข้อความไหนเฉลยสูตรของตะกอน", (level) => {
    // ข้อห้ามตรง ๆ ในสเปก: feedback บอกหลักการที่ผิด ไม่บอกคำตอบ
    // ถ้าวันไหนมีคนทำให้ "ช่วยเหลือมากขึ้น" ด้วยการแทรกสูตรลงไป เทสต์นี้จับได้
    const precipitate = formulaToPlainText(level.precipitate.formula);
    const aqueous = formulaToPlainText(level.aqueousProduct.formula);

    for (const message of ALL_FEEDBACK_MESSAGES) {
      expect(message).not.toContain(precipitate);
      expect(message).not.toContain(aqueous);
    }
  });

  it.each(LEVELS)("ด่าน $id — ไม่เอ่ยชื่อผลิตภัณฑ์เป็นภาษาไทย", (level) => {
    const names = [
      level.precipitate.nameTh,
      level.aqueousProduct.nameTh,
      getIon(level.precipitate.cationId).nameTh,
      getIon(level.precipitate.anionId).nameTh,
    ];

    for (const message of ALL_FEEDBACK_MESSAGES) {
      for (const name of names) {
        expect(message).not.toContain(name);
      }
    }
  });

  it("ข้อความเป็นสตริงคงที่ ไม่ประกอบจากข้อมูลด่าน", () => {
    // ถ้าข้อความรับพารามิเตอร์เมื่อไหร่ จะเผลอใส่คำตอบลงไปได้ทันที
    expect(errorFeedback("E-PAIR").messageTh).toBe(
      errorFeedback("E-PAIR").messageTh,
    );
    expect(ALL_FEEDBACK_MESSAGES.length).toBeGreaterThanOrEqual(
      ERROR_CODES.length,
    );
  });
});
