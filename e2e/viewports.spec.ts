import { expect, test } from "@playwright/test";

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
});
