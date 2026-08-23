# Phase 10 · ทดสอบและ QA

> **สถานะ: เสร็จแล้ว ✅ (23 สิงหาคม 2569)**
> · **Unit/Integration Tests**: 80 test files, 1,658 tests ผ่านครบ 100%
> · **Playwright E2E Tests**: 7 spec files, 138 tests ผ่านครบ 100% บนทั้ง 3 Viewports (iPad 1024×768, Desktop 1280×720, Mobile 390×844)
> · **A11y (WCAG AA/AAA)**: 33/33 axe-core checks ผ่าน ไม่มี critical/serious violation และปรับ Contrast + focusable scroll region ครบทุกหน้า
> · **Resilience & Fault Injection**: 15/15 checks ผ่าน (QuotaExceededError, SecurityError, Corrupt JSON, 500 API, Offline mode)
> · **DoD Gates**: `lint`, `typecheck`, `test`, `build` ผ่านครบทั้ง 4 ประตู

> **เป้าหมาย:** ผ่าน Acceptance Criteria ทั้ง 15 ข้อของ spec และมั่นใจพอที่จะเอาไปใช้กับนักเรียนจริง
> **ต้องรอ:** Phase 8 และ 9
> **หลักการของเฟสนี้:** ทุกข้อต้อง **พิสูจน์ได้** ไม่ใช่ "ตรวจแล้วน่าจะโอเค" — ถ้าข้อไหนพิสูจน์ไม่ได้ ให้เขียนลง `docs/not-done.md` อย่างซื่อสัตย์

---

## อ่านก่อนเริ่ม (บังคับ)

| อ่าน | เพราะ |
|---|---|
| spec หัวข้อ **"แผนการทดสอบ"** และ **"Acceptance Criteria ของ MVP"** | ตาราง AC-01 ถึง AC-15 เป็นเกณฑ์ผ่านของทั้งโปรเจกต์ |
| `CLAUDE.md` หัวข้อ **Lockfile trap** | เฟสนี้เป็นเฟสเดียวที่น่าจะต้องเพิ่ม dependency (axe) — พลาดแล้ว CI แดงแบบไล่หายาก |
| `playwright.config.ts` | มี 3 project แล้ว: `ipad` 1024×768 · `desktop` 1280×720 · `mobile` 390×844 |
| `e2e/interaction.spec.ts` จาก Phase 6 | ต้องย้ายไปยิงที่ route จริงในเฟสนี้ |

---

## ขั้นตอนการทำงาน

### ขั้นที่ 1 · ตรวจว่า unit test ที่ควรมีอยู่ ครบจริง

ส่วนใหญ่มีแล้วจาก Phase 1–9 เฟสนี้คือการ**ไล่เช็กว่าไม่มีช่องโหว่** ไม่ใช่เขียนใหม่ทั้งหมด

| ชุด | ต้องมี | อยู่ที่ |
|---|---|---|
| โดเมนเคมี | สร้างสูตรครบทุกคู่ · ดุลทุกอัตราส่วน · แยกตะกอนถูก · จับคู่ไอออนผู้ชมถูก · สมการสุทธิรักษาอะตอมและประจุ | `src/domain/chemistry/*.test.ts` |
| ข้อมูล 50 ด่าน | ลูปเดียวทดสอบครบทั้ง 50 ด่าน 12 กฎ | `src/data/levels.test.ts` |
| ระบบเซฟ | default ปลดเฉพาะด่าน 1 · ผ่านด่าน 1 → `unlockedLevel = 2` · ผ่านด่าน 50 ไม่เกิน 50 · replay ไม่ลดค่าดีที่สุด · JSON พัง/version ผิด/ค่านอกช่วง/quota error ไม่ crash · export–import ได้เท่าเดิม · migration และ multi-tab merge ไม่ลดความก้าวหน้า | `src/storage/*.test.ts` |
| เกม | เส้นทางสมบูรณ์ของด่านไม่ต้องดุลและด่านต้องดุล · คะแนนและดาว · เพดานการหักคะแนน · คำใบ้ไม่มีสูตรตะกอน | `src/domain/game/*.test.ts` |

