# Phase 7 · หน้าจอทั้งหมด

> **สถานะ: เสร็จแล้ว ✅**
> - ครบทั้ง 8 route ตามสเปก (`/`, `/levels`, `/level/[levelId]/intro`, `/level/[levelId]/play`, `/progress`, `/settings`, `/how-to-play`, `/knowledge`)
> - เชื่อมต่อ React กับ Game Machine, Storage, Audio, และ Accessibility ครบวงจร
> - รองรับ 7 สถานะพิเศษ (Invalid Level ID, Locked Level Guard, Broken Data, Corrupt JSON, Storage Error, Refresh Checkpoint, Multi-tab Sync)
> - ผ่านการทดสอบ Unit Tests (68 test files / 1595 tests) และ Playwright E2E (24 tests across Desktop, iPad, Mobile) ครบ 100%
> - Definition of Done 4 ประตูผ่านครบถ้วน

> **เป้าหมาย:** ทั้ง 8 route ต่อกันครบ เล่นจบด่านได้จริงตั้งแต่หน้าแรกถึงสมการสุทธิ และความก้าวหน้าถูกบันทึกลงเครื่อง
> **ต้องรอ:** Phase 2 (ข้อมูลด่าน) · Phase 4 (reducer) · Phase 6 (ลาก–วาง)
> **ลำดับบังคับ:** ทำ **ด่าน 01 ให้จบครบวงจรก่อน** แล้วค่อยขยาย ตามคำสั่งข้อ 3 ในหัวข้อส่งต่องานของ spec

เฟสนี้คือเฟสที่ "ทุกอย่างที่สร้างมา 6 เฟสมาต่อกัน" — ตรรกะเกม ข้อมูลด่าน เซฟ component และการลากวาง
**เฟสนี้ไม่เขียนตรรกะเกมใหม่ ไม่เขียนกฎเคมีใหม่ และไม่สร้าง component ใหม่ใน `src/components/`** เว้นแต่จำเป็นจริง

---

## อ่านก่อนเริ่ม (บังคับ)

| อ่าน | เพราะ |
|---|---|
| spec หัวข้อ **"สถาปัตยกรรมหน้าและเส้นทาง"** · **"ข้อกำหนดรายหน้าจอ"** · **"ข้อผิดพลาดและสถานะพิเศษ"** | เป็นข้อกำหนดต้นฉบับของทุก route ในเฟสนี้ |
| `docs/Ion_Clash-Website_UI.pdf` หน้า 02–11 | อ้างอิงหน้าตาที่ต้องทำตาม |
| `00-decisions.md` **D-04 · D-14 · D-21** | D-04 บอกว่าขั้นวางกับขั้นดุลอยู่หน้าเดียวกัน · D-14 บังคับให้กรอกชื่อผู้เล่น |
| `04-phase-3-storage-save.md` และ `05-phase-4-game-state.md` | รู้ว่าเซฟและ reducer รับผิดชอบอะไรไปแล้วบ้าง |
| `CLAUDE.md` ย่อหน้าเรื่อง `PageShell` / flex | หน้าจอทุกหน้าต้องใช้ `PageShell` ไม่งั้นเจอบั๊กเลื่อนแนวนอนซ้ำ |

---

## กฎแบ่งชั้นที่เฟสนี้ต้องรักษา

```
src/components/   ← โง่ล้วน รับ prop มาวาด  (ESLint ห้าม import ค่าจาก domain/data)
src/session/      ← ชั้นต่อสาย (ใหม่ในเฟสนี้) — reducer + เซฟ + guard อยู่ที่นี่
src/app/          ← route ผอม ๆ ประกอบ session + components เข้าด้วยกัน
```

> ตรรกะการเล่นอยู่ใน `src/domain/game/` ไปแล้ว ตรรกะการเก็บอยู่ใน `src/storage/` ไปแล้ว
> `src/session/` ไม่ใช่ที่เก็บตรรกะใหม่ — เป็นที่ที่ React มาเจอกับสองชั้นนั้น (เหมือน `src/audio/` ทำกับ AudioEngine)

