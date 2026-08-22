# Phase 1 · โดเมนเคมี

> **เป้าหมาย:** ตรรกะเคมีทั้งหมดทำงานถูกต้องและทดสอบครบ โดยยังไม่มี React แม้แต่บรรทัดเดียว
> **ต้องรอ:** Phase 0
> **หลักการเหล็ก:** ตัดสินเคมีจาก**ข้อมูลโครงสร้าง**เท่านั้น ห้าม parse สตริงสูตรเพื่อหาประจุ จำนวนอะตอม หรือจับคู่ไอออนผู้ชม

โฟลเดอร์นี้ต้อง import React ไม่ได้เลย ถ้าวันไหนต้อง import แปลว่าออกแบบผิด

---

## 1.1 ทะเบียนไอออน

`src/domain/chemistry/ions.ts`

```ts
export type IonDef = {
  ionId: string;                    // 'silver-plus'
  core: string;                     // 'Ag'  — สูตรไม่มีประจุ
  charge: number;                   // +1 / -2 ...
  nameTh: string;                   // 'ซิลเวอร์(I) ไอออน'
  polyatomic: boolean;              // ต้องใส่วงเล็บเมื่อ subscript > 1
  atoms: Readonly<Record<string, number>>;  // { Ag: 1 } / { N: 1, O: 3 }
};
```

ฟิลด์ `atoms` คือหัวใจ เพราะทำให้ทดสอบการอนุรักษ์อะตอมได้จริง ไม่ใช่แค่เชื่อว่าสูตรถูก

**ไอออนบวก 12 ตัว**

| ionId | core | charge | ชื่อไทย |
|---|---|---|---|
| `sodium-plus` | Na | +1 | โซเดียมไอออน |
| `potassium-plus` | K | +1 | โพแทสเซียมไอออน |
| `ammonium` | NH4 | +1 | แอมโมเนียมไอออน |
| `silver-plus` | Ag | +1 | ซิลเวอร์(I) ไอออน |
| `calcium-2plus` | Ca | +2 | แคลเซียมไอออน |
| `magnesium-2plus` | Mg | +2 | แมกนีเซียมไอออน |
| `copper-2plus` | Cu | +2 | คอปเปอร์(II) ไอออน |
| `iron-2plus` | Fe | +2 | ไอรอน(II) ไอออน |
| `barium-2plus` | Ba | +2 | แบเรียมไอออน |
| `lead-2plus` | Pb | +2 | เลด(II) ไอออน |
| `iron-3plus` | Fe | +3 | ไอรอน(III) ไอออน |
| `aluminium-3plus` | Al | +3 | อะลูมิเนียมไอออน |

**ไอออนลบ 10 ตัว**

| ionId | core | charge | polyatomic | ชื่อไทย |
|---|---|---|---|---|
| `nitrate` | NO3 | -1 | ใช่ | ไนเตรตไอออน |
| `chloride` | Cl | -1 | | คลอไรด์ไอออน |
| `bromide` | Br | -1 | | โบรไมด์ไอออน |
| `iodide` | I | -1 | | ไอโอไดด์ไอออน |
| `hydroxide` | OH | -1 | ใช่ | ไฮดรอกไซด์ไอออน |
| `thiocyanate` | SCN | -1 | ใช่ | ไทโอไซยาเนตไอออน |
| `sulfate` | SO4 | -2 | ใช่ | ซัลเฟตไอออน |
| `carbonate` | CO3 | -2 | ใช่ | คาร์บอเนตไอออน |
| `sulfide` | S | -2 | | ซัลไฟด์ไอออน |
| `phosphate` | PO4 | -3 | ใช่ | ฟอสเฟตไอออน |

> **ตัดออกจากสำรับการ์ดเดิม:** O2- และ MnO4 2- ตามเหตุผลใน D-02
> **CN-** ตัดออกด้วย เพราะเป็นสารพิษร้ายแรงและตะกอนไซยาไนด์ไม่อยู่ในหลักสูตร ม.4

---

## 1.2 กฎการละลาย

`src/domain/chemistry/solubility.ts`

