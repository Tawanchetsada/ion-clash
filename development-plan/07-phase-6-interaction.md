# Phase 6 · ระบบลาก–วางและการตัดไอออน

> **เป้าหมาย:** ผู้เล่นวางไอออนและตัดไอออนผู้ชมได้ครบด้วย 3 วิธี — ลาก แตะสองครั้ง คีย์บอร์ด — และพิสูจน์แล้วว่าใช้ได้จริงบน Safari/iPad
> **ต้องรอ:** Phase 5 (เสร็จแล้ว)
> **เฟสนี้ยังไม่สร้าง route ของเกมจริง** — route ทั้ง 8 เป็นงาน Phase 7 เฟสนี้ทำสนามซ้อม `/dev/interaction` ที่ปิดตายในโปรดักชัน

นี่คือ phase ที่เสี่ยงที่สุดของโปรเจกต์ ถ้าลากไม่ได้บน iPad งานวิจัยล้มทั้งงาน
**จึงต้องเปิดบนเครื่องจริงตั้งแต่ขั้นที่ 4 ไม่ใช่รอตอนท้ายเฟส**

---

## สถานะ: เสร็จแล้ว ✅

**ไฟล์ใหม่:**
- `src/components/interaction/types.ts` · `resolveIntent.ts` · `intentToEvent.ts` (ชั้นตรรกะอินพุตบริสุทธิ์ 100% ไม่มี DOM)
- `src/components/interaction/usePlacement.ts` (hook ถือสถานะ `held` ตัวเดียวสำหรับทั้งการแตะและคีย์บอร์ด)
- `src/components/interaction/usePointerDrag.ts` (Pointer Events + threshold 8px + pointer capture + elementFromPoint drop target)
- `src/components/interaction/DragLayer.tsx` (Portal ghost preview ป้องกัน SSR ด้วย `useSyncExternalStore`)
- `src/components/interaction/LiveAnnouncer.tsx` (Live region a11y `role="status"` + `useAnnouncer()` ล้างข้อความเก่าก่อนประกาศใหม่)
- `src/components/interaction/MotionProvider.tsx` (จัดการ reduced motion เคารพทั้ง OS media query และการตั้งค่าในเกมผ่าน `useSyncExternalStore`)
- `src/components/interaction/SpectatorConnector.tsx` (SVG overlay วาดเส้นตัดไอออนผู้ชมแบบ relative เลื่อนตามเนื้อหา + รองรับ path โค้งเมื่อคนละแถว)
- `src/app/dev/interaction/page.tsx` (สนามซ้อม interaction ปิดใน production ด้วย `notFound()`)
- `src/app/dev/interaction/InteractionHarness.tsx` (คอมโพเนนต์จำลองการเล่นด่าน 1 ต่อกับ state machine จริงและเสียง Web Audio)
- `e2e/interaction.spec.ts` (Playwright E2E 5 สถานการณ์ บน 3 Viewports: iPad, Desktop, Mobile)
- ชุด unit/component tests ใหม่ 7 ชุด: `resolveIntent.test.ts`, `intentToEvent.test.ts`, `usePlacement.test.tsx`, `usePointerDrag.test.tsx`, `LiveAnnouncer.test.tsx`, `MotionProvider.test.tsx`, `SpectatorConnector.test.tsx`

**ไฟล์เดิมที่แก้:**
- `src/components/game/IonCard.tsx` (เพิ่ม `touch-none`, `isDragging`, `onPointerDown`, `style`, รองรับ `exactOptionalPropertyTypes`)
- `src/components/game/IonSlot.tsx` (เพิ่ม `data-drop-target="slot"`, `data-slot-id`, `touch-none`, `onPointerDown`, `selected`)
- `src/components/game/EquationStrip.tsx` (เพิ่ม inner relative layer เพื่อรองรับ `SpectatorConnector` overlay เลื่อนตามการ์ด)
- `vitest.config.ts` (กำหนด `include: ["src/**/*.{test,spec}.{ts,tsx}"]` เพื่อไม่ให้ชนกับ Playwright test ใน `e2e/`)

`npm run lint && npm run typecheck && npm test && npm run build` และ `npm run test:e2e` ผ่านครบทั้งหมด:
- **Vitest:** 57 test files · **1,561 tests passed** (เพิ่มจาก 1,531 ของ Phase 5 อีก 30 ข้อ)
- **Playwright E2E:** **15 tests passed** ครบทั้ง 3 projects (iPad 1024×768, Desktop 1280×720, Mobile 390×844)

