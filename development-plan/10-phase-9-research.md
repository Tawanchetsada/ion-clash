# Phase 9 · ระบบเก็บข้อมูลวิจัย

> **เป้าหมาย:** เก็บข้อมูลพอคำนวณ E1/E2 และตอบได้ว่านักเรียนพลาดเรื่องอะไรบ่อยที่สุด โดยไม่มี database
> **ต้องรอ:** Phase 7
> **ที่มา:** frontend spec ไม่มีระบบนี้เลยแม้แต่บรรทัดเดียว แต่ proposal ต้องใช้ ตาม D-06 และ D-07

**ถ้าไม่ทำ phase นี้ ทดลองเสร็จแล้วจะย้อนกลับมาเก็บข้อมูลไม่ได้** นี่คือ phase ที่พลาดไม่ได้ที่สุดสำหรับวิทยานิพนธ์

---

## 9.1 สถาปัตยกรรม

```
                    ResearchSink (interface)
                            |
              +-------------+-------------+
              |                           |
        LocalSink                    RemoteSink
   เก็บ localStorage              POST -> Apps Script
   คัดลอก / ดาวน์โหลด CSV         -> Google Sheet
              |                           |
              +-------------+-------------+
                            |
                   หน้า /research ของผู้วิจัย
                   นำเข้าหลายคน + กรอก E2 + คำนวณ E1/E2
```

ใช้ทั้งสองตัวพร้อมกันตาม D-06 `LocalSink` เป็นหลักที่ทำงานเสมอ `RemoteSink` เป็นความสะดวกที่ล้มเหลวได้โดยไม่กระทบการเล่น

```ts
export interface ResearchSink {
  record(event: ResearchEvent): void;
  flush(): Promise<void>;
}
```

---

## 9.2 ข้อมูลที่เก็บ

```ts
export type ResearchEvent = {
  playerName: string;       // ชื่อผู้เล่นที่กรอกก่อนเริ่ม (D-14)
  installId: string;
  levelId: number;
  attemptNo: number;
  startedAt: string;        // ISO 8601
  finishedAt: string | null;
  elapsedMs: number;
  completed: boolean;
  score: number;            // 0..100
  stars: 0 | 1 | 2 | 3;
  hintsUsed: 0 | 1 | 2 | 3;
  wrongAttempts: number;
  errorsByCode: {           // หัวใจของคำถามวิจัย
    'E-CHARGE': number;
    'E-PAIR': number;
    'E-PHASE': number;
    'E-BALANCE': number;
    'E-RATIO': number;
    'E-SPECTATOR': number;
  };
};
```

`errorsByCode` คือสิ่งที่ตอบคำถามใน proposal บทที่ 1 ว่า "ลักษณะข้อผิดพลาดที่พบบ่อย" ซึ่งเป็นข้อมูลที่ proposal ระบุว่าต้องเก็บ

**ไม่เก็บเด็ดขาด** ชื่อจริง โรงเรียน อีเมล หรือข้อมูลระบุตัวบุคคลใด ๆ ตามข้อกำหนด privacy ใน spec

---

## 9.3 ชื่อผู้เล่น

ตาม **D-14** เก็บชื่อผู้เล่นเพื่อแยกข้อมูลรายคน ซึ่งจำเป็นต่อการคิด E1 รายคนตาม D-13

- หน้าแรกมีขั้นกรอกชื่อผู้เล่นก่อนกดเริ่มเกม
- เก็บใน `GameSaveV1.playerName` ไม่ใช่คีย์แยก เพื่อให้ติดไปกับ export และ import ด้วย
- ใต้ช่องกรอกเขียนกำกับว่า **แนะนำให้ใช้ชื่อเล่นหรือรหัสนิสิต ไม่ต้องใส่ชื่อจริงเต็ม**
- แสดงชื่อค้างไว้ที่มุมจอ เพื่อกันกรอกผิดแล้วไม่รู้ตัว
- แก้ชื่อได้ที่ `/settings`

> **ต่างจาก spec เดิม** spec เขียนว่าไม่เก็บชื่อใน MVP การเก็บชื่อจึงต้องมาพร้อมหน้าขอความยินยอมที่ระบุชัด และต้องบันทึกไว้ใน `docs/assumptions.md`

## 9.4 LocalSink

- เก็บสะสมใน `ion-clash:research:v1` เป็น array ของ event
- **ปุ่มคัดลอกผลการเรียน** คัดลอกเป็น **TSV** เพราะวางลง Google Sheets หรือ Google Form แล้วแตกคอลัมน์ให้อัตโนมัติ
- **ปุ่มดาวน์โหลด CSV** ตั้งชื่อ `ion-clash-research-<ชื่อ>-YYYY-MM-DD.csv`
- ปุ่มทั้งสองอยู่ในหน้า `/progress` และเด้งเตือนเมื่อจบด่าน 50

