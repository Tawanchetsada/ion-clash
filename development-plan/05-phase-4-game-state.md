# Phase 4 · State Machine ของเกม

> **เป้าหมาย:** ตรรกะการเล่นหนึ่งด่านทำงานครบทุกสถานะ ผ่านเทสต์ โดยยังไม่มีหน้าจอ
> **ต้องรอ:** Phase 1 และ Phase 3
> **กฎเหล็ก:** เปลี่ยนสถานะด้วย event ที่กำหนดเท่านั้น ห้ามใช้ boolean กระจัดกระจายอย่าง `isGold` `isDone` `showResult` จนเกิดสถานะขัดแย้ง

---

## 4.1 สถานะและ event

```
levelSelect -> levelIntro -> dissociateReactants -> arrangeProductIons
  -> balanceEquation -> validateProducts -> cancelSpectatorIons
  -> netIonicResult -> levelComplete
```

| สถานะ | event ที่รับได้ | เงื่อนไขออก |
|---|---|---|
| `levelIntro` | START_LEVEL, EXIT | ผู้เล่นกดเริ่ม (เริ่มจับเวลาตรงนี้ ไม่ใช่ตอนเข้า route) |
| `dissociateReactants` | SHOW_IONS, CONTINUE | แสดงไอออนสารตั้งต้นครบ |
| `arrangeProductIons` | PLACE_ION, MOVE_ION, REMOVE_ION, CHECK | ช่องครบ 4 และคู่ผลิตภัณฑ์ถูก |
| `balanceEquation` | SET_COEFFICIENT, CHECK_BALANCE | สัมประสิทธิ์ถูกและเป็นอัตราส่วนต่ำสุด |
| `validateProducts` | CONFIRM_PRODUCTS | ตะกอนและผลิตภัณฑ์ที่ละลายถูกต้อง |
| `cancelSpectatorIons` | SELECT_LEFT, SELECT_RIGHT, UNDO, RESET, CONFIRM | ตัดไอออนผู้ชมครบและไม่มีคู่ผิด |
| `netIonicResult` | COMPLETE_LEVEL | สมการสุทธิสมดุลและแสดงผลแล้ว |
| `levelComplete` | NEXT_LEVEL, LEVELS, REPLAY | บันทึกสำเร็จหรือแจ้งข้อผิดพลาดแล้ว |

**ข้ามสถานะ `balanceEquation` ได้** เมื่อสัมประสิทธิ์ทุกตัวเป็น 1 (ด่าน 01-10) ตาม D-04 ให้ transition ตรงไป `validateProducts` แต่ตัว state machine ยังมีสถานะนี้อยู่ เพื่อไม่ให้ตรรกะแตกเป็นสองทาง

---

## 4.2 รูปร่าง state

```ts
export type GameState = {
  phase: GamePhase;
  levelId: number;
  slots: Array<{ slotId: string; ionInstanceId: string | null }>;
  coefficients: [number | null, number | null, number | null, number | null];
  canceledPairs: Array<{ leftInstanceId: string; rightInstanceId: string }>;
  selection: { side: 'left' | 'right'; instanceId: string } | null;
  hintsUsed: 0 | 1 | 2 | 3;
  wrongAttempts: number;
  errorsByCode: Record<ErrorCode, number>;   // ป้อน Phase 9
  startedAt: number | null;
  elapsedMs: number;
  lastFeedback: Feedback | null;
};
```

`errorsByCode` ใส่ไว้ตั้งแต่ตอนนี้ เพราะงานวิจัยต้องการสถิติว่านักเรียนพลาดเรื่องอะไรบ่อย ถ้าไม่เก็บตั้งแต่แรกจะย้อนกลับมาเก็บไม่ได้

---

## 4.3 คะแนนและดาว

`src/config/scoring.ts` ค่าทั้งหมดต้องอยู่ในไฟล์นี้ไฟล์เดียว ห้าม hard-code ใน component เพื่อให้ผู้วิจัยปรับได้หลังทดลองนำร่อง

```ts
export const SCORING = {
  startScore: 100,
  penaltyPerWrong: 5,
  maxWrongPenalty: 30,
  penaltyPerHint: 10,
  maxHintPenalty: 30,
  minPassScore: 40,
  starThresholds: { three: 90, two: 70, one: 40 },
} as const;
```

```
score = clamp(
  100 - min(wrongAttempts * 5, 30) - min(hintsUsed * 10, 30),
  40, 100
)
```

ดาว 3 ดวงที่ 90-100 · 2 ดวงที่ 70-89 · 1 ดวงที่ 40-69

ปลดล็อกด่านถัดไปทันทีที่ผ่าน ไม่ผูกกับจำนวนดาว · replay เก็บเฉพาะผลที่ดีที่สุด แต่ `attempts` เพิ่มทุกครั้ง

---

## 4.4 ระบบคำใบ้ 3 ระดับ

ตาม D-05 กดได้สูงสุด 3 ครั้งต่อด่าน หัก 10 คะแนนต่อครั้ง

| ระดับ | หน้าที่ | ตัวอย่างด่าน 01 |
|---|---|---|
| 1 | ชี้หลักการกว้าง ๆ | ปฏิกิริยานี้เกิดจากการแลกคู่ระหว่างไอออนบวกกับไอออนลบที่มาจากคนละสาร |
| 2 | ชี้ไอออนที่ควรสนใจ | ลองพิจารณาว่าไอออนเงินจับกับไอออนใดแล้วได้สารที่ไม่ละลายน้ำ |
| 3 | ชี้กฎการละลายที่เกี่ยวข้อง | กฎ เกลือคลอไรด์ละลายน้ำ ยกเว้นเมื่อจับกับ Ag+ หรือ Pb2+ |

