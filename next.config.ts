import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * อนุญาตให้เปิด dev server ผ่าน tunnel (ngrok) เพื่อทดสอบบน iPad/มือถือเครื่องจริง
   *
   * `next dev` ตรวจ Host ของทุก request ที่ขอไฟล์ภายใน (HMR, /_next/*) ถ้ามาจาก
   * origin ที่ไม่รู้จักจะบล็อกทิ้ง อาการคือหน้าแรกโหลดได้แต่ CSS/JS ไม่มา หรือ
   * hot reload เงียบไปเฉย ๆ ซึ่งหาสาเหตุยากมากเวลาทดสอบอยู่บนเครื่องอื่น
   *
   * ใช้เฉพาะตอน dev เท่านั้น — `next build`/production ไม่อ่านค่านี้
   * ใส่เป็น wildcard เพราะ ngrok รุ่นฟรีเปลี่ยน subdomain ทุกครั้งที่เปิดใหม่
   */
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.app", "*.ngrok.io"],
};

export default nextConfig;