### บั๊กจริงที่เจอระหว่างทำและวิธีแก้

1. **Vitest ชนกับไฟล์ทดสอบ Playwright E2E**: เมื่อสร้าง `e2e/interaction.spec.ts` แล้วรัน `npm test` ค่าเริ่มต้นของ Vitest สแกนเจอไฟล์ใน `e2e/` และเกิดข้อผิดพลาดจาก `@playwright/test` suite context — แก้โดยเพิ่ม `include: ["src/**/*.{test,spec}.{ts,tsx}"]` ใน `vitest.config.ts` ให้ชัดเจน
2. **Cascading render warning ใน React 19 / Next.js**: `DragLayer` และ `MotionProvider` ที่เรียก `setState` ใน `useEffect` ถูก ESLint `react-hooks/set-state-in-effect` ตรวจจับ — แก้โดยใช้ `useSyncExternalStore` ซึ่งเป็นแพทเทิร์นมาตรฐานและไม่ทำให้เกิด cascading render
3. **Mock `document.elementFromPoint` ใน jsdom**: jsdom ไม่มีเมธอด `elementFromPoint` บน `document` โดยตรง — แก้โดยกำหนดฟังก์ชัน mock บน `document` object ใน `usePointerDrag.test.tsx`
4. **ความเข้มงวดของ `exactOptionalPropertyTypes` ใน TSConfig**: Props ที่เป็น optional callbacks เช่น `onSelect?: () => void` หากส่ง `undefined` จะไม่ผ่าน — แก้โดยกำหนด type ให้รองรับ `| undefined` อย่างชัดเจน

---

## อ่านก่อนเริ่ม (บังคับ)

| อ่าน | เพราะ |
|---|---|
| `development-plan/00-decisions.md` โดยเฉพาะ **D-03 · D-21** | D-03 กำหนดว่าการ์ดสารตั้งต้นมี 4 ใบเสมอ ไม่ทำซ้ำตามสัมประสิทธิ์ · D-21 ห้าม id สุ่ม |
| spec หัวข้อ **"Interaction: ลาก–วางที่ไม่ทำให้ผู้เล่นติด"** และ **"Accessibility"** | เป็นข้อกำหนดต้นฉบับของเฟสนี้ทั้งเฟส |
| `CLAUDE.md` หัวข้อ Architecture | ขอบเขตชั้น domain / presentation / components ที่ ESLint บังคับอยู่จริง |
| `src/domain/game/events.ts` | รายชื่อ event ที่ reducer รับได้ — **เฟสนี้ห้ามเพิ่ม event ใหม่** |
| `src/domain/game/instances.ts` | รูปแบบ `instanceId` และ `slotId` ที่ต้องส่งเข้า event |

---

## สิ่งที่มีอยู่แล้ว — อย่าสร้างซ้ำ

| มีแล้ว | ใช้ยังไง |
|---|---|
| `reduce(state, event, level)` ใน `src/domain/game/gameMachine.ts` | ตรรกะทั้งหมดของการวาง / ย้าย / เอาออก / ตัดคู่ อยู่ที่นี่แล้ว **เฟสนี้ไม่เขียนตรรกะเกมใหม่แม้แต่บรรทัดเดียว** |
| event `PLACE_ION` `MOVE_ION` `REMOVE_ION` `SELECT_LEFT` `SELECT_RIGHT` `UNDO` `RESET` `CONFIRM` | ครบแล้ว — ทั้ง 3 เส้นทางอินพุตต้องยิง event ชุดเดียวกันนี้ |
| `IonCard` (มี `selected` / `onSelect`) · `IonSlot` (มี `isDropTarget` / `onActivate` / `onRemove`) | ทั้งคู่เป็น `<button>` จริงและรับสถานะเป็น prop อยู่แล้ว ต่อสายเข้าไปได้เลย |
| `EquationStrip` (การ์ดมีสถานะ `struck` + `selected`) · `CutPairList` | สถานะภาพนิ่งของการตัดพร้อมแล้ว เฟสนี้เพิ่มแค่เส้น SVG ทับข้างบน |
| `selectors.ts`: `canCheckArrangement` · `canCheckBalance` · `canConfirmCancellation` | ใช้เปิด/ปิดปุ่ม — ห้ามคำนวณเงื่อนไขเองใน component |
| `src/audio/` — `useAudio().play("place" \| "correct" \| "wrong" \| "gold" \| "levelup")` | เสียงพร้อมใช้ ต่อในขั้นที่ 5 |
| `/dev/components` | ดูทุก component ทุกสถานะได้ ใช้เทียบว่าอันไหนมี prop อะไรบ้าง |