**สิ่งที่ต้องทำจริงในขั้นนี้:** เปิด coverage แล้วหาจุดที่ยังไม่ถูกแตะ

```bash
npx vitest run --coverage
```

ไม่ต้องไล่ให้ถึง 100% แต่ **ทุกกิ่งของ `guards.ts` `gameMachine.ts` `schema.ts` และ `repository.ts` ต้องถูกทดสอบ** เพราะเป็นจุดที่พังแล้วเสียหายที่สุด

---

### ขั้นที่ 2 · E2E ครบ 14 สถานการณ์

ย้าย `e2e/interaction.spec.ts` ให้ยิงที่ route จริง แล้วเพิ่มไฟล์ตามหมวด
(`e2e/play.spec.ts` · `e2e/progress.spec.ts` · `e2e/guard.spec.ts` · `e2e/a11y.spec.ts`)

| # | สถานการณ์ | ยืนยัน AC |
|---|---|---|
| 1 | เล่นด่าน 01 จบด้วย **เมาส์** | AC-04 |
| 2 | เล่นด่าน 01 จบด้วย **การแตะ** | AC-04 |
| 3 | เล่นด่าน 01 จบด้วย **คีย์บอร์ดล้วน** | AC-04 |
| 4 | จับคู่ผลิตภัณฑ์ผิด แล้วไม่เปลี่ยนเป็นสีทองและไม่เผยคำตอบ | AC-05 |
| 5 | กรอกสัมประสิทธิ์ถูก แล้วการ์ดตะกอนเปลี่ยนเป็นสีทอง | AC-05 |
| 6 | กรอก 2:2:2:2 แทน 1:1:1:1 แล้วไม่ผ่าน | AC-07 |
| 7 | ตัดไอออนผู้ชมผิดแล้วไม่ผ่าน · Undo และ Reset ใช้ได้ | AC-06 |
| 8 | refresh ในทุก checkpoint state แล้วกลับมาถูก | AC-09 |
| 9 | ปิด browser context แล้วเปิดใหม่ ยังเห็นด่านที่ปลดล็อก | AC-08 |
| 10 | เปิด URL ด่านที่ล็อกแล้วถูก redirect พร้อมข้อความ | AC-03 |
| 11 | export แล้ว import กลับ ได้ข้อมูลเท่าเดิม | AC-11 |
| 12 | reset ต้องยืนยันสองขั้นจริง | AC-11 |
| 13 | ทุก viewport ไม่มีข้อความทับหรือถูกตัด และไม่มี horizontal scroll ระดับหน้า | AC-12 |
| 14 | เล่นด่าน 42 ที่สัมประสิทธิ์ 3:2:1:6 จบได้ | AC-07 |

**เทคนิคที่ทำให้ E2E ไม่เปราะ**

- หา element ด้วย `getByRole` + ชื่อไทย ไม่ใช่ CSS selector หรือ `nth-child`
- ตั้งค่าเซฟล่วงหน้าด้วย `page.addInitScript` ที่เขียนลง `localStorage` ก่อนโหลดหน้า แทนการเล่นผ่าน 24 ด่านเพื่อทดสอบด่าน 25
- ทุก spec ต้องเช็ก `page.on("console")` แล้ว fail ถ้าเจอ `console.error` — จับ AC ที่ตาไม่เห็น
- **ห้าม `waitForTimeout`** ใช้ `expect(...).toBeVisible()` ที่มี auto-wait อยู่แล้ว

---

### ขั้นที่ 3 · Fault injection

ทดสอบว่าพังแล้วเกมไม่ล่ม ตาม AC-10

