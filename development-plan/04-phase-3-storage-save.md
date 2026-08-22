# Phase 3 · ระบบบันทึกความก้าวหน้า

> **เป้าหมาย:** เซฟ โหลด กู้คืน ส่งออก นำเข้า และรีเซ็ตได้ครบ โดยพังยังไงเกมก็ไม่ล่ม
> **ต้องรอ:** Phase 0 (ทำคู่ขนานกับ Phase 1-2 ได้ เพราะไม่พึ่งข้อมูลเคมี)
> **กฎเหล็ก:** ห้ามเรียก `window.localStorage` นอกโฟลเดอร์ `src/storage/` และห้ามเรียกระหว่าง SSR

---

## สถานะ: เสร็จแล้ว ✅

**ไฟล์:** `src/config/scoring.ts` · `src/storage/` (keys, schema, defaults, migration,
merge, progress, localStorageAdapter, repository, autosave) + เทสต์คู่กันทุกไฟล์ ·
`src/architecture.test.ts` (ย้ายมาจาก `src/domain/chemistry/`)

`npm run lint && npm run typecheck && npm test && npm run build` ผ่านครบ 4 —
รวม **731 เทสต์** (เพิ่มจาก 627 ของ Phase 2 อีก 104 ข้อ)

### จุดสำคัญที่สุด — `stars` ที่ไม่ตรงกับ `bestScore` ต้องซ่อม ไม่ใช่ปฏิเสธ

ข้อ 3.2 เขียนไว้ว่าให้ตรวจ "`stars` สอดคล้องกับ `bestScore` ตามเกณฑ์" ถ้าทำตามตรง ๆ
จะเกิดกับดักร้ายแรง เพราะ D-12 กำหนดว่าผู้วิจัยต้องปรับค่าคะแนนได้หลังทดลองนำร่อง
**วันที่แก้ `starThresholds` ไฟล์เซฟของนักเรียนทุกคนจะมีดาวไม่ตรงเกณฑ์ใหม่ทันที**
ถ้าถือว่าเป็นไฟล์เสียก็จะถูกกักทั้งหมด ข้อมูลการทดลองหายเพราะแค่ปรับตัวเลข

จึงเปลี่ยนเป็น **schema ตรวจแค่ช่วงค่าเชิงโครงสร้าง แล้ว `normalizeSave()` คำนวณดาวใหม่**
จากคะแนนด้วยเกณฑ์ปัจจุบันเสมอ ไม่เชื่อค่าที่บันทึกไว้

หลักการรวมของทั้งชั้นนี้คือ **ปฏิเสธเฉพาะสิ่งที่อ่านไม่ออกจริง ๆ ที่เหลือให้ซ่อม** —
ดึงค่าที่เกินช่วงกลับเข้าที่ · ตัด key ด่านที่ไม่มีจริงทิ้ง · ดัน `unlockedLevel` ให้ไม่ต่ำกว่า
ด่านที่ผ่านแล้ว · ทิ้ง checkpoint ของด่านที่ยังไม่ปลดล็อก

### บั๊กที่เทสต์จับได้ระหว่างทาง — `z.unknown()` ของ Zod v4 เป็นฟิลด์บังคับ

ตอนแรกเขียน `storedSaveSchema` (ตัวตรวจหลวมตอนอ่านจากเครื่อง) โดยใส่ทุกฟิลด์เป็น
`z.unknown()` คิดว่าจะยอมให้ฟิลด์ขาดได้ แต่ **Zod v4 ถือว่า `z.unknown()` เป็นฟิลด์บังคับ**
(`expected nonoptional, received undefined`) ผลคือเซฟที่ขาดฟิลด์ใดฟิลด์หนึ่ง เช่นไฟล์เก่าที่
บันทึกไว้ก่อนเพิ่มฟิลด์ใหม่ จะถูกตัดสินว่าเป็นไฟล์เสียแล้วโดนกักทั้งไฟล์ — ตรงข้ามกับที่ชั้นนี้
ตั้งใจจะทำเลย

แก้โดยลดเหลือ `z.looseObject({ version: z.literal(1) })` เพราะงานเดียวที่ด่านนี้ต้องทำคือ
ยืนยันว่าเป็นวัตถุเซฟเวอร์ชัน 1 ที่เหลือ `normalizeSave()` ซ่อมได้หมดอยู่แล้ว มีเทสต์กัน
การถอยหลังไว้แล้ว

### เพิ่มจากแผน

- **`src/config/scoring.ts`** — เอกสารจัดไว้ที่ Phase 4 แต่ schema ต้องใช้เกณฑ์ดาวเพื่อ
  normalize ถ้าไม่สร้างตอนนี้ต้อง hard-code เลข 90/70/40 ลง schema ซึ่งขัด CLAUDE.md ตรง ๆ
  ไฟล์นี้เป็นค่าคงที่ล้วน Phase 4 จะ import ไปใช้แล้วสร้าง `domain/game/scoring.ts` ต่อ
