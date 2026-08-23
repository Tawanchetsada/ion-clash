import type { ReactNode } from "react";

export type PageShellProps = {
  children: ReactNode;
  variant?: "canvas" | "navy";
};

/**
 * โครงพื้นหลังของหน้าเกม — พื้น canvas หรือ navy พร้อม safe-area ด้านล่าง
 *
 * เป็น `<div>` ไม่ใช่ `<main>` โดยตั้งใจ เพราะทุกหน้าวาง `<AppHeader>` ไว้ข้างใน
 * แล้วตามด้วย `<main>` ของตัวเอง ถ้า PageShell เป็น main ด้วยจะได้ landmark
 * ซ้อนกันสองชั้นและมี main มากกว่าหนึ่งอันในหน้าเดียว ซึ่งผิดทั้ง HTML และ
 * ทำให้ผู้ใช้ screen reader กระโดดไปเนื้อหาหลักไม่ได้
 *
 * `min-w-0` จำเป็นจริง ๆ — `<body>` ใน layout.tsx เป็น `flex flex-col` เสมอ
 * ทำให้ PageShell เป็น flex item ของมันโดยอัตโนมัติทุกหน้า ถ้าไม่กำหนด
 * min-width ไว้ Chromium จะให้ PageShell ขอความกว้างเท่ากับ min-content ของ
 * ลูกหลานที่กว้างที่สุด (เช่นแถบสมการที่ตั้งใจให้เลื่อนในตัวเองด้วย
 * overflow-x:auto) แทนที่จะยอมหดลงมาให้พอดี viewport แล้วให้แถบนั้นเลื่อนเอง
 * ผลคือทั้งหน้าเลื่อนแนวนอน ซึ่งข้อ 5.5 ห้ามไว้ตรง ๆ — เจอบั๊กนี้จริงตอนทดสอบ
 * หน้าคลัง component ที่ 390px แล้วไล่จนเจอว่าต้นตอคือจุดนี้
 *
 * ใส่ `w-full` เพิ่มจาก `min-w-0` เพราะทดสอบแล้วพบว่า `align-items: stretch`
 * ของ body (ค่าเริ่มต้น) ไม่ทำให้ความกว้างยืดเต็ม cross-axis จริงในเบราว์เซอร์
 * ที่ทดสอบ แม้ min-width จะเป็น 0 แล้วก็ตาม — ระบุความกว้างตรง ๆ ปลอดภัยกว่า
 * การพึ่งพฤติกรรม stretch โดยนัย
 */
export function PageShell({ children, variant = "canvas" }: PageShellProps) {
  const background = variant === "navy" ? "bg-navy text-white" : "bg-canvas text-navy";

  return (
    <div
      data-page-shell="true"
      className={`flex w-full min-w-0 flex-1 flex-col ${background}`}
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {children}
    </div>
  );
}