ระดับ 3 บอกกฎ แต่ยังไม่บอกสูตรผลิตภัณฑ์ ผู้เล่นต้องประกอบเอง

**ต้องมีเทสต์** ว่าข้อความคำใบ้ทุกข้อไม่มีสูตรของตะกอนอยู่ในนั้น (กฎข้อ 11 ใน Phase 2)

---

## 4.5 การจับเวลา

- เริ่มนับเมื่อกด START_LEVEL ไม่ใช่ตอนเข้า route
- หยุดนับเมื่อ `document.visibilityState` เป็น hidden แล้วนับต่อเมื่อกลับมา
- เก็บเป็น `elapsedMs` สะสม ไม่ใช่ timestamp เริ่มต้น เพื่อให้ refresh แล้วเวลาไม่กระโดด
- refresh กลางด่านแล้วโหลด checkpoint ต้อง**ไม่เพิ่ม `attempts` ซ้ำ**

---

## 4.6 ข้อความ feedback

| รหัส | สถานการณ์ | ข้อความ |
|---|---|---|
| `E-CHARGE` | ประจุผลิตภัณฑ์ไม่เป็นศูนย์ | ประจุรวมของสารประกอบยังไม่เป็นศูนย์ ลองปรับจำนวนไอออน |
| `E-PAIR` | จับคู่ไอออนผิด | ไอออนคู่นี้ไม่ใช่ผลิตภัณฑ์ของปฏิกิริยานี้ |
| `E-PHASE` | สถานะละลายผิด | ตรวจสอบกฎการละลายของผลิตภัณฑ์อีกครั้ง |
| `E-BALANCE` | ดุลไม่ครบ | จำนวนอะตอมบางธาตุยังไม่เท่ากันทั้งสองข้าง |
| `E-RATIO` | อัตราส่วนไม่ต่ำสุด | สมการสมดุลแล้ว แต่ยังลดสัมประสิทธิ์ได้ |
| `E-SPECTATOR` | ตัดไอออนผิด | ตัดได้เฉพาะไอออนที่เหมือนกันและไม่เปลี่ยนแปลงทั้งสองข้าง |

ทุกข้อความบอก**หลักการที่ผิด** ไม่บอกคำตอบ

---

## ไฟล์ที่จะสร้าง

```
src/domain/game/
├── gameMachine.ts       reducer + transition table
├── events.ts            union ของ event ทั้งหมด
├── guards.ts            เงื่อนไขออกของแต่ละสถานะ
├── scoring.ts           คำนวณคะแนนและดาว
├── hints.ts             ตรรกะคำใบ้
├── timer.ts             จับเวลาแบบสะสม
└── selectors.ts         อ่านค่าที่ derive ได้

src/config/
└── scoring.ts           ค่าคงที่ที่ผู้วิจัยปรับได้
```

---

## Definition of Done

- [ ] reducer เป็นฟังก์ชันบริสุทธิ์ ไม่มี side effect ไม่แตะ localStorage เอง
- [ ] event ที่ส่งผิดสถานะต้องถูกเพิกเฉย ไม่ throw และไม่เปลี่ยน state
- [ ] ทดสอบเส้นทางสมบูรณ์ของด่าน 01 ตั้งแต่ levelIntro ถึง levelComplete
- [ ] ทดสอบเส้นทางด่านที่ต้องดุล เช่นด่าน 13 และด่าน 42
- [ ] ทดสอบว่าด่าน 01-10 ข้าม balanceEquation จริง
- [ ] ทดสอบคะแนน ผิด 3 ครั้งใช้คำใบ้ 2 ครั้ง ได้ 100-15-20 = 65 คะแนน 1 ดาว
- [ ] ทดสอบว่าคะแนนไม่ต่ำกว่า 40 แม้ผิดและใช้คำใบ้เต็มเพดาน
- [ ] ทดสอบว่าคำใบ้ทั้ง 150 ข้อไม่มีสูตรตะกอน

---

## กับดักที่ต้องระวัง

| กับดัก | ผลที่ตามมา |
|---|---|
| ใส่ boolean แยกแทน phase เดียว | เกิดสถานะที่เป็นไปไม่ได้ เช่นทั้ง gold และ error พร้อมกัน |
| ให้ reducer เรียก save เอง | ทดสอบยากและเกิด side effect ซ้อน ให้ layer บนเป็นคนเรียก |
| นับเวลาจาก timestamp เริ่มต้น | refresh แล้วเวลากระโดดเป็นชั่วโมง ต้องสะสมเป็น elapsedMs |
| เพิ่ม attempts ตอนโหลด checkpoint | สถิติงานวิจัยเพี้ยน นักเรียนดูเหมือนพยายามเยอะเกินจริง |
| ลืมว่าด่านไม่ต้องดุลก็ต้องผ่าน guard | ถ้า skip แบบ hard-code จะมีสองเส้นทางที่ทดสอบไม่ครบ |
| เก็บ errorsByCode ทีหลัง | ข้อมูลวิจัยที่สำคัญที่สุดหายไปทั้งงาน ย้อนกลับมาเก็บไม่ได้ |
