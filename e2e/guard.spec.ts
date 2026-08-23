import { expect, test } from "@playwright/test";

test.describe("Phase 10: Route Guard E2E Scenarios (e2e/guard.spec.ts)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("Scenario 10: เปิด URL ด่านที่ล็อกอยู่ (/level/25/intro และ /level/25/play) แล้วถูก Redirect ไป /levels พร้อมข้อความเตือน [AC-03]", async ({
    page,
  }) => {
    // 10.1 ลองเข้า /level/25/intro โดยตรง
    await page.goto("/level/25/intro");
    await expect(page).toHaveURL("/levels");
    await expect(page.getByText(/ผ่านด่าน 24 ก่อนเพื่อปลดล็อกด่านนี้/)).toBeVisible();

    // 10.2 ลองเข้า /level/25/play โดยตรง
    await page.goto("/level/25/play");
    await expect(page).toHaveURL("/levels");
    await expect(page.getByText(/ผ่านด่าน 24 ก่อนเพื่อปลดล็อกด่านนี้/)).toBeVisible();

    // 10.3 ปลดล็อกด่าน 1-5 แล้วลองเข้าด่าน 6 -> ต้องถูก redirect
    await page.addInitScript(() => {
      const save = {
        version: 1,
        schemaVersion: 1,
        playerName: "GuardUser",
        unlockedLevel: 5,
        researchConsent: true,
        highScores: {},
        stars: {},
        attempts: {},
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("ion-clash:save:v1", JSON.stringify(save));
    });

    await page.goto("/level/6/intro");
    await expect(page).toHaveURL("/levels");
    await expect(page.getByText(/ผ่านด่าน 5 ก่อนเพื่อปลดล็อกด่านนี้/)).toBeVisible();

    // 10.4 เข้าด่าน 5 (ด่านที่ปลดล็อกแล้ว) -> ต้องเข้าได้ปกติ
    await page.goto("/level/5/intro");
    await expect(page).toHaveURL("/level/5/intro");
  });
});
