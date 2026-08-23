import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getLevel } from "../../data/levels";
import { formulaToPlainText } from "../../domain/chemistry/formula";
import { EquationView } from "./EquationView";

const level = getLevel(11); // BaCl2 + Na2SO4 -> ใช้ subscript จริง (BaSO4)

describe("EquationView", () => {
  it("render sub/sup จริงจาก AST ไม่ parse หรือฉีด HTML ดิบ", () => {
    const { container } = render(
      <EquationView ast={level.precipitate.formula} ariaLabel="แบเรียมซัลเฟต สถานะของแข็ง" />,
    );
    expect(container.querySelector("sub")).not.toBeNull();
    expect(formulaToPlainText(level.precipitate.formula)).toContain(
      container.querySelector("sub")?.textContent ?? "",
    );
  });

  it("มี aria-label ภาษาไทยเมื่อยืนเดี่ยว", () => {
    render(<EquationView ast={level.precipitate.formula} ariaLabel="แบเรียมซัลเฟต สถานะของแข็ง" />);
    expect(screen.getByLabelText("แบเรียมซัลเฟต สถานะของแข็ง")).toBeInTheDocument();
  });

  it("ไม่มี aria-label ของตัวเองเมื่อถูกครอบด้วย element ที่มีป้ายอยู่แล้ว", () => {
    const { container } = render(<EquationView ast={level.precipitate.formula} />);
    expect(container.querySelector("[aria-label]")).toBeNull();
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });
});
