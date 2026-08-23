import { expect, test } from "@playwright/test";
import { dismissRotatePrompt } from "./helpers";

test.describe("Phase 9: Research Data Collection & Dashboard E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("1. ลงทะเบียนชื่อ + ยินยอมวิจัย -> เล่นจบด่าน 1 -> ส่งออกข้อมูลที่ /progress", async ({
    page,
  }) => {
    await page.goto("/");

    // 1.1 หน้าแรก: กดเริ่มเกม กรอกชื่อผู้เรียน และติ๊กยินยอม
    const startBtn = page.getByRole("button", { name: "เริ่มเกม" });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Dialog กรอกชื่อ
    const nameInput = page.getByLabel("ชื่อหรือรหัสผู้เรียน:");
    await expect(nameInput).toBeVisible();
    await nameInput.fill("StudentResearchE2E");

    // ตรวจสอบว่ามีข้อความความยินยอมวิจัย
    await expect(
      page.getByText("ยินยอมส่งข้อมูลผลการเรียนเพื่อการวิจัย", { exact: false }),
    ).toBeVisible();

    await page.getByRole("button", { name: "เข้าสู่เกม" }).click();

    // 1.2 เข้าสู่หน้า /levels
    await expect(page).toHaveURL("/levels");

    // เลือกด่าน 01
    const level1Btn = page.getByRole("button", { name: /^ด่าน 01/ });
    await level1Btn.click();

    // 1.3 หน้า Level Intro -> เล่นเกม
    await expect(page).toHaveURL("/level/1/intro");
    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();

    // Step 1
    await expect(page).toHaveURL("/level/1/play");
    await dismissRotatePrompt(page);
    await page.getByRole("button", { name: "เริ่มแยกไอออน" }).click();
    await page.getByRole("button", { name: "ไปยังขั้นจัดเรียงไอออน" }).click();

    // Step 2: วางไอออน 4 ช่อง
    const tray = page.locator('[data-drop-target="tray"]');
    const slot0 = page.locator('[data-slot-id="L1:slot:0"]');
    const slot1 = page.locator('[data-slot-id="L1:slot:1"]');
    const slot2 = page.locator('[data-slot-id="L1:slot:2"]');
    const slot3 = page.locator('[data-slot-id="L1:slot:3"]');

    await tray.getByRole("button", { name: /ซิลเวอร์/ }).click();
    await slot0.click();

    await tray.getByRole("button", { name: /คลอไรด์/ }).click();
    await slot1.click();

    await tray.getByRole("button", { name: /โซเดียม/ }).click();
    await slot2.click();

    await tray.getByRole("button", { name: /ไนเตรต/ }).click();
    await slot3.click();

    await page.getByRole("button", { name: "ตรวจการจัดเรียงไอออน" }).click();

    // Step 3
    await page.getByRole("button", { name: "ไปขั้นตัดไอออนตัวประกอบ" }).click();

    // Step 4
    const strip = page.getByRole("region", { name: "สมการไอออนิก" });
    const naButtons = strip.getByRole("button", { name: /โซเดียม/ });
    await naButtons.nth(0).click();
    await naButtons.nth(1).click();

    const no3Buttons = strip.getByRole("button", { name: /ไนเตรต/ });
    await no3Buttons.nth(0).click();
    await no3Buttons.nth(1).click();

    await page.getByRole("button", { name: "ยืนยันการตัดไอออน" }).click();

    // Step 5: จบด่าน
    await page.getByRole("button", { name: "ดูผลคะแนนและจบด่าน" }).click();
    await expect(page.getByText("ผ่านด่านสำเร็จ")).toBeVisible();

    // 1.4 ไปยังหน้า /progress และตรวจสอบปุ่มส่งออกข้อมูลวิจัย
    await page.goto("/progress");
    await expect(
      page.getByRole("heading", { name: "ความก้าวหน้าและการจัดการข้อมูล" }),
    ).toBeVisible();

    // ตรวจสอบปุ่มข้อมูลวิจัย
    const copyTsvBtn = page.getByRole("button", {
      name: /คัดลอกผลการเรียน \(TSV\)/,
    });
    await expect(copyTsvBtn).toBeVisible();
    await copyTsvBtn.click();

    const downloadCsvBtn = page.getByRole("button", {
      name: /ดาวน์โหลด CSV/,
    });
    await expect(downloadCsvBtn).toBeVisible();
  });

  test("2. หน้า /research นำเข้า TSV และคำนวณ E1/E2 พร้อมวิเคราะห์ข้อผิดพลาด", async ({
    page,
  }) => {
    await page.goto("/research");
    await expect(
      page.getByRole("heading", {
        name: /แดชบอร์ดข้อมูลวิจัยและการประเมิน E1\/E2/,
      }),
    ).toBeVisible();

    const sampleCsv = [
      "playerName,installId,levelId,attemptNo,completed,score,stars,elapsedMs,hintsUsed,wrongAttempts,E-CHARGE,E-PAIR,E-PHASE,E-BALANCE,E-RATIO,E-SPECTATOR,startedAt,finishedAt",
      "S01,inst-1,1,1,true,100,3,60000,0,0,0,0,0,0,0,0,2026-08-23T08:00:00.000Z,2026-08-23T08:01:00.000Z",
      "S02,inst-2,1,1,true,80,2,75000,1,1,1,0,0,0,0,0,2026-08-23T08:00:00.000Z,2026-08-23T08:01:15.000Z",
    ].join("\n");

    const textarea = page.locator("textarea").first();
    await textarea.fill(sampleCsv);
    await textarea.press("Space");
    await textarea.press("Backspace");

    const processBtn = page.getByRole("button", { name: "ประมวลผลข้อความ" });
    await processBtn.click();

    // ตรวจสอบ E1 รวม: (100 + 80) / 2 = 90.0%
    await expect(page.getByText("90.0%")).toBeVisible();
    await expect(page.getByText("ผ่านเกณฑ์ (≥80)")).toBeVisible();

    // กรอกคะแนน E2: S01 ได้ 24/30 (80%), S02 ได้ 27/30 (90%) -> E2 รวม = 85.0%
    const e2Inputs = page.getByPlaceholder("0");
    await e2Inputs.nth(0).fill("24");
    await e2Inputs.nth(1).fill("27");

    // ตรวจสอบเกณฑ์ 80/80
    await expect(page.getByText("90.0 / 85.0")).toBeVisible();
    await expect(page.getByText("ผ่านเกณฑ์ 80/80")).toBeVisible();

    // ตรวจสอบสถิติข้อผิดพลาด E-CHARGE
    await expect(
      page.getByText("E-CHARGE (ผลรวมประจุไม่เป็นศูนย์)"),
    ).toBeVisible();
  });

  test("3. เปลี่ยนแปลงความยินยอมวิจัยในหน้า /settings", async ({ page }) => {
    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { name: "การตั้งค่า" }),
    ).toBeVisible();

    const consentText = page.getByText("ยินยอมส่งข้อมูลวิจัย (Research Data Consent)");
    await expect(consentText).toBeVisible();

    const switches = page.getByRole("switch");
    const consentSwitch = switches.nth(3);
    await expect(consentSwitch).toBeVisible();
  });
});
