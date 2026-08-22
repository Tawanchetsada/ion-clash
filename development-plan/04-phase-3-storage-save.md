# Phase 3 · ระบบบันทึกความก้าวหน้า

> **เป้าหมาย:** เซฟ โหลด กู้คืน ส่งออก นำเข้า และรีเซ็ตได้ครบ โดยพังยังไงเกมก็ไม่ล่ม
> **ต้องรอ:** Phase 0 (ทำคู่ขนานกับ Phase 1-2 ได้ เพราะไม่พึ่งข้อมูลเคมี)
> **กฎเหล็ก:** ห้ามเรียก `window.localStorage` นอกโฟลเดอร์ `src/storage/` และห้ามเรียกระหว่าง SSR

---

## 3.1 สัญญาหลัก

`src/storage/repository.ts`

```ts
export interface GameSaveRepository {
  load(): GameSaveV1;
  save(next: GameSaveV1): SaveResult;
  reset(): void;
  exportJson(): Blob;
  importJson(text: string): ImportResult;
}

export type SaveResult =
  | { ok: true }
  | { ok: false; reason: 'quota' | 'security' | 'serialize' | 'unknown' };
```

UI และ game reducer เห็นแค่ interface นี้เท่านั้น การแยกแบบนี้คือเหตุผลเดียวที่ Phase 2 ของงานวิจัย (Cloud Save) จะเพิ่มได้โดยไม่ต้องรื้อเกม

---

## 3.2 Schema

`src/storage/schema.ts` ใช้ Zod ทั้งหมด เพื่อให้ตรวจตอน runtime ได้จริง ไม่ใช่แค่ type ตอน compile

```ts
export type LevelProgress = {
  completed: boolean;
  bestScore: number;        // 0..100
  stars: 0 | 1 | 2 | 3;
  bestTimeMs: number | null;
  attempts: number;
  completedAt: string | null;   // ISO 8601
};

export type GameSaveV1 = {
  version: 1;
  installId: string;            // UUID สุ่มบนเครื่อง
  playerName: string;           // ชื่อผู้เล่นที่กรอกก่อนเริ่ม (D-14)
  unlockedLevel: number;        // 1..50
  completedLevels: Record<string, LevelProgress>;
  lastPlayedLevel: number;      // 1..50
  activeCheckpoint: LevelCheckpoint | null;
  settings: { sound: boolean; music: boolean; reducedMotion: boolean };
  createdAt: string;
  updatedAt: string;
};
```

`playerName` ติดไปกับ export และ import ด้วย ทำให้ผู้วิจัยรู้ว่าไฟล์ที่ได้มาเป็นของใครโดยไม่ต้องถามซ้ำ

**สิ่งที่ต้องตรวจนอกเหนือจากรูปร่าง:** `unlockedLevel` อยู่ในช่วง 1-50 · `bestScore` อยู่ในช่วง 0-100 · `stars` สอดคล้องกับ `bestScore` ตามเกณฑ์ · key ใน `completedLevels` เป็นเลขด่านที่มีจริง

---

## 3.3 Checkpoint กลางด่าน

เก็บ**ความหมาย** ไม่เก็บพิกัด

```ts
export type LevelCheckpoint = {
  levelId: number;
  state: 'arrangeProductIons' | 'balanceEquation' | 'validateProducts' | 'cancelSpectatorIons';
  slotAssignments: Array<{ slotId: string; ionInstanceId: string | null }>;
  coefficients: [number | null, number | null, number | null, number | null];
  canceledPairs: Array<{ leftInstanceId: string; rightInstanceId: string }>;
  hintsUsed: number;
  wrongAttempts: number;
  elapsedMs: number;
  savedAt: string;
};
```

**ห้ามบันทึกเด็ดขาด:** พิกัด x/y ของการ์ด · DOM id · React state ที่สร้างใหม่ได้ · สถานะแอนิเมชัน · ข้อความเฉลยที่ยังไม่ปลดล็อก

> เหตุผล: ข้อมูลพวกนี้เปราะและทำให้ migration เป็นฝันร้าย ถ้าเก็บพิกัดไว้ วันที่เปลี่ยน layout ทั้ง checkpoint จะใช้ไม่ได้ทันที

---

## 3.4 จังหวะ autosave

| เหตุการณ์ | ดีเลย์ |
|---|---|
| ผ่าน validation ของแต่ละขั้น | ทันที |
| เปลี่ยนสัมประสิทธิ์ หรือจัดช่องครบ | debounce 300-500 ms |
| เพิ่มหรือยกเลิกคู่ไอออนผู้ชม | ทันที |
| จบด่าน ปลดล็อกด่านถัดไป เปลี่ยน settings | ทันที |
| ก่อนออกจาก route ของด่าน | ทันที |
| `document.visibilityState` เปลี่ยนเป็น hidden | ทันที |

> **อย่าพึ่ง `beforeunload` อย่างเดียว** เพราะ Safari บน iOS ไม่ยิง event นี้อย่างน่าเชื่อถือ ต้องใช้ `visibilitychange` เป็นหลัก ซึ่งสำคัญมากเพราะ iPad คือจอหลักของงานนี้

---