---

## ขั้นตอนการทำงาน

### ขั้นที่ 1 · ชั้น session — เซฟกับ React

**สร้าง** `src/session/SaveProvider.tsx`

```ts
// SaveStatusKind มีอยู่แล้วใน src/components/game/SaveStatus.tsx — import type มาใช้ ห้ามประกาศซ้ำ
import type { SaveStatusKind } from "../components/game/SaveStatus";

export type SaveContextValue = {
  /** null = ยังโหลดไม่เสร็จ (SSR หรือก่อน mount) — ห้าม render ปุ่มที่ขึ้นกับเซฟจนกว่าจะไม่ null */
  save: GameSaveV1 | null;
  status: SaveStatusKind;
  /** เขียนทันที ใช้ตอนจบด่าน */
  commit(next: GameSaveV1): void;
  /** เขียนแบบหน่วง 400ms ใช้กับ checkpoint ระหว่างเล่น */
  scheduleCommit(next: GameSaveV1): void;
  retry(): void;
  exportJson(): void;          // trigger ดาวน์โหลดไฟล์
  importJson(text: string): ImportResult;
  applyImport(merged: GameSaveV1): void;
  reset(): void;
};

export function SaveProvider({ children }: { children: ReactNode }): JSX.Element;
export function useSave(): SaveContextValue;
```

**กติกาที่ผิดไม่ได้**

- `createGameSaveRepository()` ต้องถูกเรียกใน `useEffect` หลัง mount เท่านั้น — **ห้ามอ่าน `localStorage` ตอน SSR**
- ก่อน mount เสร็จ `save` ต้องเป็น `null` และหน้าต้องแสดง skeleton ไม่ใช่หน้าเปล่าและไม่ใช่ค่า default ที่จะกระพริบเปลี่ยนทีหลัง
- ใช้ `createAutosaveScheduler` จาก `src/storage/autosave.ts` (มีอยู่แล้ว `DEFAULT_AUTOSAVE_DELAY_MS = 400`) — อย่าเขียน debounce เอง
- `save()` คืน `SaveResult` ที่อาจเป็น `{ ok:false, reason }` — ต้องแปลงเป็น `status: "error"` **ไม่ throw ไม่ทำให้เกมหยุด**
- ต่อ `subscribeExternalChange` เพื่อ merge จากแท็บอื่น และคืนฟังก์ชันยกเลิกใน cleanup

**เทสต์** `SaveProvider.test.tsx` — inject `StorageLike` ปลอมจาก `src/storage/__fixtures__/fakeStorage.ts`
ครอบ: โหลดสำเร็จ · storage โยน quota error แล้ว `status === "error"` แต่ `save` ยังใช้ได้ · เขียนซ้ำ ๆ ถูกยุบเหลือครั้งเดียวตาม debounce

---

### ขั้นที่ 2 · ชั้น session — เกมหนึ่งด่าน

**สร้าง** `src/session/useLevelGame.ts`

```ts
export type UseLevelGame = {
  state: GameState;
  level: BuiltLevel;
  dispatch(event: GameEvent): void;
  step: ProgressStep | null;      // จาก selectors.progressStep
  hintText: string | null;        // จาก hints.nextHint หลังกด USE_HINT
};

export function useLevelGame(level: BuiltLevel): UseLevelGame;
```

**สิ่งที่ hook นี้ต้องทำ**

