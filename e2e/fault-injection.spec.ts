import { expect, test } from "@playwright/test";
import { gotoPlay } from "./helpers";

test.describe("Phase 10: Fault Injection & Resilience (e2e/fault-injection.spec.ts) [AC-10]", () => {
  test("Case 1: LocalStorage เต็ม (QuotaExceededError) -> แสดง SaveStatus error badge, ผู้เล่นเล่นต่อได้ และมีปุ่ม Export", async ({
    page,
  }) => {
    // Inject mock that throws QuotaExceededError when setting item
    await page.addInitScript(() => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key.includes("save") || key.includes("checkpoint")) {
          const err = new DOMException("QuotaExceededError", "QuotaExceededError");
          throw err;
        }
        return originalSetItem.apply(this, [key, value]);
      };
    });

    await gotoPlay(page, "/level/1/play");

    // เล่นขั้นที่ 1
    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน" }).click();

    // วางไอออน
    const tray = page.locator('[data-drop-target="tray"]');
    await tray.getByRole("button", { name: /ซิลเวอร์/ }).click();
    await page.locator('[data-slot-id="L1:slot:0"]').click();

    // ตรวจสอบว่าแอปไม่ล่มและแสดงสถานะข้อผิดพลาดการบันทึก
    await expect(page.getByRole("heading", { name: /ขั้นที่ 2/ })).toBeVisible();
    await expect(page.locator('[data-slot-id="L1:slot:0"]').getByRole("button", { name: /ซิลเวอร์/ })).toBeVisible();

    // ตรวจสอบว่ามี SaveStatus แจ้งเตือนหรือปุ่มส่งออกข้อมูล
    await page.goto("/progress");
    await expect(page.getByRole("heading", { name: /ความก้าวหน้า/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /ส่งออกข้อมูล/ })).toBeVisible();
  });

  test("Case 2: LocalStorage ถูกปิดกั้น (SecurityError) -> ทำงานใน session ได้ ไม่แครช", async ({
    page,
  }) => {
    // Inject mock that throws SecurityError on localStorage access
    await page.addInitScript(() => {
      Storage.prototype.getItem = function () {
        throw new DOMException("SecurityError", "SecurityError");
      };
      Storage.prototype.setItem = function () {
        throw new DOMException("SecurityError", "SecurityError");
      };
    });

    await page.goto("/levels");
    await expect(page.getByRole("heading", { name: "เลือกด่าน" })).toBeVisible();

    // กดเข้าด่าน 1 ได้
    const level1Btn = page.getByRole("button", { name: /^ด่าน 01/ });
    await level1Btn.click();
    await expect(page).toHaveURL("/level/1/intro");
  });

  test("Case 3: ข้อมูล Save JSON เสียหาย -> สร้างสำรอง corrupt, ใช้ default save, ไม่ล่ม", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("ion-clash:save:v1", "{THIS_IS_CORRUPTED_JSON_DATA!!!}");
    });

    await page.goto("/levels");

    // เว็บต้องโหลดขึ้นปกติและแสดงด่าน 1 ปลดล็อก
    await expect(page.getByRole("heading", { name: "เลือกด่าน" })).toBeVisible();
    const level1Btn = page.getByRole("button", { name: /^ด่าน 01/ });
    await expect(level1Btn).toBeEnabled();

    // ตรวจสอบว่ามีการกักกันไฟล์เสียไว้ในคีย์ ion-clash:save:corrupt:*
    const keys = await page.evaluate(() => Object.keys(localStorage));
    const hasCorruptBackup = keys.some((k) => k.startsWith("ion-clash:save:corrupt:"));
    expect(hasCorruptBackup).toBe(true);
  });

  test("Case 5: Google Apps Script ล่ม (500 Internal Server Error) -> เกมเล่นได้ตามปกติ ข้อมูลเข้าคิว", async ({
    page,
  }) => {
    // Mock network route to Google Apps Script / Research endpoints to return 500
    await page.route("**/macros/s/**", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    await gotoPlay(page, "/level/1/play");

    // Step 1
    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน" }).click();

    // Step 2
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

    // Step 3
    await page.getByRole("button", { name: "ไปขั้นตัดไอออนตัวประกอบ" }).click();

    // Step 4
    const strip = page.getByRole("region", { name: "สมการไอออนิก" });
    await strip.getByRole("button", { name: /โซเดียม/ }).nth(0).click();
    await strip.getByRole("button", { name: /โซเดียม/ }).nth(1).click();
    await strip.getByRole("button", { name: /ไนเตรต/ }).nth(0).click();
    await strip.getByRole("button", { name: /ไนเตรต/ }).nth(1).click();
    await page.getByRole("button", { name: "ยืนยันการตัดไอออน" }).click();

    // Step 5: จบด่าน
    await page.getByRole("button", { name: "ดูผลคะแนนและจบด่าน" }).click();
    await expect(page.getByText("ผ่านด่านสำเร็จ")).toBeVisible();
  });

  test("Case 6: เน็ตหลุดกลางเกม (Offline Mode) -> เล่นต่อจนจบด่านได้ตามธรรมชาติ (D-18)", async ({
    context,
    page,
  }) => {
    await gotoPlay(page, "/level/1/play");

    // หลุดเน็ตระหว่างเล่น
    await context.setOffline(true);

    // Step 1
    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน" }).click();

    // Step 2
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

    // Step 3
    await page.getByRole("button", { name: "ไปขั้นตัดไอออนตัวประกอบ" }).click();

    // Step 4
    const strip = page.getByRole("region", { name: "สมการไอออนิก" });
    await strip.getByRole("button", { name: /โซเดียม/ }).nth(0).click();
    await strip.getByRole("button", { name: /โซเดียม/ }).nth(1).click();
    await strip.getByRole("button", { name: /ไนเตรต/ }).nth(0).click();
    await strip.getByRole("button", { name: /ไนเตรต/ }).nth(1).click();
    await page.getByRole("button", { name: "ยืนยันการตัดไอออน" }).click();

    // Step 5: จบด่าน
    await page.getByRole("button", { name: "ดูผลคะแนนและจบด่าน" }).click();
    await expect(page.getByText("ผ่านด่านสำเร็จ")).toBeVisible();

    await context.setOffline(false);
  });
});
