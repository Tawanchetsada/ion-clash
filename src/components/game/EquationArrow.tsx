export type EquationArrowProps = {
  /** true = หมุนลงเมื่อจอแคบ (ค่าเริ่มต้น) · false = ชี้ขวาเสมอ */
  responsive?: boolean;
  className?: string;
};

/**
 * ลูกศร "ให้ผลเป็น" ของสมการเคมี
 *
 * **บนจอแคบต้องชี้ลง ไม่ใช่ชี้ขวา** เพราะสองฝั่งของสมการวางซ้อนกันเป็นแถวบน–ล่าง
 * ลูกศรที่ยังชี้ขวาจะชี้ไปที่ขอบจอว่าง ๆ แล้วผู้อ่านต้องเดาเองว่าอะไรต่อจากอะไร
 *
 * เป็น SVG ไม่ใช่ตัวอักษร "→" เพราะต้องหมุนตามขนาดจอ และเพื่อให้ความหนาเส้น
 * คงที่ไม่ขึ้นกับฟอนต์ที่ระบบเลือกมาเรนเดอร์
 */
export function EquationArrow({ responsive = true, className = "" }: EquationArrowProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={`h-6 w-6 shrink-0 text-navy ${responsive ? "rotate-90 sm:rotate-0" : ""} ${className}`}
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