---

## สถาปัตยกรรมที่ตัดสินไว้แล้วสำหรับเฟสนี้

**ตรรกะ "อินพุตแปลว่าอะไร" มีที่เดียว** — ฟังก์ชันบริสุทธิ์ `resolveIntent()`
ทั้งลาก แตะ และคีย์บอร์ด เรียกฟังก์ชันเดียวกันนี้แล้วได้ intent เดียวกัน
ถ้าปล่อยให้แต่ละเส้นทางตัดสินเอง จะได้ตรรกะสามชุดที่เพี้ยนไปคนละทางแน่นอน

**สถานะการเลือกมีเจ้าของเดียว** — hook `usePlacement` ถือ `held` ไว้ตัวเดียว
เพราะ "แตะการ์ดแล้วแตะช่อง" กับ "Enter ถือแล้ว Enter วาง" คือสถานะเดียวกันจริง ๆ

> **ต่างจากรายการไฟล์เดิมของเอกสารฉบับก่อน** ที่เขียนว่ามี `useTapToPlace` และ `useKeyboardPlace` แยกกัน
> — แยกแล้วจะได้ state ซ้ำสามชุดที่ต้องคอยซิงก์กัน ซึ่งเป็นบ่อเกิดบั๊ก
> `usePointerDrag` ยังแยกอยู่ เพราะมันจัดการเรขาคณิตของ pointer ล้วน ๆ ไม่ยุ่งกับ intent

---

## ขั้นตอนการทำงาน

### ขั้นที่ 1 · ชั้นตรรกะอินพุตที่ไม่มี DOM

**สร้าง** `src/components/interaction/types.ts` และ `src/components/interaction/resolveIntent.ts`

```ts
export type PlacementSource =
  | { kind: "card"; instanceId: string }
  | { kind: "slot"; slotId: string; instanceId: string };

export type PlacementTarget =
  | { kind: "slot"; slotId: string }
  | { kind: "tray" };            // ถาดการ์ดต้นทาง — ลากกลับมาทิ้งเพื่อเอาออกจากช่อง

export type PlacementIntent =
  | { kind: "place"; instanceId: string; slotId: string }
  | { kind: "move"; fromSlotId: string; toSlotId: string }
  | { kind: "remove"; slotId: string }
  | { kind: "cancel" };

/** แปลง (ต้นทาง, ปลายทาง) เป็น intent — ปลายทาง null คือปล่อยนอกเป้า */
export function resolveIntent(
  source: PlacementSource,
  target: PlacementTarget | null,
): PlacementIntent;
```

**กติกาที่ต้องเป็นจริง**

| ต้นทาง | ปลายทาง | ผล |
|---|---|---|
| card | slot | `place` |
| slot | slot อื่น | `move` |
| slot | slot เดิม | `cancel` |
| slot | tray | `remove` |
| card | tray | `cancel` |
| อะไรก็ตาม | `null` | `cancel` |

**สร้าง** `src/components/interaction/intentToEvent.ts` — แปลง `PlacementIntent` เป็น `GameEvent`
(`cancel` คืน `null` ผู้เรียกไม่ต้อง dispatch) ไฟล์นี้ import **type อย่างเดียว** จาก `src/domain/game/events`

**เทสต์ที่ต้องเขียน**
`resolveIntent.test.ts` ครอบทั้ง 6 แถวในตารางข้างบน · `intentToEvent.test.ts` ครอบทั้ง 4 intent

**ตรวจว่าผ่าน:** `npx vitest run src/components/interaction/` เขียว และ `npm run lint` ไม่ฟ้อง `no-restricted-imports`

---

### ขั้นที่ 2 · hook เดียวที่ถือสถานะการเลือก

**สร้าง** `src/components/interaction/usePlacement.ts`

