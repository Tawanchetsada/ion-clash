import { expect, test } from "@playwright/test";
import { gotoPlay } from "./helpers";

const ROUTES = [
  "/",
  "/levels",
  "/level/1/intro",
  "/level/1/play",
  "/knowledge",
  "/how-to-play",
  "/progress",
  "/settings",
  "/research",
];

const VIEWPORTS = [
  { name: "iPad (1024x768)", width: 1024, height: 768 },
  { name: "Desktop (1280x720)", width: 1280, height: 720 },
  { name: "Mobile iPhone (390x844)", width: 390, height: 844 },
];

test.describe("Phase 10: Viewports & Responsiveness (e2e/viewports.spec.ts)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  for (const vp of VIEWPORTS) {
    test(`Scenario 13: ตรวจสอบ ${vp.name} ไม่มี horizontal scroll ระดับหน้าในทุก route [AC-12]`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of ROUTES) {
        await page.goto(route);
        await page.waitForLoadState("domcontentloaded");

        // ตรวจสอบว่าไม่มี horizontal overflow ระดับหน้า (document)
        const isOverflowing = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        expect(
          isOverflowing,
          `Route ${route} เกิด horizontal scroll ที่ขนาดจอ ${vp.name}`,
        ).toBe(false);
      }
    });
  }

  /*
   * แถวเล่นเกมต้องกว้าง "พอดี" ไม่ใช่แค่ไม่ดันหน้าให้เลื่อน
   *
   * เดิมแถวขั้นที่ 2 และแถบสมการขั้นที่ 4 ใช้การ์ดขนาดตายตัวแล้วให้กล่องตัวเอง
   * เลื่อนแนวนอน หน้าจึงไม่ล้น (ผ่าน AC-12) แต่ผู้เล่นเห็นสมการทีละครึ่ง ซึ่ง
   * ทำลายจุดประสงค์ของการจัดเป็นแถวเดียว เทสต์นี้จึงตรวจสิ่งที่ AC-12 ไม่ได้ตรวจ:
   * `scrollWidth` ของกล่องต้องเท่ากับ `clientWidth` จริง ๆ ที่ขนาดจอ iPad ขึ้นไป
   */
  for (const vp of VIEWPORTS.filter((v) => v.width >= 768)) {
    test(`แถวไอออนขั้นที่ 2 และแถบสมการขั้นที่ 4 กว้างพอดีไม่ต้องเลื่อนที่ ${vp.name}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoPlay(page, "/level/1/play");

      await page.getByRole("button", { name: /เริ่มแยกไอออน/ }).click();
      await page.getByRole("button", { name: /ไปยังขั้นจัดเรียงไอออน/ }).click();

      const row = page.getByRole("region", { name: "แถวจับคู่ไอออนเป็นผลิตภัณฑ์" });
      await expect(row).toBeVisible();
      const rowFits = await row.evaluate(
        (el) => el.scrollWidth <= el.clientWidth + 1,
      );
      expect(rowFits, `แถวขั้นที่ 2 ยังต้องเลื่อนแนวนอนที่ ${vp.name}`).toBe(true);

      // เดินต่อไปขั้นที่ 4 เพื่อตรวจแถบสมการไอออนิกฉบับเต็ม
      for (const [ion, slot] of [
        ["ซิลเวอร์", "ช่องที่ 1"],
        ["คลอไรด์", "ช่องที่ 2"],
        ["โซเดียม", "ช่องที่ 3"],
        ["ไนเตรต", "ช่องที่ 4"],
      ] as const) {
        await page.getByRole("button", { name: new RegExp(ion) }).first().click();
        await page.getByRole("button", { name: new RegExp(slot) }).first().click();
      }
      await page.getByRole("button", { name: "ตรวจการจัดเรียงไอออน" }).click();
      await page.getByRole("button", { name: /ไปขั้นตัดไอออนผู้ชม/ }).click();

      const strip = page.getByRole("region", { name: "สมการไอออนิก" });
      await expect(strip).toBeVisible();
      const stripFits = await strip.evaluate(
        (el) => el.scrollWidth <= el.clientWidth + 1,
      );
      expect(stripFits, `แถบสมการขั้นที่ 4 ยังต้องเลื่อนแนวนอนที่ ${vp.name}`).toBe(true);
    });
  }
});