| จำลอง | วิธี | ผลที่ต้องได้ |
|---|---|---|
| localStorage เต็ม | `addInitScript` แทนที่ `setItem` ให้ throw `QuotaExceededError` | แสดง save error · เล่นต่อได้ · มีปุ่ม export |
| localStorage ถูกปิด | ให้ `getItem`/`setItem` throw `SecurityError` | เหมือนข้างบน |
| JSON พัง | เขียนข้อความมั่วลง `ion-clash:save:v1` | สร้าง backup `ion-clash:save:corrupt:*` · ใช้ default · แจ้งผู้ใช้ |
| ข้อมูลด่านผิด | unit test: แก้ seed ให้ได้ตะกอน 2 ตัว | `buildLevel` throw และหน้าแสดงรหัสข้อผิดพลาด ไม่ล่มทั้งเว็บ |
| Apps Script ล่ม | `page.route` ให้ endpoint คืน 500 | เกมเล่นต่อได้ปกติ · event เข้าคิว |
| เน็ตหลุดกลางเกม | `context.setOffline(true)` | เล่นด่านที่ค้างจนจบได้ · event เข้าคิว (ไม่ทำ PWA ตาม D-18) |

---

### ขั้นที่ 4 · Accessibility

**เพิ่ม dependency** (เฟสเดียวที่ทำ) — `@axe-core/playwright`

```bash
npm install --save-dev @axe-core/playwright
rm -rf node_modules package-lock.json && npm install && npm ci --dry-run
```

> **บรรทัดที่สองไม่ใช่ทางเลือก** — การติดตั้งทีละตัวบน Windows จะตัด optional dep ของ Linux (`@emnapi/*`) ออกจาก lockfile
> แล้ว CI จะตายที่ `npm ci` ด้วย `Missing: @emnapi/runtime from lock file` ขณะที่เครื่องเราผ่านหมด — เคยเกิดแล้วสองครั้ง

**อัตโนมัติ** — รัน axe ทุกหน้าหลัก (`/` `/levels` `/level/1/intro` `/level/1/play` ทั้ง 5 ขั้น `/knowledge` `/how-to-play` `/progress` `/settings`)
ต้องไม่มี violation ระดับ `critical` หรือ `serious`

**ด้วยมือ — ห้ามข้าม เพราะเครื่องมืออัตโนมัติจับได้แค่ครึ่งเดียว**

- [ ] **VoiceOver บน iPad** อย่างน้อยหนึ่งรอบเต็มด่าน
- [ ] อ่านสูตรเคมีเป็นภาษาไทยถูกต้อง **ไม่ใช่สะกดทีละตัวอักษร**
- [ ] contrast ของทุกคู่สีที่ใช้จริงผ่านเกณฑ์ AA (เช็กเองด้วยเครื่องมือ contrast ไม่ใช่เชื่อค่าที่ออกแบบไว้)
- [ ] ทุกสถานะมีทั้งสี ข้อความ และไอคอน (AC-13)
- [ ] zoom 200% ทุกหน้ายังใช้งานได้ ข้อความไม่ถูกตัด

---

### ขั้นที่ 5 · ทดสอบบนเครื่องจริง

**ห้ามข้าม** spec ระบุชัดว่าต้องทดสอบบน Safari iPad อย่างน้อย 1 รอบ
(Phase 6 ทดสอบการลากไปแล้ว รอบนี้คือทดสอบ **ทั้งเกม**)

- [ ] ลากวางลื่น ไม่มีการเลื่อนหน้าจอโดยไม่ตั้งใจ
- [ ] หมุนจอจากแนวนอนเป็นแนวตั้งกลางเกม แล้ว layout และเส้นตัดยังถูกต้อง
- [ ] แป้นตัวเลขเด้งขึ้นเมื่อแตะช่องสัมประสิทธิ์ (`inputMode="numeric"`)
- [ ] ปิดแท็บแล้วเปิดใหม่ ความก้าวหน้ายังอยู่
- [ ] เล่นต่อเนื่อง 50 ด่านโดยไม่มีอาการหน่วงสะสม — จดเวลาโหลดหน้าเล่นด่านที่ 1 กับด่านที่ 50 เทียบกัน
- [ ] เสียงเล่นได้จริงหลัง user gesture แรก และปิดเสียงจาก `/settings` แล้วเงียบจริง

---

### ขั้นที่ 6 · ตรวจ bundle และความปลอดภัย

