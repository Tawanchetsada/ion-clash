import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getLevel } from "../../data/levels";
import { reactantIonCards } from "../../domain/game/instances";
import { ionCardView } from "../../presentation/cards";
import { IonSlot } from "./IonSlot";

const level = getLevel(1);
const [silverCard] = reactantIonCards(level);
if (!silverCard) throw new Error("fixture ผิด");
const view = ionCardView(silverCard);

describe("IonSlot", () => {
  it("ช่องว่างประกาศว่าว่าง และแตะเพื่อวางได้", async () => {
    const onActivate = vi.fn();
    const user = userEvent.setup();
    render(
      <IonSlot slotId="slot-0" slotLabelTh="ช่องที่ 1" assignedIon={null} onActivate={onActivate} />,
    );
    await user.click(screen.getByRole("button", { name: "ช่องที่ 1 ว่าง" }));
    expect(onActivate).toHaveBeenCalledOnce();
  });

  it("มีการ์ดแล้วแสดงการ์ดและปุ่มนำออก", async () => {
    const onRemove = vi.fn();
    const user = userEvent.setup();
    render(
      <IonSlot slotId="slot-0" slotLabelTh="ช่องที่ 1" assignedIon={view} onRemove={onRemove} />,
    );
    expect(screen.getByRole("button", { name: view.ariaLabel })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "นำออกจากช่องที่ 1" }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
