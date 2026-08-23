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
    const card = screen.getByRole("group", { name: view.ariaLabel });
    expect(card.className).not.toContain("bg-gold");
  });

  it("revealed: true และเป็นตะกอน จึงมีคลาสสีทอง", () => {
    const view = compoundCardView(level.precipitate, { revealed: true });
    render(<CompoundCard view={view} />);
    const card = screen.getByRole("group", { name: view.ariaLabel });
    expect(card.className).toContain("bg-gold");
  });
});