| งาน | ทำยังไง |
|---|---|
| สร้าง state ตั้งต้น | `createInitialState(level)` แล้วถ้ามี `save.activeCheckpoint` ของด่านนี้ ให้ `applyCheckpoint(cp, level, Date.now())` ทับ |
| เดิน state machine | `useReducer` ที่ห่อ `reduce(state, event, level)` ตรง ๆ |
| ใส่ `at` ให้ event ที่ต้องการเวลา | `START_LEVEL` `COMPLETE_LEVEL` `REPLAY` `PAUSE` `RESUME` — hook เป็นคนเติม `Date.now()` เพราะ reducer ต้องบริสุทธิ์ |
| autosave checkpoint | ทุกครั้งที่ state เปลี่ยน เรียก `toCheckpoint(state, { at, savedAt })` แล้ว `saveCheckpoint()` + `scheduleCommit()` — ถ้าคืน `null` แปลว่าเฟสนี้ไม่ต้องบันทึก |
| หยุดนาฬิกาเมื่อแท็บถูกซ่อน | ฟัง `visibilitychange` แล้ว dispatch `PAUSE` / `RESUME` |
| จบด่าน | เมื่อ `phase === "levelComplete"` เรียก `levelResultOf(state, at)` → `recordLevelResult()` → `clearCheckpoint()` → `commit()` |
| เสียง | `place` ตอนวาง · `correct`/`wrong` ตาม `lastFeedback` · `gold` ตอน `isPrecipitateRevealed` เปลี่ยนเป็น true · `levelup` ตอน `levelComplete` |

> **ห้ามคำนวณคะแนน ดาว หรือเวลา ในชั้นนี้** — `selectors.ts` ทำไปแล้วทั้งหมด (`scoreOf` `starsOf` `elapsedOf` `levelResultOf`)

**เทสต์** `useLevelGame.test.tsx` — เดินจนจบด่าน 1 แล้วยืนยันว่า repository ปลอมได้รับ `completedLevels["1"].completed === true` และ `activeCheckpoint === null`

---

### ขั้นที่ 3 · Route guard

**สร้าง** `src/session/useLevelGuard.ts`

```ts
export type GuardVerdict =
  | { status: "loading" }
  | { status: "ok"; level: BuiltLevel }
  | { status: "invalid" }                       // levelId ไม่ใช่เลข 1–50
  | { status: "locked"; requiredLevel: number }
  | { status: "broken"; code: string };         // buildLevel throw

export function useLevelGuard(rawLevelId: string): GuardVerdict;
```

```
เข้า /level/25/play
   │
   ├─ levelId ไม่ใช่เลข 1–50 ──────► notFound() + ปุ่มกลับเลือกด่าน
   │
   ├─ save ยังเป็น null (ก่อน mount) ► แสดง skeleton — ห้ามอ่าน localStorage
   │
   ├─ !isLevelUnlocked(save, id) ───► router.replace("/levels") + toast
   │
   ├─ getLevel() throw ────────────► แสดงรหัสข้อผิดพลาด ไม่ทำให้ทั้งเว็บล่ม
   │
   └─ ผ่านหมด ────────────────────► เล่นได้
```

**ข้อความ toast:** `ผ่านด่าน {requiredLevel} ก่อนเพื่อปลดล็อกด่านนี้` (สเปกบังคับให้มีข้อความ ไม่ใช่ redirect เงียบ ๆ)

**สร้าง** `src/session/ToastProvider.tsx` — `useToast().show(messageTh)` แสดงเป็น `role="status"` มุมจอ หายเองใน 5 วินาที
ต้องมีปุ่มปิดที่กดได้ และ **ห้ามเป็นข้อมูลเดียวที่บอกเหตุผล** (หน้า `/levels` ต้องเห็นอยู่แล้วว่าด่านล็อก)

**เทสต์** `useLevelGuard.test.tsx` — ครอบทั้ง 5 กิ่งด้วย save ปลอม

---

### ขั้นที่ 4 · โครง app และ providers

**แก้** `src/app/layout.tsx` — ห่อ `{children}` ด้วย `<Providers>` ตัวเดียว
**สร้าง** `src/app/providers.tsx` (client)

```tsx
"use client";
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SaveProvider>
      <SettingsBridge>{/* อ่าน save.settings แล้วส่งลงเป็น prop */}
        <AudioProvider enabled={settings.sound}>
          <MotionProvider enabled={!settings.reducedMotion}>
            <ToastProvider>{children}</ToastProvider>
          </MotionProvider>
        </AudioProvider>
      </SettingsBridge>
    </SaveProvider>
  );
}
```