```ts
export type Phase = 'aq' | 's';
export function resolvePhase(cationId: string, anionId: string): Phase;
```

ใช้ตารางกฎเรียงตามลำดับความสำคัญ กฎที่อยู่บนสุดชนะ

| ลำดับ | กฎ | ผล |
|---|---|---|
| 1 | ไอออนบวกเป็น Na+, K+, NH4+ | ละลาย |
| 2 | ไอออนลบเป็น NO3- | ละลาย |
| 3 | Cl-, Br-, I- จับกับ Ag+ หรือ Pb2+ | ตกตะกอน |
| 4 | Cl-, Br-, I- อื่น ๆ | ละลาย |
| 5 | SO4 2- จับกับ Ba2+, Pb2+, Ca2+, Ag+ | ตกตะกอน |
| 6 | SO4 2- อื่น ๆ | ละลาย |
| 7 | OH- จับกับ Ba2+ | ละลาย |
| 8 | OH- อื่น ๆ | ตกตะกอน |
| 9 | CO3 2-, PO4 3-, S2- (กฎ 1 ครอบข้อยกเว้นไว้แล้ว) | ตกตะกอน |
| 10 | SCN- จับกับ Ag+, Pb2+ | ตกตะกอน |
| 11 | SCN- อื่น ๆ | ละลาย |

> **สำคัญที่สุด:** ตารางนี้คือ source of truth เดียวสำหรับ (aq) กับ (s) ทั้งเกม ห้ามมีที่อื่นตัดสินเรื่องนี้อีก
> ต้องส่งตารางนี้ให้อาจารย์ตรวจพร้อมข้อมูลด่านใน Phase 2 โดยเฉพาะ **CaSO4 และ Ag2SO4 ที่ละลายน้อย** ว่าจะนับเป็นตะกอนหรือไม่

---

## 1.3 สร้างสูตรสารประกอบ

`src/domain/chemistry/formula.ts`

```ts
export type FormulaPart =
  | { kind: 'text'; value: string }
  | { kind: 'sub'; value: string }      // ตัวห้อย
  | { kind: 'sup'; value: string };     // ตัวยก (ประจุ)

export type FormulaAst = FormulaPart[];

export function buildCompound(cation: IonDef, anion: IonDef): CompoundDef;
export function renderFormula(compound: CompoundDef): FormulaAst;
export function renderIon(ion: IonDef, count?: number): FormulaAst;
```

**อัลกอริทึมไขว้ประจุ:**

1. `g = gcd(|charge_cation|, |charge_anion|)`
2. `n_cation = |charge_anion| / g` และ `n_anion = |charge_cation| / g`
3. ถ้า `n > 1` และไอออนเป็น polyatomic ให้ใส่วงเล็บ

| ตัวอย่าง | ประจุ | ผล |
|---|---|---|
| Ca2+ กับ NO3- | 2, 1 | `Ca(NO3)2` ใส่วงเล็บเพราะ polyatomic และ n=2 |
| Al3+ กับ SO4 2- | 3, 2 | `Al2(SO4)3` |
| Mg2+ กับ CO3 2- | 2, 2 | `MgCO3` เพราะ g=2 ลดเหลือ 1:1 ไม่ใช่ `Mg2(CO3)2` |
| Fe3+ กับ PO4 3- | 3, 3 | `FePO4` |
| Ca2+ กับ PO4 3- | 2, 3 | `Ca3(PO4)2` |

**เหตุผลที่ต้องคืนเป็น AST ไม่ใช่สตริง:** spec ห้าม parse HTML เพื่อ render สูตร และเราต้องสร้าง aria-label ภาษาไทยแยกจากภาพที่เห็น การมี AST ทำให้ทั้งภาพและเสียงอ่านมาจากแหล่งเดียวกัน

**ต้องทดสอบ:** ทุกคู่ไอออนที่เป็นไปได้ 12 x 10 = 120 คู่ ต้องได้สูตรที่ประจุรวมเป็นศูนย์

---

## 1.4 ดุลสมการ

`src/domain/chemistry/balance.ts`