```ts
export type UsePlacementOptions = {
  /** ผู้เรียกเป็นคน dispatch เข้า reducer เอง — hook ไม่รู้จัก reducer */
  onIntent: (intent: PlacementIntent) => void;
  /** ข้อความประกาศให้ screen reader — hook เรียก ผู้เรียกเป็นคนแสดง */
  announce: (messageTh: string) => void;
  disabled?: boolean;
};

export type UsePlacement = {
  held: PlacementSource | null;
  isHeld(source: PlacementSource): boolean;
  /** ปลายทางที่กำลังเล็งอยู่ — ส่งต่อเป็น isDropTarget ของ IonSlot */
  activeTargetId: string | null;
  /** แตะการ์ด/ช่อง หรือกด Enter บนมัน */
  toggleHold(source: PlacementSource): void;
  /** แตะช่องปลายทาง หรือกด Enter บนช่องขณะถืออยู่ */
  activateTarget(target: PlacementTarget): void;
  cancel(): void;                       // Escape
  /** ผูกกับการ์ด/ช่องต้นทางเพื่อเปิดโหมดลาก */
  dragHandlersFor(source: PlacementSource): DragHandlers;
  /** ผูกกับ element ที่รับการวาง — ใส่ data-drop-target ให้อัตโนมัติ */
  targetPropsFor(target: PlacementTarget): TargetProps;
  dragging: DragState | null;           // ให้ DragLayer ใช้
};
```

**พฤติกรรมที่ต้องเป็นจริง**

- `toggleHold` บนตัวที่ถืออยู่แล้ว = ปล่อย (แตะซ้ำเพื่อยกเลิก)
- `toggleHold` ตัวใหม่ขณะถือตัวเก่า = เปลี่ยนไปถือตัวใหม่ **ไม่ใช่** วางตัวเก่า
- `activateTarget` ขณะไม่ได้ถืออะไร = ไม่ทำอะไร (ไม่ throw)
- ทุกครั้งที่เกิด intent ที่ไม่ใช่ `cancel` ต้องล้าง `held` เป็น `null`
- `disabled: true` ทำให้ทุกฟังก์ชันเป็น no-op

**เทสต์** `usePlacement.test.tsx` ด้วย `renderHook` — ครอบ 5 ข้อข้างบน + ยืนยันว่า `onIntent` ถูกเรียกด้วย intent ที่ `resolveIntent` คืน

---

### ขั้นที่ 3 · เส้นทางลากด้วย Pointer Events

**สร้าง** `src/components/interaction/usePointerDrag.ts` และ `src/components/interaction/DragLayer.tsx`

```
pointerdown   → เก็บ pointerId + จุดเริ่ม · เรียก setPointerCapture
pointermove   → ระยะ < 8px ยังไม่ถือว่าลาก · เกิน 8px จึงเข้าโหมดลาก
                ระหว่างลาก: อัปเดตตำแหน่ง ghost + หา drop target ใต้ปลายนิ้ว
pointerup     → resolveIntent(source, targetUnderPointer) แล้วส่งออก
pointercancel → intent = cancel เสมอ การ์ดกลับที่เดิม
```

**สิ่งที่ต้องมีจริงในโค้ด ไม่ใช่แค่ตั้งใจ**

| ต้องมี | เพราะ |
|---|---|
| `touch-action: none` บนการ์ดและช่อง (class หรือ style ตรง ๆ) | **บรรทัดที่ลืมบ่อยที่สุด** ไม่ใส่แล้ว Safari จะเลื่อนหน้าจอแทนการลาก เล่นไม่ได้เลย |
| `element.setPointerCapture(e.pointerId)` ตอน pointerdown | ลากเร็วแล้วนิ้วออกนอกการ์ด event จะไม่หลุด |
| ghost element มี `pointer-events: none` | ไม่งั้น `document.elementFromPoint` จะเจอ ghost ตัวเองแทนช่องปลายทาง — บั๊กที่อาการคือ "ลากแล้ววางไม่ติดสักช่อง" |
| หา target ด้วย `document.elementFromPoint(x, y)?.closest("[data-drop-target]")` | ไม่ต้องเก็บ rect ของทุกช่องเอง และถูกเสมอแม้ layout เปลี่ยน |
| ขยับ ghost ด้วยการเขียน `ref.current.style.transform` ตรง ๆ ใน handler | ถ้า `setState` ทุก `pointermove` จะ re-render ทั้งต้นไม้ทุกเฟรม iPad รุ่นเก่ากระตุกทันที |
| การ์ดต้นทางระหว่างลากใช้ `opacity` ลดลง **ไม่ใช่** `display:none` | ลากพลาดแล้วการ์ดต้องยังอยู่ที่เดิม ไม่ใช่หายไป |

`DragLayer` render ผ่าน `createPortal` ไปที่ `document.body` เป็น `position: fixed`
และต้อง render เฉพาะฝั่ง client (guard `typeof document !== "undefined"`)