> `AudioProvider` และ `MotionProvider` รับค่าเป็น **prop** ไม่ได้อ่าน storage เอง (ออกแบบไว้แบบนั้นตั้งแต่ Phase 5/6)
> `SettingsBridge` คือชิ้นเล็ก ๆ ที่ทำหน้าที่แปลง `useSave().save.settings` เป็น prop — ให้ชั้นล่างไม่ต้องรู้จักเซฟเลย

**สร้าง** `src/app/not-found.tsx` · `src/app/error.tsx` · `src/app/loading.tsx`
ทั้งสามใช้ `PageShell` และมีปุ่มกลับหน้าหลัก/เลือกด่านเสมอ

---

### ขั้นที่ 5 · route ทีละหน้า — ทำตามลำดับนี้

ลำดับนี้เลือกมาให้ **เล่นด่าน 01 จบได้เร็วที่สุด** แล้วค่อยเติมหน้าประกอบ

| ลำดับ | Route | ไฟล์ | ต้องมีอะไร |
|---|---|---|---|
| 1 | `/levels` | `src/app/levels/page.tsx` | `levelGridView(save)` → `<LevelGrid>` · แสดง `3/50` และดาวรวม · แต่ละ tile ลิงก์ไป `/level/{id}/intro` · ระหว่างรอเซฟแสดง skeleton |
| 2 | `/level/[levelId]/intro` | `src/app/level/[levelId]/intro/page.tsx` | สารตั้งต้น 2 ตัวพร้อมสถานะ + `?` แทนผลิตภัณฑ์ · ปุ่ม **เริ่มแยกไอออน** · dialog ยืนยันตอนกดออกเฉพาะเมื่อมี checkpoint |
| 3 | `/level/[levelId]/play` | `src/app/level/[levelId]/play/page.tsx` | หน้าเดียวที่ render ตาม `state.phase` (ดูขั้นที่ 6) |
| 4 | `/` | `src/app/page.tsx` (เขียนทับ placeholder เดิม) | ดูขั้นที่ 7 |
| 5 | `/progress` | `src/app/progress/page.tsx` | สรุปด่านผ่าน ดาวรวม คะแนนรวม เวลารวม + export / import / reset |
| 6 | `/settings` | `src/app/settings/page.tsx` | สลับ `sound` `music` `reducedMotion` · แก้ชื่อผู้เล่น · ลิงก์จัดการข้อมูล |
| 7 | `/how-to-play` | `src/app/how-to-play/page.tsx` | **โครงหน้าเปล่าที่ route ได้** — เนื้อหาจริงเป็นงาน Phase 8 |
| 8 | `/knowledge` | `src/app/knowledge/page.tsx` | เหมือนข้างบน |

> หน้า 7 และ 8 ในเฟสนี้ทำแค่ให้กดจากหน้าแรกแล้วไม่ 404 พร้อมข้อความว่ากำลังจัดทำ
> **ห้ามใส่เนื้อหาเคมีมั่ว ๆ ไว้ก่อน** เพราะจะกลายเป็นเนื้อหาที่ไม่มีใครตรวจแล้วหลุดไปถึงนักเรียน

**ทุกหน้าต้อง**

- ห่อด้วย `<PageShell>` (มี `w-full min-w-0` ที่จำเป็นอยู่แล้ว)
- มี `<AppHeader>` ยกเว้นหน้าแรก
- มี `<h1>` เดียวต่อหน้า และลำดับ heading ไม่ข้ามระดับ
- ข้อความไทยทั้งหมด — Phase 8 จะย้ายไป `src/config/messages.ts` ทีเดียว **แต่เฟสนี้อย่าเพิ่งสร้างไฟล์นั้น** เพื่อไม่ให้ทำครึ่ง ๆ กลาง ๆ สองรอบ

