import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Dialog } from "./Dialog";

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>เปิด dialog</button>
      <Dialog open={open} titleTh="ยืนยันการออก" onClose={() => setOpen(false)}>
        <button>ปุ่มในกล่อง</button>
      </Dialog>
    </>
  );
}

/**
 * เหมือน Harness แต่มี state อื่นที่ไม่เกี่ยวกับ dialog เลย (เช่นตัวนับ)
 * เพื่อจำลองหน้าเกมจริงที่มี state หลายก้อนอยู่ใน parent เดียวกัน (นาฬิกา,
 * autosave, การ์ดที่เลือก ฯลฯ) — และ onClose เป็น inline arrow function
 * ที่เปลี่ยน identity ทุก re-render ตามธรรมชาติ
 */
function HarnessWithUnrelatedState() {
  const [open, setOpen] = useState(false);
  const [counter, setCounter] = useState(0);
  return (
    <>
      <button onClick={() => setOpen(true)}>เปิด dialog</button>
      <button onClick={() => setCounter((c) => c + 1)}>ตัวนับที่ไม่เกี่ยวกับ dialog: {counter}</button>
      <Dialog open={open} titleTh="ยืนยันการออก" onClose={() => setOpen(false)}>
        <button>ปุ่มในกล่อง</button>
      </Dialog>
    </>
  );
}

describe("Dialog", () => {
  it("ไม่ render อะไรเลยเมื่อ open เป็น false", () => {
    render(<Dialog open={false} titleTh="หัวข้อ" onClose={() => {}}>{null}</Dialog>);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("มีชื่อ accessible จาก titleTh และ focus ย้ายเข้าไปในกล่องตอนเปิด", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "เปิด dialog" }));

    const dialog = screen.getByRole("dialog", { name: "ยืนยันการออก" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ปุ่มในกล่อง" })).toHaveFocus();
  });

  it("ปิดด้วย Escape และคืน focus ไปปุ่มที่เปิดมันขึ้นมา", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const openButton = screen.getByRole("button", { name: "เปิด dialog" });
    await user.click(openButton);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(openButton).toHaveFocus();
  });

  it("re-render ของ parent จาก state อื่นระหว่างเปิดอยู่ ไม่ทำให้คืน focus ผิดที่", async () => {
    // บั๊กจริงที่เจอตอนทดสอบในเบราว์เซอร์: onClose เป็น inline arrow function
    // ทำให้ effect เดิมที่ผูกกับ [open, onClose] restart ทุกครั้งที่ parent
    // re-render ไม่ว่าจะด้วยเหตุผลอะไร แล้วเขียนทับ previouslyFocused ด้วย
    // document.activeElement ปัจจุบัน (ปุ่มในกล่องเอง) ทำให้ปิดแล้ว focus
    // ค้างอยู่ผิดที่แทนที่จะกลับไปปุ่มที่เปิดมันขึ้นมา
    const user = userEvent.setup();
    render(<HarnessWithUnrelatedState />);

    const openButton = screen.getByRole("button", { name: "เปิด dialog" });
    const unrelatedButton = screen.getByRole("button", {
      name: /ตัวนับที่ไม่เกี่ยวกับ dialog/,
    });

    await user.click(openButton);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // เกิด re-render ของ parent ระหว่าง dialog เปิดอยู่ โดยไม่แตะ dialog เลย
    await user.click(unrelatedButton);
    await user.click(unrelatedButton);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(openButton).toHaveFocus();
  });
});
