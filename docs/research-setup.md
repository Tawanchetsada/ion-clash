# คู่มือการติดตั้งระบบเก็บข้อมูลวิจัย Ion Clash (Google Sheet + Apps Script)

เอกสารนี้อธิบายขั้นตอนการตั้งค่า Google Sheet เพื่อรับข้อมูลผลการเรียนรู้จากเว็บเกม Ion Clash เข้าสู่ Google Sheet อัตโนมัติ (ตาม D-06, D-14)

---

## 1. การสร้าง Google Sheet

1. เข้าไปที่ [Google Sheets](https://sheets.google.com) แล้วสร้างสเปรดชีตใหม่
2. ตั้งชื่อไฟล์ เช่น `Ion Clash - ข้อมูลวิจัย E1/E2`
3. ตั้งชื่อแผ่นงานแรกว่า `events`
4. ใส่หัวตารางในแถวที่ 1 (คอลัมน์ A ถึง S):

| คอลัมน์ | ชื่อหัวตาราง | คำอธิบาย |
|---|---|---|
| A | `timestamp` | วันที่เวลาที่ข้อมูลถูกบันทึกลง Sheet |
| B | `playerName` | ชื่อหรือรหัสผู้เรียน (เช่น S01) |
| C | `installId` | รหัสประจำเครื่อง (UUID) |
| D | `levelId` | รหัสด่าน (1–50) |
| E | `attemptNo` | ครั้งที่เล่นในด่านนี้ |
| F | `completed` | ผ่านด่านสำเร็จ (TRUE/FALSE) |
| G | `score` | คะแนนเกม (0–100) |
| H | `stars` | ดาวที่ได้รับ (0–3) |
| I | `elapsedMs` | เวลาที่ใช้ (มิลลิวินาที) |
| J | `hintsUsed` | จำนวนคำใบ้ที่ใช้ (0–3) |
| K | `wrongAttempts` | จำนวนครั้งที่ตรวจแล้วผิด |
| L | `E-CHARGE` | ผิดเรื่องผลรวมประจุ |
| M | `E-PAIR` | ผิดเรื่องการจับคู่ไอออน |
| N | `E-PHASE` | ผิดเรื่องสถานะสาร |
| O | `E-BALANCE` | ผิดเรื่องการดุลสัมประสิทธิ์ |
| P | `E-RATIO` | ผิดเรื่องอัตราส่วนอย่างต่ำ |
| Q | `E-SPECTATOR` | ผิดเรื่องการตัดไอออนผู้ชม |
| R | `startedAt` | เวลาเริ่มเล่นด่าน (ISO 8601) |
| S | `finishedAt` | เวลาเล่นจบด่าน (ISO 8601) |

---

## 2. การติดตั้ง Google Apps Script

1. ใน Google Sheet ให้ไปที่เมนู **ส่วนขยาย (Extensions) → Apps Script**
2. ลบโค้ดเดิมในไฟล์ `Code.gs` ทั้งหมด
3. คัดลอกโค้ดจาก `docs/apps-script/Code.gs` ในโปรเจกต์มาวาง
4. กดบันทึก (Save) โครงการ Apps Script

---

## 3. การนำไปใช้งาน (Deploy as Web App)

1. คลิกปุ่มสีน้ำเงิน **นำไปใช้งาน (Deploy) → การทำให้ใช้งานได้ใหม่ (New deployment)**
2. คลิกเลือกประเภทเป็น **เว็บแอป (Web app)**
3. ตั้งค่าดังนี้:
   - **คำอธิบาย (Description):** `Ion Clash Research Data Endpoint v1`
   - **เรียกใช้ในฐานะ (Execute as):** `ฉัน (Me - your.email@gmail.com)`
   - **ผู้มีสิทธิ์เข้าถึง (Who has access):** `ทุกคน (Anyone)`
4. คลิก **นำไปใช้งาน (Deploy)** และให้สิทธิ์เข้าถึง (Authorize access)
5. คัดลอก **URL ของเว็บแอป (Web App URL)** ที่ลงท้ายด้วย `/exec`

> [!CAUTION]
> **ข้อกำหนดความปลอดภัยที่สำคัญมาก**
> - **ห้าม commit URL ของ Apps Script ลงใน repository สาธารณะเด็ดขาด**
> - ให้นำ URL นี้ไปใส่ในไฟล์ `.env.local` หรือตั้งค่าใน Environment Variables ของ Vercel:
>   ```bash
>   NEXT_PUBLIC_RESEARCH_ENDPOINT="https://script.google.com/macros/s/AKfycb.../exec"
>   ```

---

## 4. การทดสอบการทำงาน

1. เปิดเว็บ Ion Clash ในเครื่องที่มีการตั้งค่า `NEXT_PUBLIC_RESEARCH_ENDPOINT`
2. กรอกชื่อผู้เรียน (เช่น `S01`) และติ๊กยินยอมส่งข้อมูลวิจัย
3. เล่นด่าน 1 จนจบ
4. กลับมาตรวจสอบใน Google Sheet จะต้องมีแถวข้อมูลใหม่ปรากฏขึ้นทันที