---

### ขั้นที่ 6 · หน้าเล่นเกม 5 ขั้น

หน้าเดียว render ต่างกันตาม `state.phase` โดย `<StepIndicator current={step} />` คงอยู่ตลอด

| ขั้น | phase | แสดงอะไร |
|---|---|---|
| 1 | `dissociateReactants` | สมการโจทย์ + `IonCard` 4 ใบจาก `reactantIonCards(level)` |
| 2 | `arrangeProductIons` + `balanceEquation` | `IonSlot` 4 ช่อง + `CoefficientInput` (เฉพาะด่านที่ต้องดุล) |
| 3 | `validateProducts` | สองกล่องแยกกัน — "เกิดตะกอน" (การ์ดทอง) กับ "ยังคงอยู่ในสารละลาย" ตาม UI PDF หน้า 09 |
| 4 | `cancelSpectatorIons` | `EquationStrip` + `SpectatorConnector` + `CutPairList` + ปุ่ม Undo/Reset/ยืนยัน |
| 5 | `netIonicResult` + `levelComplete` | สมการสุทธิ + คะแนน + ดาว + `SaveStatus` + ปุ่มไปต่อ |

**สร้างชิ้นส่วนของแต่ละขั้นไว้ที่** `src/app/level/[levelId]/play/steps/Step{1..5}.tsx`
ไม่ใช่ใน `src/components/` — เพราะชิ้นส่วนเหล่านี้ต้องรู้จัก `BuiltLevel` และ `GameState` ซึ่ง `src/components/` ถูก ESLint ห้ามไว้

**กติกาที่ผิดไม่ได้ในหน้านี้**

- **สีทอง**เกิดได้เมื่อ `isPrecipitateRevealed(state)` เป็นจริงเท่านั้น — ส่ง `revealed` prop จากค่านี้ ห้ามคิดเงื่อนไขเอง
- ปุ่มตรวจเปิด/ปิดตาม `canCheckArrangement` / `canCheckBalance` / `canConfirmCancellation`
- **ขั้น 5 ต้องแสดง `SaveStatus` ก่อนเปิดปุ่มไปต่อ** ถ้าบันทึกไม่สำเร็จ ผู้เล่นยังผ่านด่านใน session ได้ แต่ต้องเห็นคำเตือน + ปุ่มลองใหม่ + ปุ่มส่งออกข้อมูล
- `HintButton` ส่ง `maxHints={level.hints.length}` **ไม่ใช่เลข 3 ตายตัว**
- ปุ่มออกจากด่านเปิด `Dialog` ยืนยันเมื่อมี checkpoint ค้าง

---

### ขั้นที่ 7 · หน้าแรกและขั้นกรอกชื่อ

- โลโก้ ION CLASH + คำอธิบาย "แยกไอออน • สร้างตะกอน • ตัดไอออนผู้ชม"
- ปุ่ม **เริ่มเกม** เด่นที่สุด สีทอง → `/levels`
- ปุ่ม **วิธีการเล่น** (น้ำเงิน) → `/how-to-play` · ปุ่ม **ความรู้ก่อนเล่นเกม** (เขียว) → `/knowledge`
- **ครั้งแรกที่เข้า** (`save.playerName === ""`) กดเริ่มเกมแล้วขึ้นขั้นกรอกชื่อก่อน ตาม D-14
  - ใต้ช่องกรอกเขียนกำกับว่า **แนะนำให้ใช้ชื่อเล่นหรือรหัสนิสิต ไม่ต้องใส่ชื่อจริงเต็ม**
  - บันทึกลง `save.playerName` (ไม่ใช่คีย์แยก) เพื่อให้ติดไปกับ export/import
  - **ข้อความขอความยินยอมการส่งข้อมูลออกเครือข่ายเป็นงาน Phase 9** — เฟสนี้ทำแค่ช่องกรอกชื่อ