> **ทำไมคัดลอกสำคัญกว่าดาวน์โหลด** บน iPad การหาไฟล์ที่ดาวน์โหลดแล้วเพื่อส่งต่อยากมาก แต่คัดลอกแล้ววางลง Google Form จบใน 5 วินาที ให้ปุ่มคัดลอกเด่นกว่า

**คอลัมน์ CSV** `playerName, levelId, attemptNo, completed, score, stars, elapsedMs, hintsUsed, wrongAttempts, E-CHARGE, E-PAIR, E-PHASE, E-BALANCE, E-RATIO, E-SPECTATOR, startedAt, finishedAt`

---

## 9.5 RemoteSink และ Google Apps Script

**ฝั่งเว็บ**

- POST ไปที่ `process.env.NEXT_PUBLIC_RESEARCH_ENDPOINT`
- ยิงตอนจบด่านทุกด่าน ไม่ใช่ตอนจบทั้งหมด เพื่อไม่ให้เสียข้อมูลถ้าเครื่องดับกลางทาง
- **fire-and-forget แต่มีคิว** ถ้ายิงไม่สำเร็จให้เก็บเข้าคิวใน localStorage แล้วลองใหม่ตอนจบด่านถัดไป
- ห้าม block UI ห้ามทำให้เกมค้างถ้าเน็ตช้า ตั้ง timeout 5 วินาที
- ใช้ `mode: 'no-cors'` ได้ถ้า CORS ตั้งยาก เพราะเราไม่ต้องอ่าน response

**ฝั่ง Apps Script** เก็บโค้ดไว้ที่ `docs/apps-script/Code.gs`

```js
function doPost(e) {
  const sheet = SpreadsheetApp.openById('SHEET_ID').getSheetByName('events');
  const d = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(), d.playerName, d.levelId, d.attemptNo, d.completed,
    d.score, d.stars, d.elapsedMs, d.hintsUsed, d.wrongAttempts,
    d.errorsByCode['E-CHARGE'], d.errorsByCode['E-PAIR'],
    d.errorsByCode['E-PHASE'], d.errorsByCode['E-BALANCE'],
    d.errorsByCode['E-RATIO'], d.errorsByCode['E-SPECTATOR'],
    d.startedAt, d.finishedAt,
  ]);
  return ContentService.createTextOutput('ok');
}
```

**ขั้นตอนติดตั้ง** สร้าง Google Sheet ใหม่ -> Extensions -> Apps Script -> วางโค้ด -> Deploy as Web app -> Execute as **Me** และ Who has access **Anyone** -> คัดลอก URL ไปใส่ใน Vercel environment variable

> **ห้าม commit URL ลง repo** เพราะ repo เป็น public ใครก็ยิงข้อมูลขยะเข้า Sheet ได้ ให้ใส่ผ่าน Vercel dashboard เท่านั้น

---

## 9.6 ความยินยอม

`RemoteSink` ส่งข้อมูลออกเครือข่ายจริง ซึ่ง spec เดิมห้ามไว้ จึงต้องมีหน้าขอความยินยอมก่อนเริ่ม

- แสดงครั้งเดียวตอนกรอกชื่อผู้เล่น
- บอกชัดว่าเก็บอะไร **ชื่อที่กรอก** คะแนน เวลา และจำนวนครั้งที่ตอบผิด
- บอกว่าเก็บไปทำอะไร ใช้ในงานวิจัยเพื่อประเมินสื่อการเรียนรู้
- ปฏิเสธได้ ถ้าปฏิเสธให้ปิด `RemoteSink` แต่ `LocalSink` ยังทำงาน และเล่นเกมได้ครบทุกอย่าง

---

## 9.7 หน้า /research

หน้าสำหรับผู้วิจัย ไม่ลิงก์จากเมนูหลัก เข้าได้ด้วยการพิมพ์ URL ตรง

| ส่วน | หน้าที่ |
|---|---|
| นำเข้า | วาง TSV หรืออัปโหลด CSV ได้หลายไฟล์ รวมเป็นตารางเดียว |
| ตารางรายด่าน | ทุก event ที่นำเข้า กรองตามชื่อผู้เล่นได้ |
| สรุปรายคน | คะแนนรวมระหว่างเรียน เวลารวม ด่านที่ผ่าน |
| กรอก E2 | ช่องกรอกคะแนนหลังเรียนของแต่ละคนจากแบบทดสอบกระดาษ + ช่องกรอกคะแนนเต็ม |
| ผล E1/E2 | คำนวณและแสดงพร้อมเทียบเกณฑ์ 80/80 |
| สถิติข้อผิดพลาด | ตารางและกราฟแท่งว่ารหัสข้อผิดพลาดใดพบบ่อยที่สุด |
| ส่งออก | CSV รวมทุกคนสำหรับใส่ในเล่มวิทยานิพนธ์ |