**เทสต์** `usePointerDrag.test.tsx` — จำลอง pointer ด้วย `fireEvent.pointerDown/Move/Up` และ mock `document.elementFromPoint`
ต้องยืนยันอย่างน้อย: (1) ขยับ 5px แล้วปล่อย → ไม่เกิดการลาก (2) ขยับ 20px แล้วปล่อยบนช่อง → `place` (3) `pointercancel` → `cancel` (4) element ที่ผูก handler มี `touch-action: none` จริง

---

### ขั้นที่ 4 · สนามซ้อม `/dev/interaction` แล้วเปิดบน iPad ทันที

**สร้าง** `src/app/dev/interaction/page.tsx` (`notFound()` เมื่อ `NODE_ENV === "production"` — ลอกรูปแบบจาก `src/app/dev/components/page.tsx`)
และ `src/app/dev/interaction/InteractionHarness.tsx` (client component)

harness นี้คือเกมย่อส่วน — `useReducer` กับ `reduce` และ `getLevel(1)` ของจริง
แสดงการ์ด 4 ใบ ช่อง 4 ช่อง ปุ่มตรวจ และ log ของ event ที่ยิงออกไป
ไฟล์อยู่ใน `src/app/` จึง import ค่าจาก domain/data ได้ (ESLint ห้ามเฉพาะ `src/components/**`)

> **ขั้นนี้คือจุดที่ต้องหยิบ iPad ขึ้นมาแล้ว** ไม่ใช่ตอนท้ายเฟส
> รัน `npm run dev -- --hostname 0.0.0.0` แล้วเปิดจาก iPad ผ่าน IP ของเครื่องในวง LAN เดียวกัน
> ถ้า `touch-action` หรือ pointer capture ผิด จะรู้ตอนนี้ ตอนที่แก้ยังถูก ไม่ใช่ตอนเขียนไปแล้ว 8 ไฟล์

**บันทึกผลลงเอกสารเฟสทันทีที่ลอง** ว่าเครื่องรุ่นอะไร iPadOS เวอร์ชันอะไร และเจออะไรบ้าง

---

### ขั้นที่ 5 · ต่อ focus เสียง และคำประกาศ

**สร้าง** `src/components/interaction/LiveAnnouncer.tsx` — `<div role="status" aria-live="polite">` ห่อด้วย `VisuallyHidden`
พร้อม `useAnnouncer()` ที่คืน `announce(text)` ซึ่ง **ล้างข้อความเก่าก่อนใส่ใหม่** (ไม่งั้นข้อความซ้ำจะไม่ถูกอ่านซ้ำ)

| เหตุการณ์ | focus ไปที่ | ประกาศว่า | เสียง |
|---|---|---|---|
| วางสำเร็จ | ช่องที่วาง | "วางไอออนเงินในช่องที่ 1 แล้ว" | `place` |
| วางไม่สำเร็จ / ปล่อยนอกเป้า | การ์ดต้นทาง | "ยกเลิกแล้ว ไอออนกลับที่เดิม" | — |
| เอาออกจากช่อง | การ์ดที่กลับไป | "นำไอออนเงินออกจากช่องที่ 1" | `place` |
| กด Enter ถือการ์ด | คงที่เดิม | "ถือไอออนเงินอยู่ กดลูกศรเลือกช่อง แล้วกด Enter เพื่อวาง" | — |
| ตรวจแล้วถูก | ปุ่มถัดไป | ผ่าน `FeedbackPanel` (`role="status"`) | `correct` |
| ตรวจแล้วผิด | `FeedbackPanel` | ผ่าน `role="alert"` | `wrong` |

**ข้อความประกาศเอามาจาก view model** (`view.ariaLabel` ของ `IonCardView`)
ห้ามประกอบสตริงชื่อไอออนขึ้นเองใน component — ชั้น `src/presentation/speech.ts` เป็นเจ้าของเรื่องนี้

**คีย์บอร์ด** — ผูก `onKeyDown` ที่ระดับ container ของขั้นวางไอออน

```
Tab              เดินระหว่างการ์ดและช่องตามลำดับ DOM (ไม่ต้องทำอะไรเพิ่ม เพราะทุกตัวเป็น <button>)
Enter / Space    บนการ์ด = ถือ/ปล่อย · บนช่องขณะถือ = วาง · บนช่องที่มีการ์ดขณะไม่ถือ = ถือการ์ดในช่องนั้น
ArrowLeft/Right  ขณะถืออยู่ = ย้าย focus ไปช่องก่อนหน้า/ถัดไป (roving focus ด้วย array ของ ref)
Escape           ยกเลิกการถือ คืน focus ไปการ์ดต้นทาง
```

