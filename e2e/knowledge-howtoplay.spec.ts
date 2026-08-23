import { test, expect } from "@playwright/test";

test.describe("Phase 8: Knowledge and How-to-Play E2E Tests", () => {
  test("1. หน้า /knowledge แสดงหัวข้อครบ 4 หัวข้อและเปิดปิด accordion ได้", async ({ page }) => {
    await page.goto("/knowledge");

    await expect(page.getByRole("heading", { name: "คลังความรู้เคมี ม.4" })).toBeVisible();

    const topic1Btn = page.getByRole("button", { name: /การแตกตัวของสารประกอบไอออนิกในน้ำ/ });
    const topic2Btn = page.getByRole("button", { name: /กฎการละลายน้ำของสารประกอบไอออนิก/ });
    const topic3Btn = page.getByRole("button", { name: /ไอออนผู้ชม/ });
    const topic4Btn = page.getByRole("button", { name: /การดุลสมการเคมีและอัตราส่วนอย่างต่ำ/ });

    await expect(topic1Btn).toBeVisible();
    await expect(topic2Btn).toBeVisible();
    await expect(topic3Btn).toBeVisible();
    await expect(topic4Btn).toBeVisible();

    // Open Topic 2
    await topic2Btn.click();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByText("เกลือของ Na⁺, K⁺ และ NH₄⁺ ละลายน้ำได้ทั้งหมด")).toBeVisible();

    // Start playing button
    const startLink = page.getByRole("link", { name: /เริ่มเล่นเลย/ });
    await expect(startLink).toBeVisible();
    await startLink.click();
    await expect(page).toHaveURL(/.*\/levels/);
  });

  test("2. หน้า /how-to-play มีตัวอย่าง Interactive Sandbox และลิงก์นำทาง", async ({ page }) => {
    await page.goto("/how-to-play");

    await expect(page.getByRole("heading", { name: "คู่มือวิธีการเล่นเกม Ion Clash" })).toBeVisible();
    await expect(page.getByText("5 ขั้นตอนสู่สมการไอออนิกสุทธิ")).toBeVisible();
    await expect(page.getByText("ความหมายของแถบสีการ์ด 4 สี")).toBeVisible();
    await expect(page.getByText("ระบบคะแนนและการคำนวณดาว")).toBeVisible();

    // Click auto fill sandbox button
    const autoFillBtn = page.getByRole("button", { name: "แสดงตัวอย่างการวางที่ถูกต้อง" });
    await expect(autoFillBtn).toBeVisible();
    await autoFillBtn.click();

    // Check bottom navigation links
    const knowledgeLink = page.getByRole("link", { name: /ศึกษาคลังความรู้/ });
    await expect(knowledgeLink).toBeVisible();
    await knowledgeLink.click();
    await expect(page).toHaveURL(/.*\/knowledge/);
  });

  test("3. ในหน้าเล่นเกม (/level/1/play) สามารถเปิดดูกฎการละลายได้", async ({ page }) => {
    await page.goto("/level/1/play");

    const rulesBtn = page.getByRole("button", { name: "ดูกฎการละลาย" });
    await expect(rulesBtn).toBeVisible();
    await rulesBtn.click();

    const dialog = page.getByRole("dialog", { name: "ดูกฎการละลาย" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("table")).toBeVisible();

    const closeBtn = dialog.getByRole("button", { name: "ปิด" });
    await closeBtn.click();
    await expect(dialog).not.toBeVisible();
  });
});