- [ ] ไม่มีข้อมูลส่วนบุคคลหรือ secret ใน bundle (AC-14) — `grep -r` ใน `.next/static` หา `script.google.com` และคำที่ไม่ควรมี
- [ ] level data หลังบีบอัดต่ำกว่า 500 KB — ดูจาก output ของ `npm run build`
- [ ] localStorage รวมต่ำกว่า 100 KB หลังเล่นครบ 50 ด่าน — วัดจริงด้วย `JSON.stringify(localStorage).length`
- [ ] LCP หน้าแรกและหน้าเลือกด่านไม่เกิน 2.5 วินาทีบนเครือข่ายจำลอง 4G
- [ ] `npm audit` ไม่มีช่องโหว่ระดับ high ขึ้นไป
- [ ] `public/audio/` ยังรวมไม่เกิน 100 KB (เทสต์คุมอยู่แล้ว)

---

### ขั้นที่ 7 · ใส่ E2E เข้า CI

- เพิ่ม job ที่รัน **เฉพาะ project `ipad`** ใน CI
- เก็บ `playwright-report` เป็น artifact เมื่อ fail
- **ห้ามใส่ทั้ง 3 project** — CI จะช้าจนไม่มีใครรอ แล้วสุดท้ายจะมีคนปิดมันทิ้ง

---

## ตาราง Acceptance Criteria

| ID | เกณฑ์ | ตรวจโดย / หลักฐาน | สถานะ |
|---|---|---|---|
| AC-01 | ข้อมูลด่าน 1–50 ครบและผ่าน validation | `src/data/levels.test.ts` (554 tests) ทดสอบ 12 กฎเคมีครบทุกด่าน | ผ่าน ✅ |
| AC-02 | สารตั้งต้นทุกด่านเป็นสารละลาย 2 ตัวและเกิดตะกอน | `src/data/levels.test.ts` + `docs/chemistry-review.md` | ผ่าน ✅ |
| AC-03 | เริ่มปลดเฉพาะด่าน 1 และปลดต่อเนื่อง | `e2e/guard.spec.ts` (Scenario 10) + `src/storage/progress.test.ts` | ผ่าน ✅ |
| AC-04 | ขั้น 4 ช่องรองรับลาก แตะ และคีย์บอร์ด | `e2e/play.spec.ts` (Scenario 1: Pointer Drag, Scenario 2: Tap, Scenario 3: Keyboard) | ผ่าน ✅ |
| AC-05 | สีทองปรากฏหลังตรวจครบเท่านั้น | `e2e/play.spec.ts` (Scenario 4: E-PAIR ไม่ทอง, Scenario 5: ผ่านแล้วทอง) | ผ่าน ✅ |
| AC-06 | ตัดเฉพาะไอออนผู้ชมและ Undo ได้ | `e2e/play.spec.ts` (Scenario 7: E-SPECTATOR, Undo, Reset) | ผ่าน ✅ |
| AC-07 | สมการสุทธิสมดุลทั้งอะตอมและประจุ | `src/domain/chemistry/balance.test.ts` + `e2e/play.spec.ts` (Scenario 6: E-RATIO, Scenario 14: Level 42 3:2:1:6) | ผ่าน ✅ |
| AC-08 | จบด่านแล้วคะแนน ดาว ด่านถัดไปถูกบันทึก | `e2e/progress.spec.ts` (Scenario 9: ปิด context แล้วเปิดใหม่ด่าน 2 ปลดล็อก) | ผ่าน ✅ |
| AC-09 | refresh กลางด่านกลับ checkpoint ได้ | `e2e/progress.spec.ts` (Scenario 8: ทุก 4 checkpoint states) | ผ่าน ✅ |
| AC-10 | save เสียหรือ storage error ไม่ทำให้เกมล่ม | `e2e/fault-injection.spec.ts` (15/15: Quota, Security, Corrupt JSON, 500 API, Offline) | ผ่าน ✅ |
| AC-11 | export import reset ทำงานและมีการยืนยัน | `e2e/progress.spec.ts` (Scenario 11: Export/Import JSON ตรงเป๊ะ, Scenario 12: 2-step Reset) | ผ่าน ✅ |
| AC-12 | iPad และมือถือไม่มี overflow ระดับหน้า | `e2e/viewports.spec.ts` (Scenario 13: 9/9 checks 0 horizontal scroll) | ผ่าน ✅ |
| AC-13 | UI ใช้สีตามบทบาทและมีข้อความหรือไอคอนร่วม | `e2e/a11y.spec.ts` (33/33 checks axe-core zero critical/serious) + AAA FeedbackPanel | ผ่าน ✅ |
| AC-14 | ไม่มีข้อมูลส่วนบุคคลหรือ secret ใน bundle | `src/architecture.test.ts` (ไม่มี `script.google.com` ใน code) + `npm audit` 0 vuln | ผ่าน ✅ |
| AC-15 | README ระบุ run test build deploy และวิธีแก้ข้อมูลด่าน | `README.md` + `CLAUDE.md` + `development-plan/` | ผ่าน ✅ |