**ห้ามดัก `keydown` ที่ `window`** — ให้ดักที่ container แล้วเช็ค `event.key`
ดักที่ window จะไปทับ Escape ของ `Dialog` ซึ่งมีเทสต์คุมอยู่แล้ว

---

### ขั้นที่ 6 · SpectatorConnector — เส้นตัดไอออนผู้ชม

**แก้** `src/components/game/EquationStrip.tsx` — เพิ่มชั้นในหนึ่งชั้นที่เป็น `position: relative` และกว้างเท่าเนื้อหา
แล้ววาง `<svg>` overlay ไว้ในชั้นนั้น **ไม่ใช่ในตัว scroll container**

> เหตุผล: เมื่อเส้นอยู่ในเนื้อหาที่เลื่อน เส้นจะเลื่อนตามการ์ดเองโดยไม่ต้องคำนวณ `scrollLeft` ซ้ำ

> **ห้ามลบ `min-w-0` ออกจาก root ของ `EquationStrip`** และห้ามลบ `w-full min-w-0` ออกจาก `PageShell`
> มีเทสต์ยืนยันทั้งสองจุด — เป็นบั๊กหน้าเลื่อนแนวนอนทั้งหน้าที่เจอจริงใน Phase 5

**สร้าง** `src/components/interaction/SpectatorConnector.tsx`

```ts
export type ConnectorPair = { leftInstanceId: string; rightInstanceId: string };

export type SpectatorConnectorProps = {
  containerRef: RefObject<HTMLElement | null>;
  /** map จาก instanceId ไป element ของการ์ด */
  cardRefs: RefObject<Map<string, HTMLElement>>;
  pairs: readonly ConnectorPair[];
  reducedMotion: boolean;
};
```

**การคำนวณ**

- อ่าน `getBoundingClientRect()` ของ container และของการ์ดทั้งสองใบ แล้วลบกันให้ได้พิกัดสัมพัทธ์
- คำนวณใหม่เมื่อ: `pairs` เปลี่ยน · `ResizeObserver` ของ container ยิง · `orientationchange` · `resize`
- ห่อการคำนวณด้วย `requestAnimationFrame` และ **ยกเลิก frame เก่าก่อนตั้งใหม่เสมอ**
- **ห้ามคำนวณทุกเฟรม** และ **ห้ามเก็บพิกัดลง checkpoint** (Phase 3 ระบุว่า checkpoint เก็บ semantics ไม่ใช่พิกเซล)
- ถ้าการ์ดคู่กันอยู่คนละบรรทัด (`|top ซ้าย − top ขวา| > ครึ่งความสูงการ์ด`) ให้วาด `<path>` โค้งอ้อม แทน `<line>` ตรง
- `<svg>` ต้องมี `aria-hidden="true"` และ `pointer-events: none` — ข้อมูลจริงอ่านจาก `CutPairList` ที่มีอยู่แล้ว

**กติกาการตัด** (ตรรกะอยู่ใน reducer แล้ว — เฟสนี้แค่ต่อสาย)

- แตะ/Enter การ์ดฝั่งซ้าย → `SELECT_LEFT` · ฝั่งขวา → `SELECT_RIGHT`
- ปุ่ม **ย้อนคู่ล่าสุด** → `UNDO` · ปุ่ม **ล้างทั้งหมด** → `RESET` · ปุ่ม **ยืนยัน** → `CONFIRM`
- ปุ่มยืนยันเปิดใช้เมื่อ `canConfirmCancellation(state, level)` เป็นจริงเท่านั้น — **ห้ามเขียนเงื่อนไขเอง**

**เทสต์** `SpectatorConnector.test.tsx` — mock `getBoundingClientRect` แล้วยืนยัน:
จำนวน `<line>`/`<path>` เท่ากับจำนวนคู่ · มี `aria-hidden` · เปลี่ยนเป็น path โค้งเมื่อ top ต่างกันมาก · ไม่ throw เมื่อหา ref ของการ์ดไม่เจอ

---

### ขั้นที่ 7 · แอนิเมชันและการปิดแอนิเมชัน

**สร้าง** `src/components/interaction/MotionProvider.tsx` — context ที่รับ `enabled: boolean` เป็น prop (รูปแบบเดียวกับ `AudioProvider`)
พร้อม `useMotionEnabled()` ที่คืน `false` เมื่อ prop ปิด **หรือ** `matchMedia("(prefers-reduced-motion: reduce)")` เป็นจริง

component ห้ามอ่าน settings จาก storage เอง — Phase 7 จะส่ง prop ลงมาจาก provider ชั้นบน