```ts
export type Coefficients = { a: number; b: number; c: number; d: number };

export function balanceDoubleDisplacement(
  reactantA: CompoundDef, reactantB: CompoundDef,
  productA: CompoundDef, productB: CompoundDef,
): Coefficients;
```

**วิธีคิด:** ปฏิกิริยาแลกคู่ไม่มีการเปลี่ยนเลขออกซิเดชัน จำนวน**หน่วยไอออน**แต่ละชนิดจึงคงที่ทั้งสองข้าง ใช้เป็นสมการอนุรักษ์ 4 สมการ แล้วหาคำตอบจำนวนเต็มบวกที่น้อยที่สุด

```
a*A + b*B -> c*C + d*D
สำหรับไอออนแต่ละชนิด k:   a*n(A,k) + b*n(B,k) = c*n(C,k) + d*n(D,k)
```

ค้นแบบ brute force ที่ `a,b,c,d` อยู่ในช่วง 1 ถึง 12 เลือกชุดที่ผลรวมน้อยที่สุด แล้วหารด้วย gcd ทั้งสี่ตัว ช่วงค้นหา 12 ยกกำลัง 4 ประมาณสองหมื่นชุด เร็วมากและพิสูจน์ความถูกต้องได้ง่ายกว่าการแก้เมทริกซ์

**ต้อง assert หลังได้คำตอบ:**
- จำนวนอะตอมของทุกธาตุเท่ากันสองข้าง โดยใช้ฟิลด์ `atoms` จาก IonDef
- ประจุรวมสองข้างเท่ากัน ต้องเป็นศูนย์ทั้งคู่เพราะสารประกอบเป็นกลาง
- `gcd(a,b,c,d) === 1` คืออัตราส่วนต่ำสุด

> กฎ E-RATIO ใน spec บังคับว่า 2:2:2:2 ต้องไม่ผ่านถ้าคำตอบคือ 1:1:1:1 การ assert gcd จึงไม่ใช่ของแถม แต่เป็นข้อกำหนดโดยตรง

---

## 1.5 ปฏิกิริยาและการจับคู่ผลิตภัณฑ์

`src/domain/chemistry/reaction.ts`

```ts
export function crossExchange(a: CompoundDef, b: CompoundDef): [CompoundDef, CompoundDef];

export function validateProductPairing(
  slots: ReadonlyArray<{ slotId: string; ionId: string | null }>,
  level: BuiltLevel,
): ValidationResult;
```

`crossExchange` ทำงานตรงไปตรงมา คือไอออนบวกจาก A จับกับไอออนลบจาก B และสลับกัน

**การตรวจการจับคู่ตาม D-03:** ช่อง 4 ช่องคือ 2 คู่ ได้แก่ช่อง `[0,1]` และ `[2,3]`

| เงื่อนไข | รหัสข้อผิดพลาด |
|---|---|
| ช่องยังไม่ครบ | ไม่มีรหัส ปุ่มตรวจยัง disabled อยู่ |
| ในคู่หนึ่งมี anion นำหน้า cation | `E-PAIR` |
| จับคู่ไอออนที่มาจากสารตั้งต้นเดียวกัน แปลว่าไม่ได้แลกคู่ | `E-PAIR` |
| คู่ที่ได้มีประจุรวมไม่เป็นศูนย์ | `E-CHARGE` |
| จับคู่ถูกแต่ระบุสถานะผิด | `E-PHASE` |

**ยอมรับได้ทั้งสองแบบ:** วางคู่ตะกอนไว้ก่อนหรือหลังคู่ที่ละลายน้ำก็ถือว่าถูก ไม่บังคับลำดับระหว่างคู่

---

## 1.6 ไอออนผู้ชมและสมการสุทธิ

`src/domain/chemistry/spectators.ts` และ `src/domain/chemistry/netIonic.ts`

```ts
export function findSpectators(level: BuiltLevel): SpectatorPair[];
export function buildNetIonic(level: BuiltLevel): NetIonicEquation;
```