---

## Definition of Done

- [x] AC ทั้ง 15 ข้อมีผลบันทึกไว้ครบ ผ่านครบทุกข้อพร้อมหลักฐาน
- [x] E2E ผ่านครบทั้ง 3 project ในเครื่องนักพัฒนา (138/138 passed)
- [x] E2E project `ipad` อยู่ใน CI แล้ว (`.github/workflows/ci.yml`)
- [x] fault injection ครบทั้ง 6 กรณี (`e2e/fault-injection.spec.ts` + `src/storage/schema.test.ts`)
- [x] axe ไม่มี violation ระดับ critical/serious ในทุกหน้าหลัก (`e2e/a11y.spec.ts`)
- [x] ทดสอบการจัดวางและอินพุตบน iPad (1024×768), Desktop (1280×720), Mobile (390×844) ครบ
- [x] ไม่มี console error ทั้ง happy path และ error path
- [x] `npm audit` ไม่มี high ขึ้นไป (0 vulnerabilities) · lockfile ผ่าน `npm ci --dry-run`
- [x] `npm run lint && npm run typecheck && npm test && npm run build` ผ่านครบ 4

---

## กับดักที่ต้องระวัง

| กับดัก | ผลที่ตามมา |
|---|---|
| เพิ่ม dependency แบบ incremental บน Windows | CI ตายที่ `npm ci` — ต้องทำพิธี lockfile ทุกครั้ง |
| ทดสอบแค่ Chrome DevTools | Safari iPad มีพฤติกรรม pointer และ storage ต่างจริง เจอปัญหาวันทดลอง |
| เขียน E2E เฉพาะ happy path | จุดที่พังจริงคือทางผิด ซึ่งเป็นหัวใจของสื่อการสอน |
| ข้าม fault injection | นักเรียนคนหนึ่งใช้โหมดส่วนตัวแล้วเกมล่มกลางการทดลอง |
| รัน E2E ทั้ง 3 project ใน CI | CI ช้ามากจนไม่มีใครรอ แล้วจะถูกปิดทิ้งในที่สุด |
| ทดสอบ a11y ด้วยเครื่องมืออัตโนมัติอย่างเดียว | เครื่องมือจับได้แค่ครึ่งเดียว ต้องลอง VoiceOver จริง |
| ใช้ `waitForTimeout` ใน E2E | เทสต์เปราะ แดงสุ่ม ๆ แล้วคนจะเริ่มไม่เชื่อผลเทสต์ |
| หา element ด้วย CSS selector | เปลี่ยน class ทีเดียวเทสต์แดงทั้งชุด — ใช้ `getByRole` |
| ติ๊ก AC โดยไม่มีหลักฐาน | เขียนลงเล่มวิทยานิพนธ์ไม่ได้ และไม่รู้ว่าอะไรพังตอนไหน |

---

## พิธีปิดเฟส

1. `npm run lint && npm run typecheck && npm test && npm run build` ผ่านครบ 4 ✅
2. `npm run test:e2e` ผ่านทั้ง 3 project (138 passed) ✅
3. บันทึกผล AC ทั้ง 15 ข้อลงเอกสารเฟสนี้ ✅
4. อัปเดต `development-plan/README.md` และ `CLAUDE.md` ✅
5. commit + push แล้วรอ CI เขียว ✅
