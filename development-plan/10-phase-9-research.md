# Phase 9 · ระบบเก็บข้อมูลวิจัย

> **เป้าหมาย:** เก็บข้อมูลพอคำนวณ E1/E2 และตอบได้ว่านักเรียนพลาดเรื่องอะไรบ่อยที่สุด โดยไม่มี database
> **ต้องรอ:** Phase 7 (ไม่ต้องรอ Phase 8)
> **ที่มา:** frontend spec ไม่มีระบบนี้เลยแม้แต่บรรทัดเดียว แต่ proposal ต้องใช้ ตาม **D-06** และ **D-07**

**ถ้าไม่ทำเฟสนี้ ทดลองเสร็จแล้วจะย้อนกลับมาเก็บข้อมูลไม่ได้** นี่คือเฟสที่พลาดไม่ได้ที่สุดสำหรับวิทยานิพนธ์
ข้อมูลที่ไม่ได้เก็บในวันทดลอง คือข้อมูลที่หายถาวร

---

## อ่านก่อนเริ่ม (บังคับ)

| อ่าน | เพราะ |
|---|---|
| `00-decisions.md` **D-06 · D-07 · D-12 · D-13 · D-14** | นิยามว่าเก็บอะไร คิด E1/E2 ยังไง และทำไมต้องมีชื่อผู้เล่น |
| `99-open-questions.md` **A-03 · A-04 · B-03** | สิ่งที่ต้องให้อาจารย์ยืนยัน และการเตรียม Google Sheet ล่วงหน้า |
| `src/storage/keys.ts` | คีย์ `RESEARCH_KEY = "ion-clash:research:v1"` **มีอยู่แล้ว** ใช้ตัวนี้ ห้ามตั้งใหม่ |
| `src/domain/game/types.ts` — `GameState.errorsByCode` | หัวใจของคำถามวิจัย เก็บอยู่ใน state และใน checkpoint แล้ว |
| `src/architecture.test.ts` ข้อ "มีแต่โฟลเดอร์ storage เท่านั้นที่แตะ localStorage ได้" | **ข้อจำกัดที่จะทำให้เทสต์แดงถ้าเผลอ** — ดูขั้นที่ 2 |

---

## สิ่งที่มีอยู่แล้ว

| มีแล้ว | ใช้ยังไง |
|---|---|
| `GameState.errorsByCode` แยกครบ 6 รหัส และติดไปกับ checkpoint | ข้อมูลวิจัยหลักมีอยู่แล้ว ไม่ต้องเก็บเพิ่ม แค่ดึงออกตอนจบด่าน |
| `selectors.levelResultOf(state, at)` · `scoreOf` · `starsOf` · `elapsedOf` | คะแนน ดาว เวลา คำนวณแล้ว **ห้ามคำนวณใหม่** |
| `save.playerName` ในสคีมา + ขั้นกรอกชื่อจาก Phase 7 | D-14 ทำไปแล้วครึ่งหนึ่ง เฟสนี้เติมส่วนความยินยอม |
| `RESEARCH_KEY` ใน `src/storage/keys.ts` | คีย์สำหรับ LocalSink |
| `getBrowserStorage()` และ `StorageLike` ใน `src/storage/localStorageAdapter.ts` | ทางเดียวที่ได้รับอนุญาตให้เข้าถึง localStorage |

---

## 9.1 สถาปัตยกรรม

```
                    ResearchSink (interface)
                            │
              ┌─────────────┴─────────────┐
              │                           │
        LocalSink                    RemoteSink
   เก็บผ่าน StorageLike           POST → Apps Script
   คัดลอก TSV / ดาวน์โหลด CSV      → Google Sheet
              │                           │
              └─────────────┬─────────────┘
                            │
                   หน้า /research ของผู้วิจัย
                   นำเข้าหลายคน + กรอก E2 + คำนวณ E1/E2
```

ใช้ทั้งสองตัวพร้อมกันตาม D-06 — `LocalSink` เป็นหลักที่ทำงานเสมอ `RemoteSink` เป็นความสะดวกที่**ล้มเหลวได้โดยไม่กระทบการเล่น**

```ts
export interface ResearchSink {
  record(event: ResearchEvent): void;
  flush(): Promise<void>;
}
```

---

## ขั้นตอนการทำงาน

### ขั้นที่ 1 · ชนิดข้อมูลและ CSV/TSV

