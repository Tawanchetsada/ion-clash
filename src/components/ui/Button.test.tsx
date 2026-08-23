import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("เป็น <button> จริง ไม่ใช่ div", () => {
    render(<Button>กด</Button>);
    expect(screen.getByRole("button", { name: "กด" }).tagName).toBe("BUTTON");
  });

  it("type เริ่มต้นเป็น button ป้องกัน submit ฟอร์มโดยไม่ตั้งใจ", () => {
    render(<Button>กด</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("เรียก onClick เมื่อกด", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>กด</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("disabled แล้วกดไม่ได้", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button disabled onClick={onClick}>
        กด
      </Button>,
    );
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