- ถ้ามีเซฟเดิม เปลี่ยนปุ่มหลักเป็น **เล่นต่อด่าน XX** (จาก `save.lastPlayedLevel`) + ปุ่มรอง **เลือกด่าน** และไม่ถามชื่อซ้ำ
- **โหลดเซฟให้เสร็จก่อนแสดงปุ่ม** ไม่งั้นข้อความปุ่มจะกระพริบเปลี่ยน — ระหว่างรอแสดง skeleton ที่สูงเท่าปุ่มจริง

---

### ขั้นที่ 8 · สถานะพิเศษทั้ง 7 แบบ

ทดสอบทีละข้อด้วยมือ ไม่ใช่แค่เขียนโค้ดเผื่อไว้

| กรณี | พฤติกรรมที่ต้องได้ | ทดสอบยังไง |
|---|---|---|
| Level ID ไม่มีอยู่ | `notFound()` + ปุ่มกลับเลือกด่าน | เปิด `/level/99/play` และ `/level/abc/play` |
| ด่านยังล็อก | redirect `/levels` + toast | เปิด `/level/25/play` ด้วยเซฟเปล่า |
| ข้อมูลด่าน invalid | แสดงรหัสข้อผิดพลาด ไม่ล่มทั้งเว็บ | แก้ seed ชั่วคราวให้ `buildLevel` throw |
| Save JSON เสีย | backup ไป `ion-clash:save:corrupt:*` ใช้ default แจ้งผู้ใช้ เสนอ import | ใส่ข้อความมั่วลง key ใน DevTools |
| Storage ถูกปิดกั้น | เล่นได้ใน session · `SaveStatus` เป็น error · มีปุ่ม export | เปิดโหมดส่วนตัว หรือ mock ให้ throw |
| Refresh กลางด่าน | โหลด checkpoint ล่าสุด · ถ้าไม่มีให้กลับ intro **โดยไม่เพิ่ม attempt** | refresh ในทั้ง 4 checkpoint state |
| เปิดหลายแท็บ | merge best progress · `unlockedLevel` **ห้ามลดลง** | เปิดสองแท็บ เล่นคนละด่าน แล้วสลับ |

---

### ขั้นที่ 9 · ตรวจด้วยตาและปิดเฟส

เปิด `npm run dev` แล้วไล่ทุก route ที่ **1024×768 · 1280×720 · 390×844**

- [ ] ไม่มี horizontal scroll ระดับหน้าเลยสักหน้า (เช็กด้วย `document.documentElement.scrollWidth <= clientWidth`)
- [ ] zoom 200% แล้วข้อความไม่ถูกตัด
- [ ] Tab ไล่ทั้งหน้าโดยไม่แตะเมาส์ ทุกปุ่มเข้าถึงได้และเห็น focus ring
- [ ] ไม่มี `console.error` หรือ hydration warning ในทุกหน้า
- [ ] เทียบกับ UI PDF หน้า 02 · 03 · 05 · 06 · 07 · 08 · 09 · 10 · 11

---

## ไฟล์ที่จะสร้าง

```
src/session/
├── SaveProvider.tsx      เซฟ + สถานะบันทึก + export/import/reset
├── useLevelGame.ts       reduce + checkpoint + เสียง + จบด่าน
├── useLevelGuard.ts      guard 5 กิ่ง
└── ToastProvider.tsx     ข้อความชั่วคราว role=status

src/app/
├── providers.tsx
├── not-found.tsx · error.tsx · loading.tsx
├── page.tsx                        (เขียนทับ placeholder)
├── levels/page.tsx
├── level/[levelId]/intro/page.tsx
├── level/[levelId]/play/page.tsx
├── level/[levelId]/play/steps/Step1..Step5.tsx
├── progress/page.tsx
├── settings/page.tsx
├── how-to-play/page.tsx            (โครงเปล่า — Phase 8 เติม)
└── knowledge/page.tsx              (โครงเปล่า — Phase 8 เติม)
```

---

## Definition of Done