**สร้าง** `src/research/types.ts`

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
  hintsUsed: number;
  wrongAttempts: number;
  errorsByCode: ErrorTally; // ครบ 6 รหัสเสมอ
};
```

**ไม่เก็บเด็ดขาด:** ชื่อจริงเต็ม โรงเรียน อีเมล หรือข้อมูลระบุตัวบุคคลอื่นใด ตามข้อกำหนด privacy ใน spec

**สร้าง** `src/research/csv.ts`

```ts
export const CSV_COLUMNS = [
  "playerName","levelId","attemptNo","completed","score","stars","elapsedMs",
  "hintsUsed","wrongAttempts",
  "E-CHARGE","E-PAIR","E-PHASE","E-BALANCE","E-RATIO","E-SPECTATOR",
  "startedAt","finishedAt",
] as const;

export function toTsv(events: readonly ResearchEvent[]): string;
export function toCsv(events: readonly ResearchEvent[]): string;   // มี BOM ﻿ นำหน้า
export function parseDelimited(text: string): ResearchEvent[];     // รับทั้ง CSV และ TSV
```

**กติกา**

- `toCsv` ต้องขึ้นต้นด้วย BOM `﻿` ไม่งั้น Excel เปิดแล้วภาษาไทยเป็นตัวขยะ
- ค่าที่มี `,` `"` หรือขึ้นบรรทัดใหม่ ต้องถูก quote และ escape `"` เป็น `""`
- `parseDelimited` ต้อง **ตรวจหัวคอลัมน์** ไม่ใช่เดาจากลำดับ และข้ามแถวที่อ่านไม่ออกโดยไม่ throw

**เทสต์** `csv.test.ts` — round-trip (`parseDelimited(toCsv(x))` เท่ากับ `x`) · BOM มีจริง · ชื่อผู้เล่นที่มีคอมมาไม่ทำให้คอลัมน์เพี้ยน · TSV วางลง Sheets แล้วแตกคอลัมน์ (ทดสอบด้วยการนับ `\t`)

---

### ขั้นที่ 2 · LocalSink — และกับดัก localStorage

**สร้าง** `src/research/sink.ts` (interface + `createCompositeSink`) และ `src/research/localSink.ts`

```ts
export function createLocalSink(storage: StorageLike | null): ResearchSink & {
  readAll(): readonly ResearchEvent[];
  clear(): void;
};
```

> **กับดักที่จะทำให้เทสต์แดงทันที**
> `src/architecture.test.ts` บังคับว่า **มีแต่ไฟล์ใน `src/storage/` เท่านั้นที่เขียนคำว่า `localStorage` ได้**
> `localSink.ts` จึงต้อง **รับ `StorageLike` เข้ามา** และให้ผู้เรียกดึงมาจาก `getBrowserStorage()` ของ `src/storage/`
> ห้ามเขียน `window.localStorage` ใน `src/research/` เด็ดขาด — และอย่าแก้เทสต์ให้กฎอ่อนลง

**พฤติกรรม**

- เก็บสะสมเป็น array ใน `RESEARCH_KEY`
- `storage === null` (ถูกปิดกั้น / อยู่บนเซิร์ฟเวอร์) → เก็บในหน่วยความจำแทน **ไม่ throw**
- เขียนไม่สำเร็จ (quota) → เก็บในหน่วยความจำต่อ และให้ UI แสดงคำเตือน ไม่ทำให้เกมหยุด

**เทสต์** `localSink.test.ts` ด้วย `src/storage/__fixtures__/fakeStorage.ts` — บันทึกแล้วอ่านกลับได้ · storage โยน quota แล้วไม่ throw · `storage === null` ยังทำงาน

---

### ขั้นที่ 3 · RemoteSink + คิวลองใหม่

**สร้าง** `src/research/remoteSink.ts`

```ts
export function createRemoteSink(options: {
  endpoint: string | undefined;   // process.env.NEXT_PUBLIC_RESEARCH_ENDPOINT
  enabled: boolean;               // ผลจากความยินยอม
  storage: StorageLike | null;    // คิวที่ยังส่งไม่สำเร็จ
  fetchImpl?: typeof fetch;       // ฉีดเข้ามาเพื่อเทสต์
}): ResearchSink;
```

| กติกา | รายละเอียด |
|---|---|
| ยิงตอนจบ**ทุกด่าน** | ไม่ใช่ตอนจบทั้ง 50 — เครื่องดับกลางทางแล้วจะเสียข้อมูลทั้งคน |
| fire-and-forget แต่**มีคิว** | ส่งไม่สำเร็จให้เก็บเข้าคิวใน storage แล้วลองใหม่ตอน `flush()` ครั้งถัดไป |
| ห้าม block UI | timeout 5 วินาทีด้วย `AbortController` — เน็ตโรงเรียนช้าแล้วเกมต้องไม่ค้าง |
| `mode: "no-cors"` ใช้ได้ | เราไม่ต้องอ่าน response — ตั้ง CORS ของ Apps Script ยาก |
| `endpoint` ไม่มีค่า หรือ `enabled === false` | sink กลายเป็น no-op เงียบ ๆ ไม่ error ไม่ log ซ้ำ ๆ |

**เทสต์** `remoteSink.test.ts` ด้วย `fetchImpl` ปลอม — ส่งสำเร็จแล้วคิวว่าง · ส่งล้ม 500 แล้ว event เข้าคิว · `flush()` รอบถัดไปส่งซ้ำ · timeout แล้วไม่ throw · `enabled: false` ไม่เรียก fetch เลย

---

### ขั้นที่ 4 · ต่อเข้ากับเกม

**สร้าง** `src/session/ResearchProvider.tsx` — ประกอบ `LocalSink` + `RemoteSink` เข้าเป็น composite แล้วให้ `useResearch()`

**แก้** `src/session/useLevelGame.ts` — เมื่อ `phase` เปลี่ยนเป็น `levelComplete` ให้ประกอบ `ResearchEvent` จาก:
`save.playerName` · `save.installId` · `state.levelId` · `attempts` จาก `save.completedLevels[id]` · `levelResultOf(state, at)` · `state.hintsUsed` · `state.wrongAttempts` · `state.errorsByCode`

**ต้องยิงครั้งเดียวต่อการจบด่านหนึ่งครั้ง** — ใช้ ref กันยิงซ้ำเมื่อ component re-render
มีเทสต์ยืนยันว่า render ซ้ำ 3 รอบแล้ว `record` ถูกเรียกครั้งเดียว

> **ห้ามให้ระบบวิจัยพังแล้วเกมพังตาม** — ห่อการยิงด้วย `try/catch` และอย่าให้ error หลุดขึ้นไปถึง React

---

### ขั้นที่ 5 · ความยินยอม

`RemoteSink` ส่งข้อมูลออกเครือข่ายจริง ซึ่ง spec เดิมห้ามไว้ จึงต้องขอความยินยอมก่อน

- แสดง **ครั้งเดียว** ตอนกรอกชื่อผู้เล่นในหน้าแรก (ต่อจากงาน Phase 7)
- บอกชัดว่าเก็บอะไร: **ชื่อที่กรอก** คะแนน เวลา และจำนวนครั้งที่ตอบผิด
- บอกว่าเก็บไปทำอะไร: ใช้ในงานวิจัยเพื่อประเมินสื่อการเรียนรู้
- **ปฏิเสธได้** ถ้าปฏิเสธให้ปิด `RemoteSink` แต่ `LocalSink` ยังทำงาน และเล่นเกมได้ครบทุกอย่าง
- เก็บผลลงเซฟเป็นฟิลด์ใหม่ `settings.researchConsent: boolean` → **ต้องเพิ่มใน `settingsSchema`**
  ค่าเดิมที่ไม่มีฟิลด์นี้ต้องถูก `normalizeSave` เติมให้เป็น `false` **ไม่ใช่ปฏิเสธไฟล์เซฟ** (นโยบาย repair-not-reject ของ Phase 3)
- เปลี่ยนใจได้ที่ `/settings`

**เทสต์** — เซฟเวอร์ชันเก่าที่ไม่มี `researchConsent` โหลดได้และได้ `false`

---

### ขั้นที่ 6 · ปุ่มส่งออกในหน้า `/progress`

- **ปุ่มคัดลอกผลการเรียน** (TSV) — เด่นกว่าปุ่มดาวน์โหลด
- **ปุ่มดาวน์โหลด CSV** — ชื่อไฟล์ `ion-clash-research-<ชื่อ>-YYYY-MM-DD.csv`
- เด้งเตือนให้กดคัดลอกเมื่อจบด่าน 50

> **ทำไมคัดลอกสำคัญกว่าดาวน์โหลด** บน iPad การหาไฟล์ที่ดาวน์โหลดแล้วเพื่อส่งต่อยากมาก
> แต่คัดลอกแล้ววางลง Google Form จบใน 5 วินาที — ให้ปุ่มคัดลอกเด่นกว่าเสมอ

`navigator.clipboard.writeText` ล้มเหลวได้บน iOS ถ้าไม่ได้เรียกจาก user gesture โดยตรง
**ต้องมีทางสำรอง**: แสดง `<textarea>` ที่เลือกข้อความไว้แล้วให้ผู้ใช้กดคัดลอกเอง

---

### ขั้นที่ 7 · Google Apps Script

เก็บโค้ดไว้ที่ `docs/apps-script/Code.gs`

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

**ขั้นตอนติดตั้ง** (เขียนลง `docs/research-setup.md` ทีละขั้นพร้อมภาพ)
สร้าง Google Sheet ใหม่ → Extensions → Apps Script → วางโค้ด → Deploy as Web app →
Execute as **Me** · Who has access **Anyone** → คัดลอก URL ไปใส่ใน Vercel environment variable

> **ห้าม commit URL ลง repo** เพราะ repo เป็น public ใครก็ยิงข้อมูลขยะเข้า Sheet ได้
> **เพิ่มเทสต์** ที่ `grep` ทั้ง repo หา `script.google.com` แล้วต้องไม่เจอ

---

### ขั้นที่ 8 · หน้า `/research`

หน้าสำหรับผู้วิจัย **ไม่ลิงก์จากเมนูหลัก** เข้าได้ด้วยการพิมพ์ URL ตรง

| ส่วน | หน้าที่ |
|---|---|
| นำเข้า | วาง TSV หรืออัปโหลด CSV ได้หลายไฟล์ รวมเป็นตารางเดียว (ตัดแถวซ้ำด้วย `installId + levelId + attemptNo`) |
| ตารางรายด่าน | ทุก event ที่นำเข้า กรองตามชื่อผู้เล่นได้ |
| สรุปรายคน | คะแนนรวมระหว่างเรียน เวลารวม ด่านที่เล่นจบ |
| กรอก E2 | ช่องกรอกคะแนนหลังเรียนของแต่ละคนจากแบบทดสอบกระดาษ + ช่องกรอกคะแนนเต็ม |
| ผล E1/E2 | คำนวณและแสดงพร้อมเทียบเกณฑ์ 80/80 |
| สถิติข้อผิดพลาด | ตารางและกราฟแท่งว่ารหัสใดพบบ่อยที่สุด (SVG เขียนเอง ไม่เพิ่ม dependency) |
| ส่งออก | CSV รวมทุกคนสำหรับใส่ในเล่มวิทยานิพนธ์ |

**สร้าง** `src/research/stats.ts` — ฟังก์ชันบริสุทธิ์ทั้งหมด

```
E1 ของผู้เรียนคนหนึ่ง = ผลรวมคะแนนของด่านที่เล่นจบ / (จำนวนด่านที่เล่นจบ × 100) × 100
E1 รวม                = ค่าเฉลี่ยของ E1 รายคน

