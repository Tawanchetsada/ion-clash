import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getLevel } from "../../data/levels";
import { compoundCardView } from "../../presentation/cards";
import { CompoundCard } from "./CompoundCard";

const level = getLevel(1);

describe("CompoundCard", () => {
  it("revealed: false ไม่มีคลาสสีทองแม้เป็นตะกอนจริง", () => {
    const view = compoundCardView(level.precipitate, { revealed: false });
    render(<CompoundCard view={view} />);
    // สีอยู่ที่หน้าการ์ด (GameCardFace) ซึ่งเป็นลูกของ group ที่ถือ aria-label
    const card = screen.getByRole("group", { name: view.ariaLabel });
    expect(card.innerHTML).not.toContain("bg-gold");
  });

  it("revealed: true และเป็นตะกอน จึงมีคลาสสีทอง", () => {
    const view = compoundCardView(level.precipitate, { revealed: true });
    render(<CompoundCard view={view} />);
    const card = screen.getByRole("group", { name: view.ariaLabel });
    expect(card.innerHTML).toContain("bg-gold");
  });

  it("แสดงชื่อไทยและป้ายสถานะบนหน้าการ์ด ตามเอกสาร UI หน้า 09", () => {
    const view = compoundCardView(level.precipitate, { revealed: true });
    render(<CompoundCard view={view} />);
    expect(screen.getByText(view.nameTh)).toBeInTheDocument();
    expect(screen.getByText(`(${view.phaseTh})`)).toBeInTheDocument();
  });
});
