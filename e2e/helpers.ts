import type { Page } from "@playwright/test";

/** ตรงกับ media query ของ RotatePrompt — มือถือแนวตั้งเท่านั้น */
function isPortraitPhone(page: Page): boolean {
  const size = page.viewportSize();
  if (!size) return false;
  return size.width <= 767 && size.height > size.width;
}

/**
 * ปิดคำชวนหมุนจอ
 *
 * `RotatePrompt` ขึ้นเฉพาะ project `mobile` (390×844 แนวตั้ง) และคลุมทั้งจอ
 * เพื่อชวนให้นักเรียนหมุนเครื่องก่อนเล่น เทสต์จึงต้องกดข้ามให้เหมือนผู้ใช้ที่
 * เลือกเล่นแนวตั้ง — ถ้าไม่กด การคลิกทุกอย่างในหน้าเล่นเกมจะถูกมันบังไว้
 *
 * เช็กขนาด viewport ก่อนแทนการใช้ `isVisible()` เพราะ `isVisible()` อ่านค่า
 * ณ วินาทีนั้น ถ้า React ยัง hydrate ไม่เสร็จจะได้ false แล้วข้ามไปเฉย ๆ
 * กลายเป็นเทสต์ที่แดงแบบสุ่ม ส่วนการเช็ก viewport ให้ผลเดิมทุกครั้ง
 */
export async function dismissRotatePrompt(page: Page): Promise<void> {
  if (!isPortraitPhone(page)) return;
  // คำชวนหมุนจอขึ้นเฉพาะหน้าเล่นเกม — หน้าอื่นไม่ต้องรอให้เสียเวลาเปล่า
  if (!page.url().includes("/play")) return;
  await page
    .getByRole("button", { name: "เล่นแนวตั้งต่อไป" })
    .click({ timeout: 10_000 })
    .catch(() => {
      // ไม่ขึ้นก็ไม่เป็นไร — route guard อาจพาออกจากหน้าเล่นเกมไปก่อนแล้ว
    });
}

/** เปิดหน้าเล่นเกมแล้วปิดคำชวนหมุนจอให้เรียบร้อยก่อนเริ่มทดสอบ */
export async function gotoPlay(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await dismissRotatePrompt(page);
}