E2 ของผู้เรียนคนหนึ่ง = คะแนนแบบทดสอบหลังเรียน / คะแนนเต็ม × 100
E2 รวม                = ค่าเฉลี่ยของ E2 รายคน

เกณฑ์ 80/80
```

**ต้องแสดงจำนวนด่านที่เล่นจบเสมอ** เพราะ E1 ของคนที่เล่น 10 ด่านกับคนที่เล่น 50 ด่านเทียบกันตรง ๆ ไม่ได้
ข้อมูลนี้ต้องเขียนลงเล่มวิทยานิพนธ์ด้วย (D-13)

| ชื่อผู้เล่น | ด่านที่เล่นจบ | คะแนนรวม | E1 รายคน | คะแนน E2 (กรอกมือ) | E2 รายคน |
|---|---|---|---|---|---|
| … | 32 | 2,720 | 85.0 | 24/30 | 80.0 |

**เทสต์** `stats.test.ts` — ตรวจด้วยตัวเลขที่คำนวณมือได้ อย่างน้อย 3 ชุด: คนเดียวเล่น 1 ด่าน · 8 คนเล่นไม่เท่ากัน · กรณีไม่มี event เลย (ต้องไม่หารด้วยศูนย์)

---

### ขั้นที่ 9 · ซ้อมจริงหนึ่งรอบ

**ห้ามข้าม และห้ามเลื่อนไป Phase 11**

1. deploy preview ที่ตั้ง `NEXT_PUBLIC_RESEARCH_ENDPOINT` จริง
2. เล่นจบ 2 ด่าน แล้วเปิด Google Sheet ดูว่ามีแถวเข้ามาจริง
3. ปิดเน็ต เล่นจบอีกด่าน แล้วเปิดเน็ต — แถวที่ค้างต้องเข้าไปในรอบถัดไป
4. กดคัดลอก TSV แล้ววางลง Google Sheets จริง ดูว่าแตกคอลัมน์ถูก
5. ดาวน์โหลด CSV แล้วเปิดใน Excel จริง ดูว่าภาษาไทยไม่เพี้ยน

---

## ไฟล์ที่จะสร้าง

```
src/research/
├── types.ts             ResearchEvent
├── sink.ts              interface + composite
├── localSink.ts         รับ StorageLike เข้ามา (ห้ามแตะ localStorage ตรง ๆ)
├── remoteSink.ts        POST + คิวลองใหม่ + timeout
├── csv.ts               TSV/CSV serialize + parse (มี BOM)
└── stats.ts             E1/E2 + สถิติข้อผิดพลาด

