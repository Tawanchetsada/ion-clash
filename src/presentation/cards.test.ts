import { describe, expect, it } from "vitest";
import { getLevel } from "../data/levels";
import { formulaToPlainText } from "../domain/chemistry/formula";
import { completeIonicCards, reactantIonCards } from "../domain/game/instances";
import { compoundCardView, equationCardView, ionCardView } from "./cards";

const level = getLevel(1); // AgNO3 + NaCl -> AgCl(s) + NaNO3(aq)

describe("ionCardView", () => {
  it("แปลงการ์ดไอออนสารตั้งต้นเป็นสูตร ชื่อ และป้ายเสียงตรงกัน", () => {
    const [silver] = reactantIonCards(level);
    if (!silver) throw new Error("fixture ผิด");
    const view = ionCardView(silver);

    expect(view.instanceId).toBe(silver.instanceId);
    expect(formulaToPlainText(view.formula)).toBe("Ag+");
    expect(view.tone).toBe("cation");
    expect(view.ariaLabel).toContain(view.nameTh);
  });

  it("ไอออนลบได้ tone เป็น anion", () => {
    const cards = reactantIonCards(level);
    const chloride = cards[3];
    if (!chloride) throw new Error("fixture ผิด");
    expect(ionCardView(chloride).tone).toBe("anion");
  });
});

describe("compoundCardView — สีทองต้องมาจาก revealed เท่านั้น", () => {
  it("revealed: false ไม่คืนสีทอง แม้สารนั้นจะเป็นตะกอนจริง", () => {
    const view = compoundCardView(level.precipitate, { revealed: false });
    expect(level.precipitate.phase).toBe("s");
    expect(view.tone).not.toBe("gold");
    expect(view.tone).toBe("neutral");
  });

  it("revealed: true และเป็นตะกอนจริง จึงเป็นสีทอง", () => {
    const view = compoundCardView(level.precipitate, { revealed: true });
    expect(view.tone).toBe("gold");
  });

  it("revealed: true แต่ไม่ใช่ตะกอน (ละลายน้ำ) ยังไม่เป็นสีทอง", () => {
    const view = compoundCardView(level.aqueousProduct, { revealed: true });
    expect(level.aqueousProduct.phase).toBe("aq");
    expect(view.tone).not.toBe("gold");
  });
});

describe("equationCardView", () => {
  it("พจน์ไอออนอิสระได้ tone ตามประจุ ไม่ใช่ gold แม้ revealed: true", () => {
    const { left } = completeIonicCards(level);
    for (const card of left) {
      const view = equationCardView(card, { revealed: true });
      expect(["cation", "anion"]).toContain(view.tone);
    }
  });

  it("พจน์ตะกอนในฝั่งขวาเป็นสีทองเฉพาะเมื่อ revealed: true", () => {
    const { right } = completeIonicCards(level);
    const precipitateCard = right.find(
      (card) => card.term.kind === "compound" && card.term.compound.phase === "s",
    );
    if (!precipitateCard) throw new Error("ด่าน 01 ต้องมีตะกอนอยู่ฝั่งขวา");

    expect(equationCardView(precipitateCard, { revealed: false }).tone).toBe("neutral");
    expect(equationCardView(precipitateCard, { revealed: true }).tone).toBe("gold");
  });
});
