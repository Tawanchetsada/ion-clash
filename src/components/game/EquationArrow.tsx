export type EquationArrowProps = {
  /** true = หมุนลงเมื่อจอแคบ (ค่าเริ่มต้น) · false = ชี้ขวาเสมอ */
  responsive?: boolean;
  /**
   * จุดที่ลูกศรกลับมาชี้ขวา — ต้องตรงกับจุดที่แถวนั้นเลิกพับเป็นสองชั้นพอดี
   * ไม่อย่างนั้นจะมีช่วงความกว้างที่ลูกศรชี้ผิดทางอยู่ดี
   */
  breakpoint?: "sm" | "md";
  className?: string;
};

/** ต้องเป็นสตริงเต็มตัว Tailwind จึงจะกวาดเจอตอน build */
const ROTATE_CLASS = {
  sm: "rotate-90 sm:rotate-0",
  md: "rotate-90 md:rotate-0",
} as const;

/**
 * ลูกศร "ให้ผลเป็น" ของสมการเคมี
 *
 * **บนจอแคบต้องชี้ลง ไม่ใช่ชี้ขวา** เพราะสองฝั่งของสมการวางซ้อนกันเป็นแถวบน–ล่าง
 * ลูกศรที่ยังชี้ขวาจะชี้ไปที่ขอบจอว่าง ๆ แล้วผู้อ่านต้องเดาเองว่าอะไรต่อจากอะไร
 *
 * เป็น SVG ไม่ใช่ตัวอักษร "→" เพราะต้องหมุนตามขนาดจอ และเพื่อให้ความหนาเส้น
 * คงที่ไม่ขึ้นกับฟอนต์ที่ระบบเลือกมาเรนเดอร์
 */
export function EquationArrow({
  responsive = true,
  breakpoint = "sm",
  className = "",
}: EquationArrowProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={`h-6 w-6 shrink-0 text-navy ${
        responsive ? ROTATE_CLASS[breakpoint] : ""
      } ${className}`}
    >
      <path
        d="M3 12h16m0 0-5.5-5.5M19 12l-5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
