import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LiveGameStats } from "./LiveGameStats";

describe("LiveGameStats", () => {
  it("render คะแนนและเวลาที่ส่งมาทาง props ได้ถูกต้อง", () => {
    render(<LiveGameStats score={95} elapsedSec={85} />);
    expect(screen.getByText("95")).toBeInTheDocument();
    expect(screen.getByText("01:25")).toBeInTheDocument();
  });

  it("เปลี่ยนสไตล์ตามช่วงคะแนน", () => {
    const { rerender } = render(<LiveGameStats score={100} elapsedSec={10} />);
    expect(screen.getByText("100")).toBeInTheDocument();

    rerender(<LiveGameStats score={65} elapsedSec={10} />);
    expect(screen.getByText("65")).toBeInTheDocument();
  });
});
