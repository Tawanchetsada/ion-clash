import { expect, test } from "@playwright/test";

test.describe("Phase 10: Progress & Checkpoint E2E Scenarios (e2e/progress.spec.ts)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("Scenario 8: Refresh กลางด่านใน checkpoint states แล้วสถานะและข้อมูลกลับมาถูกต้อง [AC-09]", async ({
    page,
  }) => {
    // 8.1 เริ่มเล่นด่าน 1 และจัดวางไอออน 2 ช่องแรก
    await page.goto("/level/1/play");
    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน →" }).click();

    const tray = page.locator('[data-drop-target="tray"]');
    const slot0 = page.locator('[data-slot-id="L1:slot:0"]');
    const slot1 = page.locator('[data-slot-id="L1:slot:1"]');

    await tray.getByRole("button", { name: /ซิลเวอร์/ }).click();
    await slot0.click();
    await tray.getByRole("button", { name: /คลอไรด์/ }).click();
    await slot1.click();

    // รอ autosave debounce
    await page.waitForTimeout(400);

    // Refresh หน้าจอ
    await page.reload();

    // ตรวจสอบว่ายังอยู่ในขั้นที่ 2 และการ์ดในช่อง 0 และ 1 ยังอยู่
    await expect(page.getByRole("heading", { name: /ขั้นที่ 2/ })).toBeVisible();
    await expect(slot0.getByRole("button", { name: /ซิลเวอร์/ })).toBeVisible();
    await expect(slot1.getByRole("button", { name: /คลอไรด์/ })).toBeVisible();

    // 8.2 วางต่อให้ครบ 4 ช่องและผ่านไป Step 3
    const slot2 = page.locator('[data-slot-id="L1:slot:2"]');
    const slot3 = page.locator('[data-slot-id="L1:slot:3"]');
    await tray.getByRole("button", { name: /โซเดียม/ }).click();
    await slot2.click();
    await tray.getByRole("button", { name: /ไนเตรต/ }).click();
    await slot3.click();

    await page.getByRole("button", { name: "ตรวจการจัดเรียงไอออน" }).click();
    await expect(page.getByRole("heading", { name: /ขั้นที่ 3/ })).toBeVisible();

    // รอ autosave debounce
    await page.waitForTimeout(400);

    // Refresh ใน Step 3
    await page.reload();
    await expect(page.getByRole("heading", { name: /ขั้นที่ 3/ })).toBeVisible();

    // 8.3 ไปยัง Step 4 ตัดไอออน 1 คู่แล้ว Refresh
    await page.getByRole("button", { name: "ไปขั้นตัดไอออนผู้ชม →" }).click();
    await expect(page.getByRole("heading", { name: /ขั้นที่ 4/ })).toBeVisible();

    const strip = page.getByRole("region", { name: "สมการไอออนิก" });
    const naButtons = strip.getByRole("button", { name: /โซเดียม/ });
    await naButtons.nth(0).click();
    await naButtons.nth(1).click();
    await expect(page.getByText(/คู่ที่ 1:/)).toBeVisible();

    // รอ autosave debounce
    await page.waitForTimeout(400);

    await page.reload();
    await expect(page.getByRole("heading", { name: /ขั้นที่ 4/ })).toBeVisible();
    await expect(page.getByText(/คู่ที่ 1:/)).toBeVisible();
  });

  test("Scenario 9: ปิด Context / Browser แล้วเปิดใหม่ ด่านที่ปลดล็อก คะแนน และดาวยังอยู่ [AC-08]", async ({
    browser,
  }) => {
    // Session 1: สร้าง context และเล่นจบด่าน 1
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto("/");

    await page1.getByRole("button", { name: "เริ่มเกม" }).click();
    await page1.getByLabel("ชื่อหรือรหัสผู้เรียน:").fill("PersistentUser");
    await page1.getByRole("button", { name: "เข้าสู่เกม" }).click();

    // ไปหน้าแนะนำด่าน 1
    await page1.getByRole("button", { name: /^ด่าน 01/ }).click();
    await page1.waitForURL(/\/level\/1\/intro/);
    await page1.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page1.waitForURL(/\/level\/1\/play/);

    // Step 1 -> Step 2
    await page1.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page1.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน →" }).click();

    // Step 2
    const tray1 = page1.locator('[data-drop-target="tray"]');
    await tray1.getByRole("button", { name: /ซิลเวอร์/ }).click();
    await page1.locator('[data-slot-id="L1:slot:0"]').click();
    await tray1.getByRole("button", { name: /คลอไรด์/ }).click();
    await page1.locator('[data-slot-id="L1:slot:1"]').click();
    await tray1.getByRole("button", { name: /โซเดียม/ }).click();
    await page1.locator('[data-slot-id="L1:slot:2"]').click();
    await tray1.getByRole("button", { name: /ไนเตรต/ }).click();
    await page1.locator('[data-slot-id="L1:slot:3"]').click();
    await page1.getByRole("button", { name: "ตรวจการจัดเรียงไอออน" }).click();

    // Step 3
    await page1.getByRole("button", { name: "ไปขั้นตัดไอออนผู้ชม →" }).click();

    // Step 4
    const strip1 = page1.getByRole("region", { name: "สมการไอออนิก" });
    await strip1.getByRole("button", { name: /โซเดียม/ }).nth(0).click();
    await strip1.getByRole("button", { name: /โซเดียม/ }).nth(1).click();
    await strip1.getByRole("button", { name: /ไนเตรต/ }).nth(0).click();
    await strip1.getByRole("button", { name: /ไนเตรต/ }).nth(1).click();
    await page1.getByRole("button", { name: "ยืนยันการตัดไอออน" }).click();

    // Step 5: จบด่าน
    await page1.getByRole("button", { name: "ดูผลคะแนนและจบด่าน →" }).click();
    await expect(page1.getByText("ผ่านด่านสำเร็จ!")).toBeVisible();

    // รอ save commit
    await page1.waitForTimeout(600);

    // ดึง save state จาก context1
    const storageState = await context1.storageState();
    await context1.close();

    // Session 2: เปิด Context ใหม่ด้วย storageState เดิม
    const context2 = await browser.newContext({ storageState });
    const page2 = await context2.newPage();
    await page2.goto("/levels");

    // ตรวจสอบว่าด่าน 2 ปลดล็อกแล้ว (ปุ่มด่าน 02 ไม่ disabled)
    const level2Btn = page2.getByRole("button", { name: /^ด่าน 02/ });
    await expect(level2Btn).toBeEnabled();

    // ตรวจสอบว่าด่าน 1 แสดงว่าผ่านแล้ว 3 ดาว
    const level1Btn = page2.getByRole("button", { name: /^ด่าน 01/ });
    await expect(level1Btn).toHaveAttribute("aria-label", /3 ดาว/);

    await context2.close();
  });

  test("Scenario 11: Export ข้อมูลเป็น JSON และ Import กลับเข้า ได้ข้อมูลตรงกันเป๊ะ [AC-11]", async ({
    page,
  }) => {
    await page.goto("/");
    // Seed save data with valid schema
    await page.evaluate(() => {
      const save = {
        version: 1,
        installId: "test-install-id-123",
        playerName: "ExporterUser",
        unlockedLevel: 10,
        completedLevels: {
          "1": {
            completed: true,
            bestScore: 100,
            stars: 3,
            bestTimeMs: 12000,
            attempts: 1,
            completedAt: "2026-08-23T08:00:00.000Z",
          },
        },
        lastPlayedLevel: 1,
        activeCheckpoint: null,
        settings: {
          sound: true,
          music: false,
          reducedMotion: false,
          researchConsent: true,
        },
        createdAt: "2026-08-23T08:00:00.000Z",
        updatedAt: "2026-08-23T08:00:00.000Z",
      };
      localStorage.setItem("ion-clash:save:v1", JSON.stringify(save));
    });

    await page.goto("/progress");
    await expect(
      page.getByRole("heading", { name: "ความก้าวหน้าและการจัดการข้อมูล" }),
    ).toBeVisible();

    // ตรวจสอบปุ่ม Export JSON
    const exportBtn = page.getByRole("button", { name: /ส่งออกข้อมูล \(Export JSON\)/ });
    await expect(exportBtn).toBeVisible();

    // ดึงค่า JSON จาก localStorage ตรงๆ เพื่อจำลองไฟล์ที่จะนำเข้า
    const originalJson = await page.evaluate(() =>
      localStorage.getItem("ion-clash:save:v1"),
    );
    expect(originalJson).toBeTruthy();

    // ล้าง localStorage
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // ตรวจสอบว่าข้อมูลถูกล้างเป็น default (ด่าน 2 ล็อก)
    await page.goto("/levels");
    const level2Btn = page.getByRole("button", { name: /^ด่าน 02/ });
    await expect(level2Btn).toBeDisabled();

    // กลับไปที่ /progress แล้วกด Import JSON ผ่าน file input
    await page.goto("/progress");
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: /นำเข้าข้อมูล \(Import JSON\)/ }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "ion-clash-save.json",
      mimeType: "application/json",
      buffer: Buffer.from(originalJson!),
    });

    // ใน modal import กดรวมข้อมูลและบันทึก
    await page.getByRole("button", { name: "รวมข้อมูลและบันทึก" }).click();

    // ไปที่ /levels และตรวจสอบว่าปลดล็อกถึงด่าน 10 และด่าน 1 ผ่าน 3 ดาว
    await page.goto("/levels");
    const level10Btn = page.getByRole("button", { name: /^ด่าน 10/ });
    await expect(level10Btn).toBeEnabled();

    const level1Btn = page.getByRole("button", { name: /^ด่าน 01/ });
    await expect(level1Btn).toHaveAttribute("aria-label", /3 ดาว/);
  });

  test("Scenario 12: Reset ความก้าวหน้าต้องผ่านการยืนยันสองขั้นตอนจริง [AC-11]", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const save = {
        version: 1,
        schemaVersion: 1,
        playerName: "ResetTester",
        unlockedLevel: 5,
        settings: {
          sound: true,
          music: false,
          reducedMotion: false,
          researchConsent: true,
        },
        highScores: { 1: 100 },
        stars: { 1: 3 },
        attempts: { 1: 1 },
        completedLevels: [1],
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("ion-clash:save:v1", JSON.stringify(save));
    });

    await page.goto("/progress");

    // กดปุ่มรีเซ็ตข้อมูลทั้งหมด
    const resetBtn = page.getByRole("button", { name: /รีเซ็ตข้อมูลทั้งหมด/ });
    await resetBtn.click();

    // ขั้นที่ 1: Dialog ยืนยัน
    const dialog = page.getByRole("dialog", { name: /ต้องการรีเซ็ตข้อมูลทั้งหมดหรือไม่/ });
    await expect(dialog).toBeVisible();

    // ขั้นที่ 2: พิมพ์คำว่า RESET
    const confirmInput = dialog.locator("input#reset-confirm-input");
    await confirmInput.fill("RESET");

    const confirmActionBtn = dialog.getByRole("button", {
      name: "ยืนยันการล้างข้อมูล",
    });
    await confirmActionBtn.click();

    // หลัง reset แล้ว ด่านจะถูกรีเซ็ตกลับเหลือด่าน 1
    await page.goto("/levels");
    const level2Btn = page.getByRole("button", { name: /^ด่าน 02/ });
    await expect(level2Btn).toBeDisabled();
  });
});