src/session/ResearchProvider.tsx
src/app/research/page.tsx
docs/apps-script/Code.gs
docs/research-setup.md
```

---

## Definition of Done

- [ ] เล่นจบด่านแล้วมี `ResearchEvent` เก็บครบทุกฟิลด์ รวม `errorsByCode` ทั้ง 6 รหัส
- [ ] ยิงครั้งเดียวต่อการจบด่านหนึ่งครั้ง แม้ component จะ re-render หลายรอบ
- [ ] คัดลอก TSV แล้ววางใน Google Sheets จริง แตกคอลัมน์ถูกต้อง
- [ ] ดาวน์โหลด CSV แล้วเปิดใน Excel จริง ภาษาไทยไม่เพี้ยน (มี BOM)
- [ ] ปิดเน็ตแล้วเล่นต่อได้ event เข้าคิว และยิงสำเร็จเมื่อเน็ตกลับมา
- [ ] Apps Script รับข้อมูลและเขียนลง Sheet ได้จริง — **ทดสอบแล้ว ไม่ใช่แค่เขียนโค้ดไว้**
- [ ] `/research` นำเข้า 8 ไฟล์แล้วคำนวณ E1/E2 ถูกต้อง ตรวจตรงกับการคำนวณมือ
- [ ] ปฏิเสธความยินยอมแล้วยังเล่นเกมได้ครบทุกฟังก์ชัน และไม่มี request ออกไปเลย
- [ ] เซฟเวอร์ชันเก่าที่ไม่มี `researchConsent` ยังโหลดได้
- [ ] เทสต์ยืนยันว่าไม่มี URL ของ Apps Script อยู่ใน repo
- [ ] `src/research/` ไม่มีคำว่า `localStorage` — `architecture.test.ts` ยังเขียว
- [ ] `npm run lint && npm run typecheck && npm test && npm run build` ผ่านครบ 4

---

## กับดักที่ต้องระวัง

| กับดัก | ผลที่ตามมา |
|---|---|
| เขียน `localStorage` ตรง ๆ ใน `src/research/` | `architecture.test.ts` แดงทันที — ต้องรับ `StorageLike` เข้ามา |
| commit URL Apps Script ลง repo public | ใครก็ยิงข้อมูลปลอมเข้า Sheet ได้ ข้อมูลวิจัยเสียหาย |
| ส่งข้อมูลตอนจบทั้ง 50 ด่านครั้งเดียว | เครื่องดับกลางทางแล้วเสียข้อมูลทั้งคน |
| ให้ RemoteSink block UI | เน็ตโรงเรียนช้า เกมค้าง นักเรียนเล่นไม่ได้ |
| CSV ไม่ใส่ BOM | เปิดใน Excel แล้วภาษาไทยเป็นตัวขยะ |
| ลืม `errorsByCode` | ข้อมูลที่ตอบคำถามวิจัยหลักหายทั้งงาน กู้ไม่ได้ |
| ยิง event ซ้ำทุก re-render | Sheet มีแถวซ้ำ E1 เพี้ยน |
| ปฏิเสธความยินยอมแล้วเซฟไฟล์เก่าใช้ไม่ได้ | นักเรียนเปิดเว็บไม่ได้กลางการทดลอง |
| ลืมทดสอบ Apps Script ก่อนวันจริง | วันทดลองพังแล้วแก้ไม่ทัน ต้องซ้อมเต็มรูปแบบล่วงหน้า |
| ให้ระบบวิจัยพังแล้วเกมพังตาม | นักเรียนเล่นไม่ได้เพราะเรื่องที่ไม่เกี่ยวกับการเรียน |

---

## พิธีปิดเฟส

1. `npm run lint && npm run typecheck && npm test && npm run build` ผ่านครบ 4
2. `npm run test:e2e` ยังผ่าน
3. เขียนบล็อกสถานะต้นไฟล์นี้ — ระบุ **วันที่ซ้อมยิงข้อมูลจริงเข้า Sheet** และผลที่ได้
4. อัปเดต `README.md` ของ development-plan · `CLAUDE.md` · `docs/assumptions.md` (การเก็บชื่อผู้เล่น + การส่งข้อมูลออกเครือข่าย ต่างจาก spec เดิม)
5. commit + push แล้วรอ CI เขียว