**สูตรที่ใช้ ตาม D-12 และ D-13**

คะแนนระหว่างเรียนคือ **คะแนนเกม 0-100 ที่หักคำใบ้และการตอบผิดแล้ว** และคิด **รายด่าน** ไม่ต้องรอครบ 50

```
E1 ของผู้เรียนคนหนึ่ง = ผลรวมคะแนนของด่านที่เล่นจบ / (จำนวนด่านที่เล่นจบ x 100) x 100
E1 รวม                = ค่าเฉลี่ยของ E1 รายคน

E2 ของผู้เรียนคนหนึ่ง = คะแนนแบบทดสอบหลังเรียน / คะแนนเต็ม x 100
E2 รวม                = ค่าเฉลี่ยของ E2 รายคน

เกณฑ์ 80/80
```

**ตารางที่หน้า /research ต้องแสดง**

| ชื่อผู้เล่น | ด่านที่เล่นจบ | คะแนนรวม | E1 รายคน | คะแนน E2 (กรอกมือ) | E2 รายคน |
|---|---|---|---|---|---|
| ... | 32 | 2,720 | 85.0 | 24/30 | 80.0 |

**ต้องแสดงจำนวนด่านที่เล่นจบเสมอ** เพราะ E1 ของคนที่เล่น 10 ด่านกับคนที่เล่น 50 ด่านเทียบกันตรง ๆ ไม่ได้ ข้อมูลนี้ต้องเขียนลงเล่มวิทยานิพนธ์ด้วย

---

## ไฟล์ที่จะสร้าง

```
src/research/
├── types.ts             ResearchEvent
├── sink.ts              interface + composite sink
├── localSink.ts         localStorage + TSV + CSV
├── remoteSink.ts        POST + คิวลองใหม่
├── csv.ts               serialize และ parse
└── stats.ts             คำนวณ E1/E2 และสถิติข้อผิดพลาด

src/app/research/page.tsx
docs/apps-script/Code.gs
docs/research-setup.md    คู่มือติดตั้ง Apps Script
```

---

## Definition of Done

- [ ] เล่นจบด่านแล้วมี event เก็บครบทุกฟิลด์
- [ ] คัดลอก TSV แล้ววางใน Google Sheets แตกคอลัมน์ถูกต้อง
- [ ] ดาวน์โหลด CSV แล้วเปิดใน Excel ภาษาไทยไม่เพี้ยน (ต้องมี BOM)
- [ ] ปิดเน็ตแล้วเล่นต่อได้ และ event เข้าคิว ยิงสำเร็จเมื่อเน็ตกลับมา
- [ ] Apps Script รับข้อมูลและเขียนลง Sheet ได้จริง ทดสอบแล้ว
- [ ] หน้า `/research` นำเข้า 8 ไฟล์แล้วคำนวณ E1/E2 ถูกต้อง ตรวจด้วยการคำนวณมือ
- [ ] ปฏิเสธความยินยอมแล้วยังเล่นเกมได้ครบทุกฟังก์ชัน
- [ ] `grep` ยืนยันว่าไม่มี URL ของ Apps Script อยู่ใน repo

---

## กับดักที่ต้องระวัง

| กับดัก | ผลที่ตามมา |
|---|---|
| commit URL Apps Script ลง repo public | ใครก็ยิงข้อมูลปลอมเข้า Sheet ได้ ข้อมูลวิจัยเสียหาย |
| ส่งข้อมูลตอนจบทั้ง 50 ด่านครั้งเดียว | เครื่องดับกลางทางแล้วเสียข้อมูลทั้งคน |
| ให้ RemoteSink block UI | เน็ตโรงเรียนช้า เกมค้าง นักเรียนเล่นไม่ได้ |
| CSV ไม่ใส่ BOM | เปิดใน Excel แล้วภาษาไทยเป็นตัวขยะ |
| เก็บ errorsByCode ทีหลัง | ข้อมูลที่ตอบคำถามวิจัยหลักหายทั้งงาน |
| ลืมทดสอบ Apps Script ก่อนวันจริง | วันทดลองพังแล้วแก้ไม่ทัน ต้องซ้อมเต็มรูปแบบล่วงหน้า |
| ให้ระบบวิจัยพังแล้วเกมพังตาม | นักเรียนเล่นไม่ได้เพราะเรื่องที่ไม่เกี่ยวกับการเรียน |