- **`progress.ts`** — DoD สามข้อแรกบังคับพฤติกรรมที่ไม่มีไฟล์ไหนในรายชื่อรับผิดชอบ
  (`recordLevelResult`, `saveCheckpoint`, `clearCheckpoint`, `isLevelUnlocked`)
- **`keys.ts`** — รวมชื่อคีย์ทั้ง 4 ไว้ที่เดียว รวมคีย์งานวิจัยที่จองไว้ให้ Phase 9
- **`autosave.ts`** — ตัวจับจังหวะ debounce ที่ไม่ผูกกับ React ตามข้อ 3.4
- **เพดานไฟล์เสีย 3 ชุด** — ไม่มีในเอกสาร แต่ถ้าเซฟพังค้างแล้วนักเรียนรีเฟรชรัว ๆ คีย์
  `corrupt:<timestamp>` จะงอกทุกครั้งจนกินพื้นที่เต็ม กลายเป็นพังซ้ำซ้อนกู้ไม่ได้เลย
- **`currentVersion` ฉีดเข้า `migrate()` ได้** — ถ้าล็อกไว้ที่ `CURRENT_VERSION = 1` ตายตัว
  ลูปไล่ chain จะไม่มีวันทำงาน แล้วโค้ดส่วนนั้นจะไม่เคยถูกทดสอบจนกว่าจะมี v2 จริง ซึ่งสายเกินไป

### ต่างจากแผน

- **ไม่มี React แม้แต่บรรทัดเดียว** — ข้อ 3.4 พูดถึง `visibilitychange` และ debounce ซึ่ง
  ฟังดูเป็นงาน React แต่แยกได้ phase นี้ส่งมอบตัวจับจังหวะที่ไม่ผูกเฟรมเวิร์ก ทดสอบด้วย
  นาฬิกาปลอมได้ ส่วนการต่อสายกับ `visibilitychange` และการออกจาก route เป็นงาน Phase 7
- **`importJson()` ยังไม่เขียนลงเครื่อง** — คืนผล merge พร้อม preview ให้ UI ยืนยันก่อน
  ตามข้อ 3.6 แล้วชั้นบนค่อยเรียก `save()` เอง
- **`MAX_LEVEL_ID` ผูกกับข้อมูลจริงตอนเทสต์ ไม่ผูกตอนรัน** — มีเทสต์ยืนยันว่าเท่ากับ
  `LEVELS.length` ทำให้ชั้น storage ไม่ต้อง import ชั้น data ถ้าวันหนึ่งด่านถูกถอดออก
  เซฟเก่าที่อ้างถึงด่านนั้นจะไม่พังทั้งไฟล์ แค่ถูกตัด key ทิ้ง
- **`attempts` ตอน merge ใช้ max ไม่ใช่ผลรวม** — สองฝั่งอาจมีประวัติร่วมกันอยู่แล้ว
  การบวกกันจะทำให้สถิติงานวิจัยเฟ้อ
- **ย้าย `architecture.test.ts` ออกจาก `src/domain/chemistry/`** ไปไว้ที่ `src/` เพราะกฎในไฟล์นี้
  ข้ามชั้นทั้งหมด (สแกนทั้ง `src/` อยู่แล้ว) การวางไว้ในโฟลเดอร์เคมีทำให้หาไม่เจอ

### บังคับกฎด้วยเครื่องมือ

เพิ่ม ESLint `no-restricted-globals` + `no-restricted-properties` ห้าม `localStorage`/
`sessionStorage` ทั่ว `src/**` แล้วยกเว้นเฉพาะ `src/storage/**` — **ทดสอบแล้วว่ากฎยิงจริง**
ทั้งรูปแบบ `window.localStorage` และเรียกตรง ๆ และไม่ฟ้องในโฟลเดอร์ storage (ลบไฟล์ทดสอบแล้ว)
บวกกับเทสต์สแกนไฟล์ใน `architecture.test.ts` อีกชั้น

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

- [x] default save ปลดล็อกเฉพาะด่าน 1
- [x] ผ่านด่าน 1 แล้ว `unlockedLevel` เป็น 2 · ผ่านด่าน 50 แล้วไม่เกิน 50
- [x] replay แล้ว `bestScore` และ `bestStars` ไม่ลดลง · `bestTimeMs` ใช้ค่าที่ดีกว่า · `attempts` เพิ่มทุกครั้ง
- [x] JSON พัง version ผิด ค่านอกช่วง และ quota error ทั้งหมดไม่ทำให้ crash
- [x] export แล้ว import กลับได้ข้อมูลเท่าเดิม
- [x] migration และ multi-tab merge ไม่ทำให้ความก้าวหน้าลดลง
- [x] `grep -r "localStorage" src/` เจอเฉพาะในโฟลเดอร์ `src/storage/`

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
