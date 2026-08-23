import { notFound } from "next/navigation";
import { InteractionHarness } from "./InteractionHarness";

/**
 * สนามซ้อมระบบ Interaction สำหรับทดสอบบน iPad และคอมพิวเตอร์จริง — Phase 6
 * ปิดใน production ด้วย notFound() เพื่อความปลอดภัยตามข้อกำหนด
 */
export default function DevInteractionPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <InteractionHarness />;
}