## 3.5 โหลด ตรวจ และกู้คืน

```
อ่าน localStorage
   |
   +-- ไม่มีข้อมูล ------------> สร้าง default save
   |
   +-- JSON parse ไม่ผ่าน -----> คัดลอกค่าดิบไป ion-clash:save:corrupt:<timestamp>
   |                              แล้วสร้าง default + แจ้งผู้ใช้ + เสนอ import
   |
   +-- schema ไม่ผ่าน ---------> เหมือนกรณีข้างบน
   |
   +-- version เก่ากว่า -------> วิ่ง migration (ฟังก์ชันบริสุทธิ์ + มีเทสต์)
   |
   +-- ผ่านหมด ---------------> ใช้งาน
```

**คีย์ที่ใช้ทั้งหมด**

| คีย์ | บทบาท |
|---|---|
| `ion-clash:save:v1` | ข้อมูลหลัก |
| `ion-clash:save:backup:v1` | สำเนาก่อนเขียนทับ อย่างน้อย 1 ชุด |
| `ion-clash:save:corrupt:<timestamp>` | ค่าดิบที่พัง เก็บไว้กู้ทีหลัง |
| `ion-clash:research:v1` | event log งานวิจัย (Phase 9) |

**กรณี storage ถูกปิดกั้น** เช่นโหมดส่วนตัวหรือ `QuotaExceededError` ต้องคืน `SaveResult` แบบ error แล้วให้เกม**เล่นต่อได้ใน session** พร้อมแบนเนอร์เตือนและปุ่มส่งออกข้อมูล ห้าม throw จนเกมล่ม

---

## 3.6 ส่งออก นำเข้า รีเซ็ต

- **Export** ตั้งชื่อไฟล์ `ion-clash-save-YYYY-MM-DD.json` จาก save ที่ผ่าน validation แล้ว
- **Import** ต้องแสดง preview ก่อนยืนยัน คือจำนวนด่านที่ผ่าน ด่านสูงสุด และวันที่แก้ไขล่าสุด
- **กลยุทธ์ merge เริ่มต้น** `completed` ใช้ OR · คะแนน ดาว ด่านสูงสุด ใช้ max · `bestTimeMs` ใช้ค่าต่ำสุดที่ไม่เป็น null
- **Reset** ต้องพิมพ์คำว่า `RESET` หรือยืนยันสองขั้น และบอกชัดว่ากู้คืนไม่ได้ถ้าไม่มีไฟล์ export

**หลายแท็บ** ฟัง `storage` event แล้ว merge โดยเลือกคะแนนที่ดีกว่าและ `unlockedLevel` ที่สูงกว่าเสมอ ความก้าวหน้าต้องไม่ลดลงไม่ว่ากรณีใด

---

## ไฟล์ที่จะสร้าง

```
src/storage/
├── schema.ts                Zod schema + type
├── repository.ts            interface + factory
├── localStorageAdapter.ts   การอ่านเขียนจริง
├── migration.ts             migrateV1ToV2 และรุ่นต่อ ๆ ไป
├── merge.ts                 กลยุทธ์รวมข้อมูล
└── defaults.ts              createDefaultSave()
```

---

## Definition of Done

- [ ] default save ปลดล็อกเฉพาะด่าน 1
- [ ] ผ่านด่าน 1 แล้ว `unlockedLevel` เป็น 2 · ผ่านด่าน 50 แล้วไม่เกิน 50
- [ ] replay แล้ว `bestScore` และ `bestStars` ไม่ลดลง · `bestTimeMs` ใช้ค่าที่ดีกว่า · `attempts` เพิ่มทุกครั้ง
- [ ] JSON พัง version ผิด ค่านอกช่วง และ quota error ทั้งหมดไม่ทำให้ crash
- [ ] export แล้ว import กลับได้ข้อมูลเท่าเดิม
- [ ] migration และ multi-tab merge ไม่ทำให้ความก้าวหน้าลดลง
- [ ] `grep -r "localStorage" src/` เจอเฉพาะในโฟลเดอร์ `src/storage/`

---

## กับดักที่ต้องระวัง

| กับดัก | ผลที่ตามมา |
|---|---|
| อ่าน localStorage ตอน Server Render | Next.js พังทันทีเพราะไม่มี window บนเซิร์ฟเวอร์ ต้องอ่านใน effect หลัง mount เท่านั้น |
| ใช้ `beforeunload` อย่างเดียว | iPad ปิดแท็บแล้วข้อมูลหาย ต้องมี `visibilitychange` |
| debounce แล้วไม่ flush ตอนออกจากหน้า | ผู้เล่นกดออกภายใน 500 ms แล้วข้อมูลหาย ต้อง flush ทันทีตอน unmount |
| เขียนทับ save โดยไม่มี backup | ถ้า serialize ผิดพลาดกลางทาง ข้อมูลหายถาวร |
| ตรวจ schema แค่ตอน import | ข้อมูลใน localStorage ก็เสียได้เอง ต้องตรวจทุกครั้งที่ load |
| merge หลายแท็บแล้ว unlockedLevel ลดลง | ผู้เล่นเสียความก้าวหน้าโดยไม่รู้ตัว ต้องใช้ max เสมอ |
