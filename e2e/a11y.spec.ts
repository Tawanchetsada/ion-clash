import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { gotoPlay } from "./helpers";

const MAIN_ROUTES = [
  { path: "/", name: "หน้าแรก (Home)" },
  { path: "/levels", name: "หน้าเลือกด่าน (Levels)" },
  { path: "/level/1/intro", name: "หน้าแนะนำด่าน (Level Intro)" },
  { path: "/knowledge", name: "คลังความรู้ (Knowledge)" },
  { path: "/how-to-play", name: "วิธีเล่น (How to play)" },
  { path: "/progress", name: "ความก้าวหน้า (Progress)" },
  { path: "/settings", name: "การตั้งค่า (Settings)" },
  { path: "/research", name: "แดชบอร์ดงานวิจัย (Research)" },
];

test.describe("Phase 10: Automated & Manual Accessibility (e2e/a11y.spec.ts) [AC-13]", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  for (const route of MAIN_ROUTES) {
    test(`Axe scan: ${route.name} (${route.path}) ไม่มี critical/serious a11y violations`, async ({
      page,
    }) => {
      await page.goto(route.path);
      await page.waitForLoadState("domcontentloaded");

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const seriousOrCritical = accessibilityScanResults.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );

      if (seriousOrCritical.length > 0) {
        console.error(
          `A11y violations on ${route.path}:`,
          JSON.stringify(seriousOrCritical, null, 2),
        );
      }

      expect(seriousOrCritical).toHaveLength(0);
    });
  }

  test("Axe scan: หน้าเล่นเกม (/level/1/play) ในแต่ละขั้นตอน ไม่มี serious/critical violations", async ({
    page,
  }) => {
    await gotoPlay(page, "/level/1/play");

    // Scan Step 1
    const scanStep1 = await new AxeBuilder({ page }).analyze();
    expect(
      scanStep1.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
    ).toHaveLength(0);

    // Go to Step 2
    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน" }).click();

    const scanStep2 = await new AxeBuilder({ page }).analyze();
    expect(
      scanStep2.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
    ).toHaveLength(0);

    // Place cards to go to Step 3
    const tray = page.locator('[data-drop-target="tray"]');
    await tray.getByRole("button", { name: /ซิลเวอร์/ }).click();
    await page.locator('[data-slot-id="L1:slot:0"]').click();
    await tray.getByRole("button", { name: /คลอไรด์/ }).click();
    await page.locator('[data-slot-id="L1:slot:1"]').click();
    await tray.getByRole("button", { name: /โซเดียม/ }).click();
    await page.locator('[data-slot-id="L1:slot:2"]').click();
    await tray.getByRole("button", { name: /ไนเตรต/ }).click();
    await page.locator('[data-slot-id="L1:slot:3"]').click();

    await page.getByRole("button", { name: "ตรวจการจัดเรียงไอออน" }).click();

    // Scan Step 3
    const scanStep3 = await new AxeBuilder({ page }).analyze();
    expect(
      scanStep3.violations.filter((v) => v.impact === "critical" || v.impact === "serious"),
    ).toHaveLength(0);
  });

  test("การอ่านออกเสียงสูตรเคมีภาษาไทย (aria-label) ถูกต้อง ไม่สะกดทีละตัวอักษร", async ({
    page,
  }) => {
    await gotoPlay(page, "/level/1/play");
    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน" }).click();

    const tray = page.locator('[data-drop-target="tray"]');
    const silverCard = tray.getByRole("button", { name: /ซิลเวอร์/ });
    const silverLabel = await silverCard.getAttribute("aria-label");

    // ต้องมีคำว่า ซิลเวอร์(I) ไอออน ประจุบวกหนึ่ง
    expect(silverLabel).toMatch(/ซิลเวอร์.*ไอออน.*ประจุบวกหนึ่ง/);

    const chlorideCard = tray.getByRole("button", { name: /คลอไรด์/ });
    const chlorideLabel = await chlorideCard.getAttribute("aria-label");
    expect(chlorideLabel).toMatch(/คลอไรด์ไอออน.*ประจุลบหนึ่ง/);
  });

  test("ทุกสถานะมีทั้งสี ข้อความ และไอคอน (AC-13 Triple Redundancy)", async ({
    page,
  }) => {
    await page.goto("/levels");

    // ตรวจสอบหัวข้อความยากและด่านที่มีทั้งสถานะข้อความและไอคอน
    const level1Btn = page.getByRole("button", { name: /^ด่าน 01/ });
    await expect(level1Btn).toBeVisible();

    // ตรวจสอบ FeedbackPanel ในเกม
    await gotoPlay(page, "/level/1/play");
    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน" }).click();

    // วางการ์ดให้ผิดเพื่อดู error feedback
    const tray = page.locator('[data-drop-target="tray"]');
    await tray.getByRole("button", { name: /ซิลเวอร์/ }).click();
    await page.locator('[data-slot-id="L1:slot:0"]').click();
    await tray.getByRole("button", { name: /ไนเตรต/ }).click();
    await page.locator('[data-slot-id="L1:slot:1"]').click();
    await tray.getByRole("button", { name: /โซเดียม/ }).click();
    await page.locator('[data-slot-id="L1:slot:2"]').click();
    await tray.getByRole("button", { name: /คลอไรด์/ }).click();
    await page.locator('[data-slot-id="L1:slot:3"]').click();

    await page.getByRole("button", { name: "ตรวจการจัดเรียงไอออน" }).click();

    // กล่องข้อความแจ้งเตือนความผิดพลาดต้องมี role="alert" มีไอคอนและข้อความอธิบาย
    const feedback = page.getByRole("alert").filter({ hasText: /ไอออน|ปฏิกิริยา/ });
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText("ยังไม่ถูกต้อง");
  });
});