| จังหวะ | ผล | เวลา | token |
|---|---|---|---|
| การ์ดลงช่องสำเร็จ | ขยายแล้วหดกลับเล็กน้อย | 150 ms | `--duration-fast` |
| ตอบผิด | การ์ดสั่นแนวนอน + ขอบแดง | 200 ms | — |
| ไอออนสองใบรวมเป็นตะกอน | เลื่อนเข้าหากันแล้วเปลี่ยนเป็นการ์ดทอง | 250 ms | `--duration-slow` |
| เส้นตัดปรากฏ | วาดจากซ้ายไปขวา (`stroke-dashoffset`) | 200 ms | — |
| ผ่านด่าน | การ์ดทองเรืองแสงหนึ่งครั้ง | 250 ms | `--duration-slow` |

`globals.css` มี block `@media (prefers-reduced-motion: reduce)` ที่ตัด animation ทิ้งอยู่แล้ว
ส่วนที่ต้องเพิ่มคือเคารพ **การตั้งค่าในเว็บ** ผ่าน `useMotionEnabled()`

**เทสต์** `MotionProvider.test.tsx` — prop ปิดแล้ว `useMotionEnabled()` เป็น `false` แม้ `matchMedia` บอกว่าเปิด

---

### ขั้นที่ 8 · E2E ชุดแรก 3 เส้นทางอินพุต

โฟลเดอร์ `e2e/` ยังว่าง `npm run test:e2e` จึงล้มอยู่ตอนนี้ — เฟสนี้ทำให้มันรันได้

```bash
npx playwright install --with-deps chromium webkit
```

**สร้าง** `e2e/interaction.spec.ts` ยิงไปที่ `/dev/interaction`

| # | สถานการณ์ | ต้องได้ |
|---|---|---|
| 1 | ลากการ์ดใบแรกลงช่องที่ 1 ด้วย `page.mouse` | ช่องที่ 1 มี `aria-label` ของไอออนนั้น |
| 2 | แตะการ์ดแล้วแตะช่อง (`tap` บน project ipad/mobile) | เหมือนข้อ 1 |
| 3 | คีย์บอร์ดล้วน: `Tab` ถึงการ์ด → `Enter` → `ArrowRight` → `Enter` | เหมือนข้อ 1 |
| 4 | ลากออกนอกจอแล้วปล่อย | การ์ดยังอยู่ในถาด ช่องยังว่าง ไม่มี console error |
| 5 | ทั้ง 3 viewport เช็ก `document.documentElement.scrollWidth <= clientWidth` | ไม่มี horizontal scroll ระดับหน้า |

รันให้ผ่านทั้ง `ipad` และ `desktop` — **ไม่ใช่แค่ chromium**

> Phase 10 จะย้าย spec ชุดนี้ไปยิงที่ route จริง แต่ต้องมีตั้งแต่ตอนนี้ เพราะความเสี่ยงของเฟสนี้อยู่ที่ Safari ไม่ใช่ที่ตรรกะ

---

## ไฟล์ที่จะสร้าง

```
src/components/interaction/
├── types.ts                  PlacementSource / Target / Intent
├── resolveIntent.ts          ตรรกะบริสุทธิ์ ใช้ร่วมทั้ง 3 เส้นทาง
├── intentToEvent.ts          intent → GameEvent (import type เท่านั้น)
├── usePlacement.ts           เจ้าของสถานะ "กำลังถืออะไรอยู่" ตัวเดียว
├── usePointerDrag.ts         Pointer Events + threshold 8px + capture
├── DragLayer.tsx             ghost preview ผ่าน portal
├── LiveAnnouncer.tsx         role=status + useAnnouncer()
├── MotionProvider.tsx        เคารพทั้ง media query และการตั้งค่าในเว็บ
└── SpectatorConnector.tsx    SVG overlay + ResizeObserver

src/app/dev/interaction/page.tsx
src/app/dev/interaction/InteractionHarness.tsx
e2e/interaction.spec.ts
```

**แก้ของเดิม:** `src/components/game/EquationStrip.tsx` (ชั้น relative สำหรับ overlay) · `src/components/game/IonSlot.tsx` และ `IonCard.tsx` (รับ `data-drop-target` และ handler ของ drag ผ่าน prop)

---

## Definition of Done

ทุกข้อต้องติ๊กได้จริง ไม่ใช่ "น่าจะได้"

