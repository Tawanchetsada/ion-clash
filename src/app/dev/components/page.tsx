import { notFound } from "next/navigation";
import { ComponentGallery } from "./ComponentGallery";

/**
 * หน้ารวม component สำหรับตรวจงานระหว่างพัฒนา — Phase 5
 * ปิดใน production ด้วย notFound() เพื่อไม่ให้หลุดไปอยู่หน้านักเรียนวันทดลอง
 */
export default function DevComponentsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <ComponentGallery />;
}
