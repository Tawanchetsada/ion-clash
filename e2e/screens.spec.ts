import { expect, test } from "@playwright/test";
import { dismissRotatePrompt } from "./helpers";

test.describe("Phase 7: Screens and Level Progression E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("1. เล่นด่าน 1 จนจบครบทั้ง 5 ขั้นตอน", async ({ page }) => {
    await page.goto("/");

    // 1.1 หน้าแรก: กดเริ่มเกม กรอกชื่อผู้เรียน
    const startBtn = page.getByRole("button", { name: "เริ่มเกม" });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Dialog กรอกชื่อ
    const nameInput = page.getByLabel("ชื่อหรือรหัสผู้เรียน:");
    await expect(nameInput).toBeVisible();
    await nameInput.fill("StudentE2E");
    await page.getByRole("button", { name: "เข้าสู่เกม" }).click();

    // 1.2 เข้าสู่หน้า /levels
    await expect(page).toHaveURL("/levels");
    await expect(page.getByRole("heading", { name: "เลือกด่าน" })).toBeVisible();

    // กดเลือกด่าน 01
    const level1Btn = page.getByRole("button", { name: /^ด่าน 01/ });
    await expect(level1Btn).toBeVisible();
    await level1Btn.click();

    // 1.3 หน้า Level Intro
    await expect(page).toHaveURL("/level/1/intro");
    await expect(
      page.getByRole("heading", { name: "ปฏิกิริยาระหว่างสารละลายอิเล็กโทรไลต์" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();

    // 1.4 หน้า Play - ขั้นที่ 1
    await expect(page).toHaveURL("/level/1/play");
    await dismissRotatePrompt(page);
    await expect(
      page.getByRole("heading", { name: /ขั้นที่ 1/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน" }).click();

    // 1.5 ขั้นที่ 2: วางไอออน 4 ช่อง
    await expect(
      page.getByRole("heading", { name: /ขั้นที่ 2/ }),
    ).toBeVisible();

    const tray = page.locator('[data-drop-target="tray"]');
    const slot0 = page.locator('[data-slot-id="L1:slot:0"]');
    const slot1 = page.locator('[data-slot-id="L1:slot:1"]');
    const slot2 = page.locator('[data-slot-id="L1:slot:2"]');
    const slot3 = page.locator('[data-slot-id="L1:slot:3"]');

    // Ag+ -> slot0
    const agCard = tray.getByRole("button", { name: /ซิลเวอร์/ });
    await agCard.click();
    await slot0.click();

    // Cl- -> slot1
    const clCard = tray.getByRole("button", { name: /คลอไรด์/ });
    await clCard.click();
    await slot1.click();

    // Na+ -> slot2
    const naCard = tray.getByRole("button", { name: /โซเดียม/ });
    await naCard.click();
    await slot2.click();

    // NO3- -> slot3
    const no3Card = tray.getByRole("button", { name: /ไนเตรต/ });
    await no3Card.click();
    await slot3.click();

    // ตรวจการจัดเรียง
    await page.getByRole("button", { name: "ตรวจการจัดเรียงไอออน" }).click();

    // 1.6 ขั้นที่ 3: ยืนยันผลิตภัณฑ์และสถานะ (Gold Card ปรากฏ)
    await expect(
      page.getByRole("heading", { name: /ขั้นที่ 3/ }),
    ).toBeVisible();
    await expect(page.getByText("ผลิตภัณฑ์ที่เป็นตะกอน")).toBeVisible();
    await page.getByRole("button", { name: "ไปขั้นตัดไอออนตัวประกอบ" }).click();

    // 1.7 ขั้นที่ 4: ตัดไอออนตัวประกอบ (Na+ และ NO3-)
    await expect(
      page.getByRole("heading", { name: /ขั้นที่ 4/ }),
    ).toBeVisible();

    const strip = page.getByRole("region", { name: "สมการไอออนิก" });
    const naButtons = strip.getByRole("button", { name: /โซเดียม/ });
    await naButtons.nth(0).click();
    await naButtons.nth(1).click();

    const no3Buttons = strip.getByRole("button", { name: /ไนเตรต/ });
    await no3Buttons.nth(0).click();
    await no3Buttons.nth(1).click();

    const confirmBtn = page.getByRole("button", { name: "ยืนยันการตัดไอออน" });
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // 1.8 ขั้นที่ 5: ดูสมการไอออนิกสุทธิและจบด่าน
    await expect(
      page.getByRole("heading", { name: /ขั้นที่ 5/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "ดูผลคะแนนและจบด่าน" }).click();

    // ผ่านด่านสำเร็จ
    await expect(page.getByText("ผ่านด่านสำเร็จ")).toBeVisible();
    await expect(page.getByRole("button", { name: "เล่นด่าน 2 ต่อ" })).toBeVisible();
  });

  test("2. Route Guard ป้องกันด่านที่ล็อกอยู่และ Redirect กลับ /levels", async ({ page }) => {
    await page.goto("/level/25/intro");
    await expect(page).toHaveURL("/levels");
    // Toast แจ้งเตือน
    await expect(page.getByText(/ผ่านด่าน 24 ก่อนเพื่อปลดล็อกด่านนี้/)).toBeVisible();
  });

  test("3. Responsive Viewports ไม่ล้นแนวนอน (1024x768, 1280x720, 390x844)", async ({ page }) => {
    const viewports = [
      { width: 1024, height: 768 },
      { width: 1280, height: 720 },
      { width: 390, height: 844 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto("/levels");

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(isOverflowing).toBe(false);
    }
  });
});