- [ ] วางไอออนลงครบ 4 ช่องได้ด้วย **ลาก**
- [ ] วางได้ด้วย **แตะการ์ดแล้วแตะช่อง**
- [ ] วางได้ด้วย **คีย์บอร์ดล้วน** โดยไม่แตะเมาส์เลยตั้งแต่โหลดหน้า
- [ ] ทั้งสามเส้นทางยิง `PLACE_ION` ตัวเดียวกัน — พิสูจน์ด้วยเทสต์ของ `resolveIntent`
- [ ] ลากบน iPad จริง (หรือ Safari webkit) แล้ว **หน้าจอไม่เลื่อนตาม**
- [ ] ลากออกนอกจอแล้วปล่อย การ์ดกลับที่เดิม ไม่หาย
- [ ] focus ย้ายถูกทุกกรณีตามตารางขั้นที่ 5 และมีคำประกาศจริง
- [ ] `UNDO` และ `RESET` ของการตัดไอออนทำงาน และปุ่มยืนยันเปิดตาม `canConfirmCancellation` เท่านั้น
- [ ] หมุน iPad จากแนวนอนเป็นแนวตั้งกลางเกม เส้นตัดคำนวณใหม่ถูก ไม่ค้างที่เดิม
- [ ] ปิดแอนิเมชัน (ทั้งผ่าน OS และผ่าน prop) แล้วยังเล่นจบขั้นได้ปกติ
- [ ] `npm run test:e2e` ผ่านทั้ง project `ipad` และ `desktop` อย่างน้อย
- [ ] ไม่มี `console.error` ในทุกเส้นทางของ `/dev/interaction`
- [ ] `npm run lint && npm run typecheck && npm test && npm run build` ผ่านครบ 4

---

## กับดักที่ต้องระวัง

| กับดัก | ผลที่ตามมา |
|---|---|
| ลืม `touch-action: none` | ลากบน iPad กลายเป็น scroll — เล่นไม่ได้เลย และไม่เจอบน desktop |
| ghost ไม่ใส่ `pointer-events: none` | `elementFromPoint` เจอ ghost แทนช่อง อาการคือวางไม่ติดสักช่องเดียว |
| ไม่ใช้ `setPointerCapture` | ลากเร็วแล้วการ์ดหลุดกลางทาง |
| ใช้ `onMouseDown` แทน `onPointerDown` | touch ไม่ทำงานทั้งระบบ |
| threshold 0px | แตะธรรมดากลายเป็นการลาก เลือกการ์ดไม่ได้ |
| `setState` ทุก `pointermove` | iPad รุ่นเก่ากระตุก — ต้องเขียน `style.transform` ผ่าน ref |
| คำนวณเส้น SVG ทุกเฟรม | เหมือนข้างบน — คำนวณเมื่อขนาด/คู่เปลี่ยนเท่านั้น |
| เขียนตรรกะ "วางได้ไหม" ใน component | ซ้ำกับ `guards.ts` แล้วจะเพี้ยนกันเอง — reducer ตัดสินฝ่ายเดียว |
| ดัก `keydown` ที่ `window` | ไปทับ Escape ของ `Dialog` |
| ซ่อนการ์ดต้นทางด้วย `display:none` ตอนเริ่มลาก | ลากพลาดแล้วการ์ดหายไปเลย ผู้เล่นตกใจ |
| ทดสอบแค่ Chrome DevTools touch emulation | ไม่เจอปัญหาจริงของ Safari — ต้องเครื่องจริงอย่างน้อยหนึ่งรอบใน phase นี้ |
| เก็บพิกัดเส้นลง checkpoint | ผิดข้อกำหนด Phase 3 และพังทันทีเมื่อเปลี่ยนขนาดจอ |

---

## พิธีปิดเฟส (ทำครบทั้ง 5 ข้อ ห้ามข้าม)

1. `npm run lint && npm run typecheck && npm test && npm run build` ผ่านครบ 4 บาน
2. `npm run test:e2e` ผ่าน
3. เขียนบล็อก **"สถานะ: เสร็จแล้ว ✅"** ไว้ต้นไฟล์นี้ ระบุ: ไฟล์ที่สร้าง/แก้ · จำนวนเทสต์ก่อน→หลัง · **บั๊กจริงที่เจอตอนลองบน iPad** · "เพิ่มจากแผน" · "ต่างจากแผน" (ดูรูปแบบจาก `06-phase-5-design-system.md`)
4. อัปเดตแถว Phase 6 ใน `development-plan/README.md` และย่อหน้าสถานะใน `CLAUDE.md`
5. commit + push แล้วรอ CI เขียวก่อนขึ้นเฟสถัดไป
