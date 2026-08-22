# แผนพัฒนา Ion Clash Web

เอกสารชุดนี้แตกงานสร้างเว็บเกม Ion Clash ออกเป็น 12 phase เรียงตามลำดับที่ต้องทำจริง
ทุก phase มีเงื่อนไขเข้า–ออกชัดเจน เพื่อให้ตรวจสอบได้ว่า "เสร็จ" แปลว่าอะไร

## แหล่งอ้างอิงหลัก

| เอกสาร | บทบาท |
|---|---|
| `Ion_Clash-frontend-requirements_spec.md` | ข้อกำหนดหลัก — ชนะเสมอเมื่อขัดแย้งเรื่องพฤติกรรม |
| `Ion_Clash-Website_UI.pdf` | อ้างอิงหน้าตา 12 หน้า — ชนะเมื่อขัดแย้งเรื่อง layout |
| `Ion_Clash-Proposal.pdf` | บริบทงานวิจัย เป้าหมาย E1/E2 กลุ่มตัวอย่าง 8 คน |
| `card file/*.pptx` | สำรับการ์ดกายภาพ — กำหนดขอบเขตไอออนตั้งต้น |
| `00-decisions.md` | ข้อตัดสินใจที่ตกลงกันแล้ว พร้อมเหตุผล |

> เมื่อ spec กับ UI PDF ขัดกัน ให้ **ความถูกต้องทางเคมี** และ **Acceptance Criteria** มาก่อนความสวยงามเสมอ

## ลำดับ Phase

| Phase | ชื่อ | ผลลัพธ์ที่จับต้องได้ | ต้องรออะไร |
|---|---|---|---|
| 0 | [รากฐานโครงการ](01-phase-0-foundation.md) | repo public + โปรเจกต์เปล่าที่ build ผ่าน + CI เขียว | — |
| 1 | [โดเมนเคมี](02-phase-1-chemistry-domain.md) | ตรรกะเคมีบริสุทธิ์ + unit test ครบ | 0 |
| 2 | [ข้อมูล 50 ด่าน](03-phase-2-level-data.md) | 50 ด่านผ่าน validation + เอกสารให้อาจารย์ตรวจ | 1 |
| 3 | [ระบบบันทึก](04-phase-3-storage-save.md) | save/load/checkpoint/export/import ทนพัง | 0 |
| 4 | [State Machine เกม](05-phase-4-game-state.md) | reducer 9 สถานะ + คะแนน + คำใบ้ | 1, 3 |
| 5 | [Design System](06-phase-5-design-system.md) | token, การ์ด, สมการ, โครงหน้า | 0 |
| 6 | [ระบบลาก–วาง](07-phase-6-interaction.md) | ลาก/แตะ/คีย์บอร์ด + เส้นตัดไอออน | 5 |
| 7 | [หน้าจอทั้งหมด](08-phase-7-screens.md) | 8 route ต่อกันครบ เล่นจบด่านได้ | 2, 4, 6 |
| 8 | [เนื้อหาการเรียนรู้](09-phase-8-content.md) | /knowledge, /how-to-play, คำใบ้ 150 ข้อ | 7 |
| 9 | [ระบบเก็บข้อมูลวิจัย](10-phase-9-research.md) | event log + CSV + Google Sheet + หน้า /research | 7 |
| 10 | [ทดสอบและ QA](11-phase-10-testing-qa.md) | E2E 3 โหมดอินพุต 3 ขนาดจอ + a11y | 8, 9 |
| 11 | [Deploy และส่งมอบ](12-phase-11-deploy-handoff.md) | เว็บออนไลน์ + README + คู่มือวันทดลอง | 10 |

## เส้นทางวิกฤต

```
0 ──► 1 ──► 2 ──┐
 │              ├──► 7 ──► 8 ──┐
 ├──► 3 ──► 4 ──┤              ├──► 10 ──► 11
 └──► 5 ──► 6 ──┘         9 ───┘
```

Phase 3 และ 5 ทำคู่ขนานกับ 1–2 ได้ เพราะไม่พึ่งข้อมูลเคมี
Phase 9 เริ่มได้ทันทีที่ 7 เสร็จ ไม่ต้องรอ 8

## Definition of Done ของทั้งโปรเจกต์

อ้างจาก spec หัวข้อ "Definition of Done" — ทุกข้อต้องผ่านก่อนถือว่าส่งมอบ

- [ ] `npm run lint` · `npm run typecheck` · `npm test` · `npm run build` ผ่านทั้งหมด
- [ ] ข้อมูล 50 ด่านผ่าน chemistry/data validation อัตโนมัติ
- [ ] ผู้ตรวจเนื้อหาเคมีอนุมัติสมการและสถานะของสารครบ 50 ด่าน
- [ ] ทดสอบจริงบน Safari iPad อย่างน้อย 1 รอบ
- [ ] ไม่มี console error ทั้ง happy path และ error path
- [ ] Save schema มี version, migration test, export/import และ reset
- [ ] README ระบุวิธี run, test, build, deploy และวิธีแก้ข้อมูลด่าน

## หมายเหตุการใช้เอกสารชุดนี้

ทุก phase เขียนแบบ "อ่านแล้วลงมือได้เลย" — มีรายชื่อไฟล์ที่จะสร้าง เงื่อนไขผ่าน และกับดักที่ต้องระวัง
ถ้าระหว่างทางพบว่าข้อตัดสินใจใดใช้ไม่ได้จริง ให้แก้ที่ `00-decisions.md` ก่อน แล้วค่อยแก้ phase ที่เกี่ยวข้อง
