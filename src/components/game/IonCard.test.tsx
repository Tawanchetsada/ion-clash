import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getLevel } from "../../data/levels";
import { reactantIonCards } from "../../domain/game/instances";
import { ionCardView } from "../../presentation/cards";
import { IonCard } from "./IonCard";

const level = getLevel(1);
const [silverCard] = reactantIonCards(level);
if (!silverCard) throw new Error("fixture ผิด");
const view = ionCardView(silverCard);

describe("IonCard", () => {
  it("เป็นปุ่มจริง มีชื่อ accessible จากป้ายเสียงไทย", () => {
    render(<IonCard view={view} />);
    expect(screen.getByRole("button", { name: view.ariaLabel })).toBeInTheDocument();
  });

  it("กดแล้วเรียก onSelect", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<IonCard view={view} onSelect={onSelect} />);
    await user.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("disabled แล้วกดไม่ได้", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<IonCard view={view} disabled onSelect={onSelect} />);
    await user.click(screen.getByRole("button"));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