- [ ] เล่นด่าน 01 จบครบ 5 ขั้นจากหน้าแรกถึงปลดล็อกด่าน 02
- [ ] เล่นด่านที่ต้องดุล (เช่น 13 และ 42) จบได้
- [ ] เปิด `/level/25/play` ตรง ๆ ขณะยังล็อก แล้วถูก redirect จริง **พร้อมข้อความ**
- [ ] refresh กลางด่านในทั้ง 4 checkpoint state แล้วกลับมาถูกทุกครั้ง และ `attempts` ไม่เพิ่ม
- [ ] ปิดเบราว์เซอร์แล้วเปิดใหม่ ยังเห็นด่านที่ปลดล็อก
- [ ] export แล้ว import กลับ ได้ข้อมูลเท่าเดิม และ reset ต้องยืนยันสองขั้น
- [ ] ปิด localStorage แล้วยังเล่นจบด่านได้ พร้อมเห็น `SaveStatus` เป็น error และปุ่ม export
- [ ] ไม่มี horizontal overflow ระดับหน้าที่ 1024×768 · 1280×720 · 390×844
- [ ] ไม่มี console error หรือ hydration warning ในทุกเส้นทาง
- [ ] `npm run lint && npm run typecheck && npm test && npm run build` ผ่านครบ 4

---

## กับดักที่ต้องระวัง

| กับดัก | ผลที่ตามมา |
|---|---|
| อ่านเซฟตอน SSR | หน้าพังทันที — ต้องอ่านใน effect หลัง mount เท่านั้น |
| ใช้ค่า default save ระหว่างรอโหลด | ปุ่ม "เล่นต่อด่าน XX" กระพริบเปลี่ยน และอาจปลดล็อกด่านผิดชั่วขณะ |
| ทำ guard ด้วย CSS หรือปุ่มสีเทาอย่างเดียว | เปิด URL ตรงก็เล่นด่านที่ล็อกได้ ขัด AC-03 ตรง ๆ |
| copy component แยกรายด่าน | spec ห้ามตรง ๆ และ 50 ชุดแก้ไม่ไหว |
| เผยผลิตภัณฑ์ในหน้า intro | ทำลายโจทย์ทั้งด่าน |
| เริ่มจับเวลาตอนเข้า route | เวลาเพี้ยนถ้าผู้เล่นอ่านโจทย์นาน — กระทบข้อมูลวิจัยโดยตรง ต้องเริ่มตอนกดปุ่ม |
| คำนวณคะแนน/ดาว/เวลา ใหม่ในหน้า | `selectors.ts` ทำแล้ว — เขียนซ้ำแล้วจะเพี้ยนคนละค่า |
| ใส่เลข 3 เป็นเพดานคำใบ้ | เพดานจริงคือ `level.hints.length` |
| ใส่เนื้อหาเคมีชั่วคราวใน `/knowledge` | เนื้อหาที่ไม่มีใครตรวจจะหลุดถึงนักเรียน |
| ลืม `PageShell` ในหน้าใดหน้าหนึ่ง | หน้านั้นจะเลื่อนแนวนอนทั้งหน้าเมื่อมีแถบสมการ |

---

## พิธีปิดเฟส

1. `npm run lint && npm run typecheck && npm test && npm run build` ผ่านครบ 4
2. `npm run test:e2e` ยังผ่าน (spec ของ Phase 6 ต้องไม่พังจากการเปลี่ยนโครง)
3. เขียนบล็อก **"สถานะ: เสร็จแล้ว ✅"** ต้นไฟล์นี้ — ไฟล์ที่สร้าง/แก้ · เทสต์ก่อน→หลัง · บั๊กจริงที่เจอตอนเปิดในเบราว์เซอร์ · เพิ่มจากแผน · ต่างจากแผน
4. อัปเดต `development-plan/README.md` และ `CLAUDE.md` (ย่อหน้าสถานะ + อธิบายชั้น `src/session/` ที่เพิ่งเกิด)
5. commit + push แล้วรอ CI เขียว
