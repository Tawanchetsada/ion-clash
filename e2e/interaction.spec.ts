import { expect, test } from "@playwright/test";

test.describe("Interaction Harness (/dev/interaction)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dev/interaction");
    // รีเซ็ตสู่ขั้นวางไอออนทันทีเพื่อเริ่มทดสอบ
    await page.getByRole("button", { name: "รีเซ็ตสู่ขั้นวางไอออน" }).click();
    await expect(page.getByText("สถานะ: arrangeProductIons")).toBeVisible();
  });

  test("1. ลากการ์ดใบแรกลงช่องที่ 1 ด้วยเมาส์/พอยน์เตอร์", async ({ page }) => {
    // หาการ์ดใบแรกในถาดไอออน
    const tray = page.locator('[data-drop-target="tray"]');
    const firstCard = tray.getByRole("button").first();
    const cardLabel = await firstCard.getAttribute("aria-label");
    expect(cardLabel).toBeTruthy();

    const slot1 = page.locator('[data-slot-id="L1:slot:0"]');

    // ลากการ์ดลงช่องที่ 1
    await firstCard.dragTo(slot1);

    // ตรวจสอบว่าช่องที่ 1 มีการ์ดไอออนนั้นอยู่
    await expect(slot1.getByRole("button", { name: cardLabel! })).toBeVisible();
  });

  test("2. แตะการ์ดแล้วแตะช่อง (Tap-to-place)", async ({ page }) => {
    const tray = page.locator('[data-drop-target="tray"]');
    const firstCard = tray.getByRole("button").first();
    const cardLabel = await firstCard.getAttribute("aria-label");
    expect(cardLabel).toBeTruthy();

    const slot1 = page.locator('[data-slot-id="L1:slot:0"]');

    // แตะการ์ด
    await firstCard.click();
    await expect(firstCard).toHaveAttribute("aria-pressed", "true");

    // แตะช่องที่ 1
    await slot1.click();

    // ตรวจสอบว่าวางลงช่องสำเร็จ
    await expect(slot1.getByRole("button", { name: cardLabel! })).toBeVisible();
  });

  test("3. วางด้วยคีย์บอร์ดล้วน (Enter ถือ -> Enter วาง)", async ({ page }) => {
    const tray = page.locator('[data-drop-target="tray"]');
    const firstCard = tray.getByRole("button").first();
    const cardLabel = await firstCard.getAttribute("aria-label");
    expect(cardLabel).toBeTruthy();

    const slot1 = page.locator('[data-slot-id="L1:slot:0"]');

    // Focus การ์ดใบแรกและกด Enter เพื่อถือ
    await firstCard.focus();
    await page.keyboard.press("Enter");
    await expect(firstCard).toHaveAttribute("aria-pressed", "true");

    // Focus ช่องที่ 1 และกด Enter เพื่อวาง
    await slot1.focus();
    await page.keyboard.press("Enter");

    // ตรวจสอบว่าวางลงช่องสำเร็จ
    await expect(slot1.getByRole("button", { name: cardLabel! })).toBeVisible();
  });

  test("4. ลากออกนอกเป้าหมายแล้วปล่อย การ์ดต้องกลับที่เดิมและไม่มี error", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    const tray = page.locator('[data-drop-target="tray"]');
    const firstCard = tray.getByRole("button").first();
    const cardLabel = await firstCard.getAttribute("aria-label");
    expect(cardLabel).toBeTruthy();

    const box = await firstCard.boundingBox();
    expect(box).toBeTruthy();

    // ลากออกไปที่ตำแหน่งว่าง
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(10, 10);
    await page.mouse.up();

    // การ์ดยังคงอยู่ในถาด
    await expect(tray.getByRole("button", { name: cardLabel! })).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("5. ตรวจสอบว่าไม่มี horizontal scroll ระดับหน้า", async ({ page }) => {
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(isOverflowing).toBe(false);
  });
});
