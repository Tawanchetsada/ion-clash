import { describe, expect, it } from "vitest";
import { buildCompoundById } from "./compounds";
import { formulaToPlainText } from "./formula";
import {
  aqueousProductOf,
  buildReaction,
  crossExchange,
  isPairingComplete,
  precipitateOf,
  validateProductPairing,
  type ProductSlot,
} from "./reaction";

const c = buildCompoundById;

/** ด่าน 01 — AgNO₃ + NaCl → AgCl + NaNO₃ */
const level01 = buildReaction(
  c("silver-plus", "nitrate"),
  c("sodium-plus", "chloride"),
);

const slot = (ionId: string | null): ProductSlot => ({ ionId });

describe("แลกคู่ไอออน", () => {
  it("ไอออนบวกจาก A จับกับไอออนลบจาก B และสลับกัน", () => {
    const [productA, productB] = crossExchange(
      c("silver-plus", "nitrate"),
      c("sodium-plus", "chloride"),
    );

    expect(formulaToPlainText(productA.formula)).toBe("AgCl");
    expect(formulaToPlainText(productB.formula)).toBe("NaNO3");
  });

  it("สร้างแบบจำลองปฏิกิริยาพร้อมสัมประสิทธิ์", () => {
    expect(level01.coefficients).toEqual({ a: 1, b: 1, c: 1, d: 1 });
    expect(level01.productA.phase).toBe("s");
    expect(level01.productB.phase).toBe("aq");
  });

  it("แยกตะกอนกับผลิตภัณฑ์ที่ละลายน้ำได้", () => {
    expect(formulaToPlainText(precipitateOf(level01).formula)).toBe("AgCl");
    expect(formulaToPlainText(aqueousProductOf(level01).formula)).toBe("NaNO3");
  });

  it("โยน error เมื่อไม่เกิดตะกอน แทนที่จะปล่อยผ่านเงียบ ๆ", () => {
    // NaCl + KNO₃ ละลายทั้งคู่ ไม่เกิดปฏิกิริยา
    const noReaction = buildReaction(
      c("sodium-plus", "chloride"),
      c("potassium-plus", "nitrate"),
    );
    expect(() => precipitateOf(noReaction)).toThrow(/ตะกอน 0 ตัว/);
  });
});

describe("ตรวจการจับคู่ผลิตภัณฑ์", () => {
  it("ปุ่มตรวจเปิดได้เมื่อวางครบ 4 ช่อง", () => {
    expect(isPairingComplete([slot("silver-plus"), slot("chloride")])).toBe(
      false,
    );
    expect(
      isPairingComplete([
        slot("silver-plus"),
        slot("chloride"),
        slot("sodium-plus"),
        slot(null),
      ]),
    ).toBe(false);
    expect(
      isPairingComplete([
        slot("silver-plus"),
        slot("chloride"),
        slot("sodium-plus"),
        slot("nitrate"),
      ]),
    ).toBe(true);
  });

  it("โยน error ถ้าเรียกตรวจทั้งที่ช่องยังไม่ครบ", () => {
    expect(() =>
      validateProductPairing([slot("silver-plus"), slot(null)], level01),
    ).toThrow(/ครบ 4 ช่อง/);
  });

  it("ผ่านเมื่อจับคู่ถูกต้อง", () => {
    expect(
      validateProductPairing(
        [
          slot("silver-plus"),
          slot("chloride"),
          slot("sodium-plus"),
          slot("nitrate"),
        ],
        level01,
      ),
    ).toEqual({ ok: true });
  });

  it("ไม่บังคับว่าคู่ตะกอนต้องอยู่คู่ไหน — สลับคู่ก็ถูก", () => {
    expect(
      validateProductPairing(
        [
          slot("sodium-plus"),
          slot("nitrate"),
          slot("silver-plus"),
          slot("chloride"),
        ],
        level01,
      ),
    ).toEqual({ ok: true });
  });

  it("E-PAIR เมื่อ anion นำหน้า cation ในคู่", () => {
    expect(
      validateProductPairing(
        [
          slot("chloride"),
          slot("silver-plus"),
          slot("sodium-plus"),
          slot("nitrate"),
        ],
        level01,
      ),
    ).toEqual({ ok: false, code: "E-PAIR" });
  });

  it("E-PAIR เมื่อจับคู่ไอออนจากสารตั้งต้นเดียวกัน (ไม่ได้แลกคู่)", () => {
    expect(
      validateProductPairing(
        [
          slot("silver-plus"),
          slot("nitrate"),
          slot("sodium-plus"),
          slot("chloride"),
        ],
        level01,
      ),
    ).toEqual({ ok: false, code: "E-PAIR" });
  });

  it("E-CHARGE เมื่อจับไอออนประจุเดียวกันไว้ในคู่เดียว", () => {
    expect(
      validateProductPairing(
        [
          slot("silver-plus"),
          slot("sodium-plus"),
          slot("chloride"),
          slot("nitrate"),
        ],
        level01,
      ),
    ).toEqual({ ok: false, code: "E-CHARGE" });
  });

  it("E-PHASE เมื่อจับคู่ถูกแต่ระบุสถานะผิด", () => {
    expect(
      validateProductPairing(
        [
          { ionId: "silver-plus", claimedPhase: "aq" },
          { ionId: "chloride", claimedPhase: "aq" },
          slot("sodium-plus"),
          slot("nitrate"),
        ],
        level01,
      ),
    ).toEqual({ ok: false, code: "E-PHASE" });
  });

  it("ผ่านเมื่อระบุสถานะถูกต้อง", () => {
    expect(
      validateProductPairing(
        [
          { ionId: "silver-plus", claimedPhase: "s" },
          { ionId: "chloride", claimedPhase: "s" },
          { ionId: "sodium-plus", claimedPhase: "aq" },
          { ionId: "nitrate", claimedPhase: "aq" },
        ],
        level01,
      ),
    ).toEqual({ ok: true });
  });

  it("E-PAIR เมื่อใช้ไอออนที่ไม่ได้มาจากสารตั้งต้น", () => {
    expect(
      validateProductPairing(
        [
          slot("silver-plus"),
          slot("chloride"),
          slot("silver-plus"),
          slot("chloride"),
        ],
        level01,
      ),
    ).toEqual({ ok: false, code: "E-PAIR" });
  });
});