**นิยาม spectator:** เป็น species เดียวกัน (`ionId` ตรงกัน) ประจุเท่ากัน สถานะเท่ากันคือ aq ทั้งคู่ และ**จำนวนเท่ากันทั้งสองข้าง**

จับคู่ด้วย `ionId + charge + phase + count` ห้ามเทียบสตริงสูตรเด็ดขาด

> **ทำไมตัดทั้งใบได้:** ในปฏิกิริยาแลกคู่ที่ดุลถูกแล้ว ไอออนที่ไม่เข้าปฏิกิริยาจะปรากฏสองข้างในจำนวนเท่ากันเสมอ พิสูจน์ได้จากสมการอนุรักษ์ในข้อ 1.4 จึงตัดการ์ด `2NO3-` ครั้งเดียวได้อย่างถูกต้องตาม D-03

**สมการสุทธิต้องผ่านสามข้อ:** อะตอมทุกธาตุเท่ากัน · ประจุรวมสองข้างเท่ากัน · ตะกอนคงเป็นสารประกอบ (s) ไม่แตกเป็นไอออน

---

## ไฟล์ที่จะสร้าง

```
src/domain/chemistry/
├── types.ts             type ร่วมทั้งโดเมน
├── ions.ts              ทะเบียนไอออน 22 ตัว
├── solubility.ts        กฎการละลาย 11 ข้อ
├── formula.ts           ไขว้ประจุ + AST
├── compounds.ts         CompoundDef และ helper
├── balance.ts           ดุลสมการ
├── reaction.ts          แลกคู่ + ตรวจการจับคู่
├── spectators.ts        จับคู่ไอออนผู้ชม
└── netIonic.ts          สมการสุทธิ
```

---

## Definition of Done

- [ ] ทุกไฟล์ในโฟลเดอร์นี้ไม่ import React หรือ next ใด ๆ เลย
- [ ] unit test ครอบทุกฟังก์ชันสาธารณะ ผ่านทั้งหมด
- [ ] ทดสอบสูตรครบทั้ง 120 คู่ไอออน ประจุรวมเป็นศูนย์ทุกคู่
- [ ] ทดสอบการดุลกับกรณีตัวแทนทุกอัตราส่วน 1:1:1:1, 1:2:1:2, 2:1:1:2, 1:3:1:3, 3:2:1:6
- [ ] ทดสอบว่าไม่มีที่ไหนตัดสิน (aq) หรือ (s) นอกจาก `solubility.ts`
- [ ] ทดสอบ negative ครบทุกรหัสข้อผิดพลาด จับคู่ผิดต้องได้รหัสที่ถูกต้อง

## กับดักที่ต้องระวัง

| กับดัก | ทำไมอันตราย |
|---|---|
| เผลอเทียบสูตรด้วยสตริง | Fe2+ กับ Fe3+ มี core เป็น `Fe` เหมือนกัน แยกได้ด้วย charge เท่านั้น |
| ลืมลดอัตราส่วนด้วย gcd | ได้ `Mg2(CO3)2` ซึ่งผิด ต้องเป็น `MgCO3` |
| ลืมวงเล็บ polyatomic | ได้ `CaNO32` ซึ่งอ่านไม่ได้ ต้องเป็น `Ca(NO3)2` |
| ช่วง brute force แคบไป | ด่านอย่าง `Al2(SO4)3 + 3BaCl2` ต้องใช้สัมประสิทธิ์ถึง 6 ช่วง 1 ถึง 12 พอ แต่ต้อง assert ว่าเจอคำตอบจริง ห้ามคืนค่า default เงียบ ๆ |
| สมมติว่าตะกอนมีตัวเดียวเสมอ | MVP กำหนดไว้แบบนั้นจริง แต่ต้องตรวจแล้ว**โยน error** ถ้าข้อมูลด่านให้ตะกอน 2 ตัว ไม่ใช่ปล่อยผ่านเงียบ ๆ |
| ทำ formula เป็นทั้ง presentation และ logic | ถ้าวันหนึ่งเปลี่ยนวิธี render สูตร ตรรกะเคมีต้องไม่พัง แยกให้ขาดตั้งแต่แรก |
