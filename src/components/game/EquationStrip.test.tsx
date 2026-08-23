import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getLevel } from "../../data/levels";
import { completeIonicCards } from "../../domain/game/instances";
import { equationCardView } from "../../presentation/cards";
import { EquationStrip } from "./EquationStrip";
import type { EquationCard } from "../../domain/game/instances";
import type { EquationStripCard } from "./EquationStrip";

const level = getLevel(1); // AgNO3 + NaCl -> AgCl(s) + Na+(aq) + NO3-(aq)
const { left, right } = completeIonicCards(level);

function toStripCards(
  cards: readonly EquationCard[],
  revealed: boolean,
): EquationStripCard[] {
  return cards.map((card) => ({ view: equationCardView(card, { revealed }) }));
}

describe("EquationStrip", () => {
  it("แสดงทุกการ์ดทั้งสองฝั่งเป็น region ที่เลื่อนได้", () => {
    render(<EquationStrip left={toStripCards(left, true)} right={toStripCards(right, true)} />);
    const region = screen.getByRole("region", { name: "สมการไอออนิก" });
    expect(region).toHaveAttribute("tabindex", "0");
    // min-w-0 จำเป็นจริง — component นี้เป็น flex item ของ Section เสมอ ถ้าไม่มี
    // min-width:0 มันจะขอความกว้างเท่ากับผลรวมการ์ดทั้งหมด (min-content) แล้วดัน
    // ทั้งหน้าให้เลื่อนแนวนอน แทนที่จะหดแล้วเลื่อนในตัวเองตาม overflow-x:auto
    expect(region).toHaveClass("min-w-0");
    // นับการ์ดที่มี aria-label ของตัวเองครบตามจำนวนพจน์ทั้งสองฝั่ง — บางพจน์
    // (เช่น Na+ ปรากฏทั้งสองข้างของด่านนี้) จึงใช้นับจำนวน ไม่ใช่หาแบบไม่ซ้ำ
    // querySelectorAll จาก region เอง (ไม่ใช่ container) จึงไม่นับ aria-label
    // ของ region เข้าไปด้วย
    expect(region.querySelectorAll(".shadow-card[aria-label]")).toHaveLength(
      left.length + right.length,
    );
  });

  it("การ์ดที่ struck มีคำว่า 'ถูกตัดออกแล้ว' ต่อท้ายป้ายเสียง", () => {
    const spectator = left[0];
    if (!spectator) throw new Error("fixture ผิด");
    const view = equationCardView(spectator, { revealed: true });
    const cards: EquationStripCard[] = [{ view, struck: true }];
    render(<EquationStrip left={cards} right={[]} />);
    expect(screen.getByLabelText(`${view.ariaLabel} ถูกตัดออกแล้ว`)).toBeInTheDocument();
  });

  it("การ์ดที่มี onSelect เป็นปุ่มกดได้", async () => {
    const onSelect = vi.fn();
    const spectator = left[0];
    if (!spectator) throw new Error("fixture ผิด");
    const view = equationCardView(spectator, { revealed: true });
    const user = userEvent.setup();
    render(<EquationStrip left={[{ view, onSelect }]} right={[]} />);
    await user.click(screen.getByRole("button", { name: view.ariaLabel }));
    expect(onSelect).toHaveBeenCalledOnce();
  });
});
