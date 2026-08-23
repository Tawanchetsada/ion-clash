import { expect, test } from "@playwright/test";

test.describe("Phase 10: Gameplay E2E Scenarios (e2e/play.spec.ts)", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage and listen for console errors
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("Scenario 1: เล่นด่าน 01 จบด้วยเมาส์ (Pointer Drag & Drop บน route จริง) [AC-04]", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/level/1/play");

    // Step 1: แตกตัว
    await expect(page.getByRole("heading", { name: /ขั้นที่ 1/ })).toBeVisible();
    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน →" }).click();

    // Step 2: ลากการ์ดลง 4 ช่องด้วยเมาส์ (Pointer Drag)
    await expect(page.getByRole("heading", { name: /ขั้นที่ 2/ })).toBeVisible();

    const tray = page.locator('[data-drop-target="tray"]');
    const slot0 = page.locator('[data-slot-id="L1:slot:0"]');
    const slot1 = page.locator('[data-slot-id="L1:slot:1"]');
    const slot2 = page.locator('[data-slot-id="L1:slot:2"]');
    const slot3 = page.locator('[data-slot-id="L1:slot:3"]');

    const agCard = tray.getByRole("button", { name: /ซิลเวอร์/ });
    const clCard = tray.getByRole("button", { name: /คลอไรด์/ });
    const naCard = tray.getByRole("button", { name: /โซเดียม/ });
    const no3Card = tray.getByRole("button", { name: /ไนเตรต/ });

    await agCard.dragTo(slot0);
    await clCard.dragTo(slot1);
    await naCard.dragTo(slot2);
    await no3Card.dragTo(slot3);

    // ตรวจสอบว่าในช่องมีไอออนครบ
    await expect(slot0.getByRole("button", { name: /ซิลเวอร์/ })).toBeVisible();
    await expect(slot1.getByRole("button", { name: /คลอไรด์/ })).toBeVisible();
    await expect(slot2.getByRole("button", { name: /โซเดียม/ })).toBeVisible();
    await expect(slot3.getByRole("button", { name: /ไนเตรต/ })).toBeVisible();

    // ตรวจการจัดเรียง
    await page.getByRole("button", { name: "ตรวจการจัดเรียงไอออน" }).click();

    // Step 3: ตรวจสอบการ์ดทอง
    await expect(page.getByRole("heading", { name: /ขั้นที่ 3/ })).toBeVisible();
    await expect(page.getByText("เกิดตะกอน (ไม่ละลายน้ำ)")).toBeVisible();
    await page.getByRole("button", { name: "ไปขั้นตัดไอออนผู้ชม →" }).click();

    // Step 4: ตัดไอออนผู้ชม
    await expect(page.getByRole("heading", { name: /ขั้นที่ 4/ })).toBeVisible();
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

    // Step 5: จบด่าน
    await expect(page.getByRole("heading", { name: /ขั้นที่ 5/ })).toBeVisible();
    await page.getByRole("button", { name: "ดูผลคะแนนและจบด่าน →" }).click();

    await expect(page.getByText("ผ่านด่านสำเร็จ!")).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test("Scenario 2: เล่นด่าน 01 จบด้วยการแตะ (Tap to Place) [AC-04]", async ({
    page,
  }) => {
    await page.goto("/level/1/play");

    // Step 1
    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน →" }).click();

    // Step 2: แตะการ์ดแล้วแตะช่อง
    const tray = page.locator('[data-drop-target="tray"]');
    const slot0 = page.locator('[data-slot-id="L1:slot:0"]');
    const slot1 = page.locator('[data-slot-id="L1:slot:1"]');
    const slot2 = page.locator('[data-slot-id="L1:slot:2"]');
    const slot3 = page.locator('[data-slot-id="L1:slot:3"]');

    const agCard = tray.getByRole("button", { name: /ซิลเวอร์/ });
    await agCard.click();
    await expect(agCard).toHaveAttribute("aria-pressed", "true");
    await slot0.click();

    const clCard = tray.getByRole("button", { name: /คลอไรด์/ });
    await clCard.click();
    await slot1.click();

    const naCard = tray.getByRole("button", { name: /โซเดียม/ });
    await naCard.click();
    await slot2.click();

    const no3Card = tray.getByRole("button", { name: /ไนเตรต/ });
    await no3Card.click();
    await slot3.click();

    await page.getByRole("button", { name: "ตรวจการจัดเรียงไอออน" }).click();

    // Step 3
    await page.getByRole("button", { name: "ไปขั้นตัดไอออนผู้ชม →" }).click();

    // Step 4
    const strip = page.getByRole("region", { name: "สมการไอออนิก" });
    await strip.getByRole("button", { name: /โซเดียม/ }).nth(0).click();
    await strip.getByRole("button", { name: /โซเดียม/ }).nth(1).click();
    await strip.getByRole("button", { name: /ไนเตรต/ }).nth(0).click();
    await strip.getByRole("button", { name: /ไนเตรต/ }).nth(1).click();
    await page.getByRole("button", { name: "ยืนยันการตัดไอออน" }).click();

    // Step 5
    await page.getByRole("button", { name: "ดูผลคะแนนและจบด่าน →" }).click();
    await expect(page.getByText("ผ่านด่านสำเร็จ!")).toBeVisible();
  });

  test("Scenario 3: เล่นด่าน 01 จบด้วยคีย์บอร์ดล้วน [AC-04]", async ({
    page,
  }) => {
    await page.goto("/level/1/play");

    // Step 1: กดปุ่มแยกไอออนด้วยคีย์บอร์ด
    const startDissociateBtn = page.getByRole("button", { name: "เริ่มแยกไอออน" });
    await startDissociateBtn.focus();
    await page.keyboard.press("Enter");

    const toStep2Btn = page.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน →" });
    await toStep2Btn.focus();
    await page.keyboard.press("Enter");

    // Step 2: คีย์บอร์ด Focus การ์ด -> Enter ถือ -> Focus ช่อง -> Enter วาง
    const tray = page.locator('[data-drop-target="tray"]');
    const slot0 = page.locator('[data-slot-id="L1:slot:0"]');
    const slot1 = page.locator('[data-slot-id="L1:slot:1"]');
    const slot2 = page.locator('[data-slot-id="L1:slot:2"]');
    const slot3 = page.locator('[data-slot-id="L1:slot:3"]');

    // Silver -> Slot 0
    const agCard = tray.getByRole("button", { name: /ซิลเวอร์/ });
    await agCard.focus();
    await page.keyboard.press("Enter");
    await slot0.focus();
    await page.keyboard.press("Enter");

    // Chloride -> Slot 1
    const clCard = tray.getByRole("button", { name: /คลอไรด์/ });
    await clCard.focus();
    await page.keyboard.press("Enter");
    await slot1.focus();
    await page.keyboard.press("Enter");

    // Sodium -> Slot 2
    const naCard = tray.getByRole("button", { name: /โซเดียม/ });
    await naCard.focus();
    await page.keyboard.press("Enter");
    await slot2.focus();
    await page.keyboard.press("Enter");

    // Nitrate -> Slot 3
    const no3Card = tray.getByRole("button", { name: /ไนเตรต/ });
    await no3Card.focus();
    await page.keyboard.press("Enter");
    await slot3.focus();
    await page.keyboard.press("Enter");

    // Check button
    const checkBtn = page.getByRole("button", { name: "ตรวจการจัดเรียงไอออน" });
    await checkBtn.focus();
    await page.keyboard.press("Enter");

    // Step 3
    const toStep4Btn = page.getByRole("button", { name: "ไปขั้นตัดไอออนผู้ชม →" });
    await toStep4Btn.focus();
    await page.keyboard.press("Enter");

    // Step 4
    const strip = page.getByRole("region", { name: "สมการไอออนิก" });
    const naButtons = strip.getByRole("button", { name: /โซเดียม/ });
    await naButtons.nth(0).focus();
    await page.keyboard.press("Enter");
    await naButtons.nth(1).focus();
    await page.keyboard.press("Enter");

    const no3Buttons = strip.getByRole("button", { name: /ไนเตรต/ });
    await no3Buttons.nth(0).focus();
    await page.keyboard.press("Enter");
    await no3Buttons.nth(1).focus();
    await page.keyboard.press("Enter");

    const confirmBtn = page.getByRole("button", { name: "ยืนยันการตัดไอออน" });
    await confirmBtn.focus();
    await page.keyboard.press("Enter");

    // Step 5
    const finishBtn = page.getByRole("button", { name: "ดูผลคะแนนและจบด่าน →" });
    await finishBtn.focus();
    await page.keyboard.press("Enter");

    await expect(page.getByText("ผ่านด่านสำเร็จ!")).toBeVisible();
  });

  test("Scenario 4: จับคู่ผลิตภัณฑ์ผิด ไม่เปลี่ยนเป็นการ์ดทอง และ feedback ไม่เฉลยคำตอบ [AC-05]", async ({
    page,
  }) => {
    await page.goto("/level/1/play");

    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน →" }).click();

    // วางผิดคู่: นำไอออนจากสารตั้งต้นเดียวกันมาคู่กัน (Ag+ กับ NO3- และ Na+ กับ Cl-)
    const tray = page.locator('[data-drop-target="tray"]');
    const slot0 = page.locator('[data-slot-id="L1:slot:0"]');
    const slot1 = page.locator('[data-slot-id="L1:slot:1"]');
    const slot2 = page.locator('[data-slot-id="L1:slot:2"]');
    const slot3 = page.locator('[data-slot-id="L1:slot:3"]');

    await tray.getByRole("button", { name: /ซิลเวอร์/ }).click();
    await slot0.click();

    await tray.getByRole("button", { name: /ไนเตรต/ }).click();
    await slot1.click();

    await tray.getByRole("button", { name: /โซเดียม/ }).click();
    await slot2.click();

    await tray.getByRole("button", { name: /คลอไรด์/ }).click();
    await slot3.click();

    await page.getByRole("button", { name: "ตรวจการจัดเรียงไอออน" }).click();

    // ต้องยังคงอยู่ในขั้นที่ 2 ไม่เปลี่ยนสถานะ
    await expect(page.getByRole("heading", { name: /ขั้นที่ 2/ })).toBeVisible();

    // Feedback ต้องแจ้งข้อผิดพลาดหลักการ E-PAIR
    const feedback = page.getByRole("alert").filter({ hasText: /ไม่ใช่ผลิตภัณฑ์|จับคู่|ปฏิกิริยา/ });
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText("ไม่ใช่ผลิตภัณฑ์");

    // Feedback ต้องไม่เฉลยสูตรตะกอนจริง ("AgCl")
    const feedbackText = await feedback.textContent();
    expect(feedbackText).not.toContain("AgCl");
  });

  test("Scenario 5: กรอกสัมประสิทธิ์ถูกต้องในด่าน 13 แล้วการ์ดตะกอนเปลี่ยนเป็นสีทอง [AC-05]", async ({
    page,
  }) => {
    await page.goto("/");
    // Unlock up to level 13
    await page.evaluate(() => {
      const save = {
        version: 1,
        installId: "test-install-id",
        playerName: "Tester",
        unlockedLevel: 13,
        completedLevels: {},
        lastPlayedLevel: 1,
        activeCheckpoint: null,
        settings: {
          sound: true,
          music: false,
          reducedMotion: false,
          researchConsent: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("ion-clash:save:v1", JSON.stringify(save));
    });

    await page.goto("/level/13/play");

    // Step 1
    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน →" }).click();

    // Step 2: แลกคู่ไอออน ด่าน 13: Pb(NO3)2 + 2KI -> PbI2 (ตกตะกอน) + 2KNO3 (สารละลาย)
    // Pair 1: Pb2+ (lead-2plus) + 2I- (iodide)
    // Pair 2: 2K+ (potassium-plus) + 2NO3- (nitrate)
    const tray = page.locator('[data-drop-target="tray"]');
    const slot0 = page.locator('[data-slot-id="L13:slot:0"]');
    const slot1 = page.locator('[data-slot-id="L13:slot:1"]');
    const slot2 = page.locator('[data-slot-id="L13:slot:2"]');
    const slot3 = page.locator('[data-slot-id="L13:slot:3"]');

    await tray.getByRole("button", { name: /เลด/ }).click();
    await slot0.click();
    await tray.getByRole("button", { name: /ไอโอไดด์/ }).click();
    await slot1.click();
    await tray.getByRole("button", { name: /โพแทสเซียม/ }).click();
    await slot2.click();
    await tray.getByRole("button", { name: /ไนเตรต/ }).click();
    await slot3.click();

    await page.getByRole("button", { name: "ตรวจการจัดเรียงไอออน" }).click();

    // เข้าสู่ขั้นตอนดุลสัมประสิทธิ์
    await expect(page.getByText("ขั้นที่ 2 · ดุลสัมประสิทธิ์ของสมการ")).toBeVisible();

    // กรอกสัมประสิทธิ์ 1:2:1:2 (ถูกต้อง)
    const inputs = page.locator('input[inputmode="numeric"]');
    await inputs.nth(0).fill("1");
    await inputs.nth(1).fill("2");
    await inputs.nth(2).fill("1");
    await inputs.nth(3).fill("2");

    await page.getByRole("button", { name: "ตรวจการดุลสมการ" }).click();

    // Step 3: ตรวจสอบว่าตะกอน PbI2 ปรากฏในการ์ดตะกอน
    await expect(page.getByRole("heading", { name: /ขั้นที่ 3/ })).toBeVisible();
    await expect(page.getByText("เกิดตะกอน (ไม่ละลายน้ำ)")).toBeVisible();
  });

  test("Scenario 6: กรอกสัมประสิทธิ์ 2:4:2:4 แทน 1:2:1:2 ในด่าน 13 แล้วไม่ผ่าน (E-RATIO) [AC-07]", async ({
    page,
  }) => {
    await page.goto("/");
    // Unlock up to level 13
    await page.evaluate(() => {
      const save = {
        version: 1,
        installId: "test-install-id",
        playerName: "Tester",
        unlockedLevel: 13,
        completedLevels: {},
        lastPlayedLevel: 1,
        activeCheckpoint: null,
        settings: {
          sound: true,
          music: false,
          reducedMotion: false,
          researchConsent: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("ion-clash:save:v1", JSON.stringify(save));
    });

    await page.goto("/level/13/play");

    // Step 1 & 2
    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน →" }).click();

    const tray = page.locator('[data-drop-target="tray"]');
    await tray.getByRole("button", { name: /เลด/ }).click();
    await page.locator('[data-slot-id="L13:slot:0"]').click();
    await tray.getByRole("button", { name: /ไอโอไดด์/ }).click();
    await page.locator('[data-slot-id="L13:slot:1"]').click();
    await tray.getByRole("button", { name: /โพแทสเซียม/ }).click();
    await page.locator('[data-slot-id="L13:slot:2"]').click();
    await tray.getByRole("button", { name: /ไนเตรต/ }).click();
    await page.locator('[data-slot-id="L13:slot:3"]').click();

    await page.getByRole("button", { name: "ตรวจการจัดเรียงไอออน" }).click();

    // กรอกสัมประสิทธิ์ 2:4:2:4
    const inputs = page.locator('input[inputmode="numeric"]');
    await inputs.nth(0).fill("2");
    await inputs.nth(1).fill("4");
    await inputs.nth(2).fill("2");
    await inputs.nth(3).fill("4");

    await page.getByRole("button", { name: "ตรวจการดุลสมการ" }).click();

    // ต้องยังอยู่ในขั้นดุล และแสดง error E-RATIO (ยังลดสัมประสิทธิ์ได้)
    await expect(page.getByText("ขั้นที่ 2 · ดุลสัมประสิทธิ์ของสมการ")).toBeVisible();
    const feedback = page.getByRole("alert").filter({ hasText: /สมดุล|สัมประสิทธิ์|ลด/ });
    await expect(feedback).toContainText("ยังลดสัมประสิทธิ์ได้");
  });

  test("Scenario 7: ตัดไอออนผู้ชมผิดแล้วไม่ผ่าน; ทดสอบปุ่ม Undo และ Reset [AC-06]", async ({
    page,
  }) => {
    await page.goto("/level/1/play");

    // Step 1 & 2
    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน →" }).click();

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
    await page.getByRole("button", { name: "ไปขั้นตัดไอออนผู้ชม →" }).click();

    // Step 4
    await expect(page.getByRole("heading", { name: /ขั้นที่ 4/ })).toBeVisible();
    const strip = page.getByRole("region", { name: "สมการไอออนิก" });

    // 7.1 ลองตัดตะกอน AgCl ฝั่งขวากับ Ag+ ฝั่งซ้าย -> ต้องไม่สำเร็จ (E-SPECTATOR)
    const agLeft = strip.getByRole("button", { name: /ซิลเวอร์/ }).nth(0);
    const agclRight = strip.getByRole("button", { name: /ซิลเวอร์คลอไรด์/ }).first();
    await agLeft.click();
    await agclRight.click();

    const feedback = page.getByRole("alert").filter({ hasText: /ตัดได้เฉพาะ|ไอออน|ผู้ชม/ });
    await expect(feedback).toContainText("ตัดได้เฉพาะไอออนที่เหมือนกัน");

    // 7.2 ตัดคู่ Na+ ที่ถูกต้อง 1 คู่
    const naButtons = strip.getByRole("button", { name: /โซเดียม/ });
    await naButtons.nth(0).click();
    await naButtons.nth(1).click();
    await expect(page.getByText(/คู่ที่ 1:/)).toBeVisible();

    // 7.3 ทดสอบปุ่ม Undo
    const undoBtn = page.getByRole("button", { name: /ย้อนคู่ล่าสุด/ });
    await undoBtn.click();
    await expect(page.getByText(/คู่ที่ 1:/)).not.toBeVisible();

    // 7.4 ตัดใหม่ 2 คู่ แล้วทดสอบปุ่ม Reset
    await naButtons.nth(0).click();
    await naButtons.nth(1).click();
    const no3Buttons = strip.getByRole("button", { name: /ไนเตรต/ });
    await no3Buttons.nth(0).click();
    await no3Buttons.nth(1).click();

    await expect(page.getByText(/คู่ที่ 2:/)).toBeVisible();

    const resetBtn = page.getByRole("button", { name: /ล้างการตัดทั้งหมด/ });
    await resetBtn.click();
    await expect(page.getByText(/คู่ที่ 1:/)).not.toBeVisible();
  });

  test("Scenario 14: เล่นด่าน 42 ที่สัมประสิทธิ์ 3:2:1:6 จนจบสมบูรณ์ [AC-07]", async ({
    page,
  }) => {
    await page.goto("/");
    // Unlock up to level 42
    await page.evaluate(() => {
      const save = {
        version: 1,
        installId: "test-install-id",
        playerName: "Tester42",
        unlockedLevel: 42,
        completedLevels: {},
        lastPlayedLevel: 1,
        activeCheckpoint: null,
        settings: {
          sound: true,
          music: false,
          reducedMotion: false,
          researchConsent: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("ion-clash:save:v1", JSON.stringify(save));
    });

    await page.goto("/level/42/play");

    // Step 1: แตกตัว 3CaCl2 + 2Na3PO4
    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน →" }).click();

    // Step 2: แลกคู่ไอออน -> Ca3(PO4)2 + NaCl
    // Pair 1: Ca2+ (calcium-2plus) + PO4 3- (phosphate)
    // Pair 2: Na+ (sodium-plus) + Cl- (chloride)
    const tray = page.locator('[data-drop-target="tray"]');
    const slot0 = page.locator('[data-slot-id="L42:slot:0"]');
    const slot1 = page.locator('[data-slot-id="L42:slot:1"]');
    const slot2 = page.locator('[data-slot-id="L42:slot:2"]');
    const slot3 = page.locator('[data-slot-id="L42:slot:3"]');

    await tray.getByRole("button", { name: /แคลเซียม/ }).click();
    await slot0.click();

    await tray.getByRole("button", { name: /ฟอสเฟต/ }).click();
    await slot1.click();

    await tray.getByRole("button", { name: /โซเดียม/ }).click();
    await slot2.click();

    await tray.getByRole("button", { name: /คลอไรด์/ }).click();
    await slot3.click();

    await page.getByRole("button", { name: "ตรวจการจัดเรียงไอออน" }).click();

    // Step 2.5: ดุลสัมประสิทธิ์: 3 CaCl2 + 2 Na3PO4 -> 1 Ca3(PO4)2 + 6 NaCl (3:2:1:6)
    await expect(page.getByText("ขั้นที่ 2 · ดุลสัมประสิทธิ์ของสมการ")).toBeVisible();
    const inputs = page.locator('input[inputmode="numeric"]');
    await inputs.nth(0).fill("3");
    await inputs.nth(1).fill("2");
    await inputs.nth(2).fill("1");
    await inputs.nth(3).fill("6");

    await page.getByRole("button", { name: "ตรวจการดุลสมการ" }).click();

    // Step 3: ตะกอน Ca3(PO4)2 เป็นการ์ดทอง
    await expect(page.getByRole("heading", { name: /ขั้นที่ 3/ })).toBeVisible();
    await page.getByRole("button", { name: "ไปขั้นตัดไอออนผู้ชม →" }).click();

    // Step 4: ตัดไอออนผู้ชม (Cl- 6 ตัว, Na+ 6 ตัว)
    await expect(page.getByRole("heading", { name: /ขั้นที่ 4/ })).toBeVisible();
    const strip = page.getByRole("region", { name: "สมการไอออนิก" });

    const clButtons = strip.getByRole("button", { name: /คลอไรด์/ });
    await clButtons.nth(0).click();
    await clButtons.nth(1).click();

    const naButtons = strip.getByRole("button", { name: /โซเดียม/ });
    await naButtons.nth(0).click();
    await naButtons.nth(1).click();

    const confirmBtn = page.getByRole("button", { name: "ยืนยันการตัดไอออน" });
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();

    // Step 5: สรุปสมการไอออนิกสุทธิ
    await expect(page.getByRole("heading", { name: /ขั้นที่ 5/ })).toBeVisible();
    await page.getByRole("button", { name: "ดูผลคะแนนและจบด่าน →" }).click();

    await expect(page.getByText("ผ่านด่านสำเร็จ!")).toBeVisible();
  });
});
