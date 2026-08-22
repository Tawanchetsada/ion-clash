**ION CLASH / TECHNICAL HANDOFF**

**Frontend Requirements  
Specification**

ข้อกำหนดเว็บไซต์เกมสมการไอออนิกสำหรับ AI Coding Agent

> **เป้าหมายส่งมอบ:** สร้างเว็บ Frontend-only จำนวน 50 ด่าน ตาม UI อ้างอิง: แยกไอออน 4 → 4, สร้างผลิตภัณฑ์ตะกอน, ตัดไอออนผู้ชม, แสดงสมการไอออนิกสุทธิ และบันทึกความก้าวหน้าบนเครื่อง

| **รายการ**   | **ข้อกำหนด**                                                           |
|--------------|-----------------------------------------------------------------------|
| โครงการ      | Ion Clash: เกมการเรียนรู้สมการไอออนิกและปฏิกิริยาการเกิดตะกอน                 |
| กลุ่มเป้าหมาย   | นักเรียนชั้นมัธยมศึกษาปีที่ 4 และครูผู้สอนเคมี                                     |
| ผู้ใช้เอกสาร    | AI Coding Agent, Frontend Developer, ผู้ตรวจสอบเนื้อหาเคมี                 |
| ขอบเขตเทคนิค  | Next.js App Router + TypeScript; deploy บน Vercel; ไม่มี Backend ใน MVP |
| แหล่งอ้างอิง UI | Ion_Clash-Website_UI.pdf จำนวน 12 หน้า                                 |
| เวอร์ชัน       | 1.0 — 22 สิงหาคม 2569                                                  |

*เอกสารฉบับนี้ตั้งใจให้ AI Agent อ่านแล้วเริ่มสร้างโครงการได้โดยไม่ต้องเดาพฤติกรรมหลักของเกม*

# คำตัดสินสำคัญ: เซฟแต่ละด่านบนเครื่องได้

> **คำตอบ:** ทำได้ และเหมาะกับ MVP แบบ Frontend-only โดยใช้ localStorage เก็บด่านที่ปลดล็อก ด่านที่ผ่าน คะแนนสูงสุด ดาว จำนวนครั้งที่ลอง การตั้งค่า และด่านล่าสุด ผู้เล่นปิดเบราว์เซอร์แล้วกลับมาเล่นต่อได้บนเบราว์เซอร์และโดเมนเดิม

เลือก localStorage เพราะข้อมูลความก้าวหน้า 50 ด่านมีขนาดเล็กมากและไม่ต้องค้นหาแบบฐานข้อมูล ส่วน IndexedDB ยังไม่จำเป็นใน MVP และควรใช้เมื่ออนาคตต้องเก็บประวัติขนาดใหญ่ ไฟล์ หรือข้อมูลออฟไลน์จำนวนมาก

**ข้อจำกัดที่ต้องแจ้งผู้เล่น:** ข้อมูลอยู่ในเบราว์เซอร์ของเครื่องนั้น ไม่ซิงก์ข้ามอุปกรณ์ และอาจหายเมื่อผู้ใช้ล้างข้อมูลเว็บไซต์ ใช้โหมดไม่ระบุตัวตน หรือเปลี่ยนโดเมน

**มาตรการลดความเสี่ยง:** มีปุ่มส่งออกไฟล์บันทึก (.json), นำเข้าไฟล์บันทึก, รีเซ็ตความก้าวหน้าแบบยืนยันสองขั้น และตรวจความถูกต้องของข้อมูลก่อนโหลด

**ทางเลือกในอนาคต:** เพิ่มบัญชีผู้ใช้และ Cloud Save เป็น Phase 2 โดยไม่เปลี่ยนหน้าจอเกมหลัก หาก Storage Adapter ถูกแยกเป็นโมดูลตั้งแต่ต้น

## ลำดับความสำคัญของข้อกำหนด

| **คำ** | **ความหมายสำหรับ AI Agent**                      |
|--------|-------------------------------------------------|
| MUST   | ต้องทำครบ จึงถือว่าส่งมอบ MVP ผ่าน                    |
| SHOULD | ควรทำในรอบเดียวกัน หากไม่ทำต้องบันทึกเหตุผลและผลกระทบ  |
| MAY    | เพิ่มได้เมื่อไม่กระทบ MUST และไม่ทำให้เคมีหรือ UX ซับซ้อนขึ้น |

# สารบัญเชิงปฏิบัติ

1.  นิยามผลิตภัณฑ์ เป้าหมาย และขอบเขต

2.  แพลตฟอร์มเป้าหมายและ Design System

3.  โครงสร้างหน้าและเส้นทาง

4.  วงจรการเล่นหนึ่งด่าน

5.  ข้อกำหนดรายหน้าจอ

6.  State Machine และข้อมูล 50 ด่าน

7.  กฎเคมีและการตรวจคำตอบ

8.  คะแนน ดาว และการปลดล็อก

9.  ระบบ Local Save แบบละเอียด

10. สถาปัตยกรรม Component และโครงสร้างไฟล์

11. Responsive, Touch, Accessibility และ Performance

12. การทดสอบและ Acceptance Criteria

13. คำสั่งส่งต่องานให้ AI Coding Agent

14. ภาคผนวก: ตัวอย่าง Level และ Save Schema

# นิยามผลิตภัณฑ์

Ion Clash คือเว็บไซต์เกมการเรียนรู้ที่พาผู้เล่นทำความเข้าใจปฏิกิริยาการเกิดตะกอนผ่านตัวแทน 3 ระดับ ได้แก่ สิ่งที่สังเกตได้ ไอออนในสารละลาย และสัญลักษณ์/สมการเคมี โดยแต่ละด่านมีสารตั้งต้นชนิดสารละลาย 2 ตัว ทำปฏิกิริยาแลกเปลี่ยนคู่และต้องเกิดผลิตภัณฑ์ตะกอนอย่างน้อย 1 ตัว

> **เส้นชัยการเรียนรู้:** ผู้เล่นผ่านครบ 50 ด่านและอธิบายได้ว่าไอออนคู่ใดเกิดปฏิกิริยา ไอออนใดเป็นไอออนผู้ชม และเขียนสมการไอออนิกสุทธิได้อย่างถูกต้อง

## เป้าหมาย

- ทำให้การแยกสารละลายเป็นไอออน การรวมไอออนเป็นผลิตภัณฑ์ และการตัดไอออนผู้ชมเห็นเป็นขั้นตอนที่จับต้องได้

- ให้ผู้เรียนฝึกดุลสัมประสิทธิ์และรักษาทั้งจำนวนอะตอมกับประจุรวม

- ให้ผลย้อนกลับทันทีแต่ไม่เฉลยผลิตภัณฑ์ก่อนผู้เล่นผ่านการตรวจ

- รองรับการเล่นแบบไม่สมัครบัญชี และกลับมาเล่นต่อบนเครื่องเดิมได้

- ทำให้ข้อมูลทั้ง 50 ด่านเป็น Data-driven เพื่อแก้สมการโดยไม่ต้องแก้ Component

## นอกขอบเขต MVP

- ระบบบัญชีผู้ใช้ ระบบครู ระบบห้องเรียน ตารางคะแนนออนไลน์ หรือ Cloud Save

- เกมหลายผู้เล่นแบบ Real-time และการแข่งขันข้ามเครื่อง

- ระบบสร้างสมการเคมีทั่วไปที่อนุญาตปฏิกิริยาทุกชนิด; MVP จำกัดที่ปฏิกิริยาการเกิดตะกอนตามชุดข้อมูลที่ตรวจแล้ว

- Backend API, Database, Payment, Chat และการเก็บข้อมูลส่วนบุคคล

- การสร้างสมการ 50 ด่านแบบสุ่ม ณ เวลาเล่น; ด่านต้องมาจากข้อมูลที่ผู้เชี่ยวชาญตรวจสอบแล้ว

# แพลตฟอร์มเป้าหมายและข้อกำหนด Responsive

| **ลำดับ** | **แพลตฟอร์ม**         | **เป้าหมายการแสดงผล**                                      |
|----------|----------------------|-----------------------------------------------------------|
| 1        | iPad / Tablet แนวนอน | Primary: 1024×768 และ 1180×820; เล่นครบทุกขั้นด้วยการแตะและลาก |
| 2        | Desktop / Notebook   | 1280×720 ขึ้นไป; ใช้เมาส์และคีย์บอร์ดได้ครบ                       |
| 3        | มือถือแนวนอน           | ขั้นต่ำ 667×375; ลดขนาดการ์ดและให้สมการเลื่อนในกรอบเฉพาะส่วน      |
| 4        | มือถือแนวตั้ง            | รองรับการอ่านและเล่นแบบเรียงส่วน; ห้ามบังคับใช้หน้าจอ 16:9 แบบตายตัว |

- **MUST** ใช้ CSS Grid/Flex และหน่วยยืดหยุ่น; หลีกเลี่ยงการวางตำแหน่งแบบ absolute สำหรับโครงหลัก

- **MUST** ไม่มี horizontal overflow ของทั้งหน้า; อนุญาตเฉพาะแถบสมการที่มี affordance ให้เลื่อน

- **MUST** ใช้ touch target อย่างน้อย 44×44 CSS px

- **MUST** รองรับ Pointer Events: mouse, touch และ stylus

- **SHOULD** ใช้ clamp() สำหรับขนาดตัวอักษร/การ์ด และคำนึงถึง safe-area-inset บนอุปกรณ์พกพา

# Design System ตาม UI อ้างอิง

หน้าตาเว็บต้องรักษาภาษาภาพจาก PDF: พื้นกรมท่า เส้นและสถานะสำคัญสีทอง การ์ดไอออนบวกสีน้ำเงิน การ์ดไอออนลบสีเขียว และการ์ดผลิตภัณฑ์ตะกอนสีทองหลังตรวจถูกเท่านั้น

| **Token**    | **ค่าแนะนำ**                  | **การใช้งาน**                         |
|--------------|------------------------------|--------------------------------------|
| color.navy   | \#082541                     | Header, ปุ่มหลักแบบกรม, ข้อความสำคัญ      |
| color.blue   | \#1F5FAA                     | การ์ดไอออนบวก, current step           |
| color.green  | \#2B8846                     | การ์ดไอออนลบ, success support         |
| color.gold   | \#F1BE2D                     | ผลิตภัณฑ์ตะกอนที่ผ่าน, CTA, active step    |
| color.canvas | \#EAF4FB                     | พื้นหลังหน้าการเล่น                       |
| color.error  | \#C63C45                     | คำตอบผิด, เส้นตัดผิด, validation message |
| radius.card  | 16px                         | Panel และ card หลัก                   |
| shadow.card  | 0 8px 24px rgba(8,37,65,.10) | ยก panel โดยไม่ดูหนัก                   |

## กติกาการใช้สี

- ก่อนตรวจคำตอบ การ์ดไอออนคงสีน้ำเงิน/เขียว และผลิตภัณฑ์ยังไม่เป็นสีทอง

- เมื่อจับคู่ถูก สมดุลประจุถูก สถานะการละลายถูก และผ่าน validation แล้ว จึงเปลี่ยนผลิตภัณฑ์ตะกอนเป็นสีทองพร้อม (s)

- ห้ามใช้สีอย่างเดียวในการสื่อสถานะ ต้องมีข้อความ ไอคอน และ aria-live ร่วมด้วย

- แอนิเมชันเปลี่ยนสี 150–250 ms และปิดได้เมื่อ prefers-reduced-motion: reduce

# สถาปัตยกรรมหน้าและเส้นทาง

| **Route**                | **หน้า**      | **หน้าที่**                                        |
|--------------------------|--------------|-------------------------------------------------|
| /                        | หน้าหลัก       | ปุ่มเริ่มเกม วิธีการเล่น และความรู้ก่อนเล่นเกม             |
| /levels                  | เลือกด่าน      | แสดง 50 ด่าน 5 ช่วงความยาก สถานะผ่าน/ปัจจุบัน/ล็อก     |
| /level/\[levelId\]/intro | โจทย์ประจำด่าน | แสดงสารตั้งต้น 2 ตัว โดยยังไม่เผยผลิตภัณฑ์               |
| /level/\[levelId\]/play  | วงจรเกม 5 ขั้น | เรนเดอร์ตาม state machine และคง progress bar 1–5 |
| /how-to-play             | วิธีการเล่น     | อธิบายการลาก–วาง ตรวจผล และตัวอย่างที่ไม่ใช่ด่านปัจจุบัน   |
| /knowledge               | ความรู้ก่อนเล่น  | ทบทวนการแตกตัว กฎการละลาย ไอออนผู้ชม และการดุล      |
| /progress                | ความก้าวหน้า   | สรุปด่านที่ผ่าน ดาว คะแนน และปุ่ม export/import/reset  |
| /settings                | การตั้งค่า      | เสียง เพลง ลดการเคลื่อนไหว และการจัดการข้อมูลบนเครื่อง  |

> **Route Guard:** หากเปิด URL ของด่านที่ยังล็อก ระบบต้องพากลับ /levels พร้อมข้อความ “ผ่านด่านก่อนหน้าเพื่อปลดล็อกด่านนี้” ห้ามอาศัยแค่การทำปุ่มสีเทา

# วงจรการเล่นหนึ่งด่าน

หน้าเลือกด่านและหน้าโจทย์เป็นหน้าคั่น ส่วนวงจรจริงมี 5 ขั้นตาม UI อ้างอิง และมี progress indicator 1–5 ตลอดเกม

1. **เข้าสู่เกม / โจทย์สารตั้งต้น —** แสดงสารละลาย 2 ชนิด เช่น NaCl(aq) + AgNO₃(aq) → ? แล้วกด “เริ่มแยกไอออน”

2. **ไอออน 4 → 4 —** แสดงไอออนจากสารตั้งต้น 4 การ์ดในแถวเดียว ผู้เล่นลากลงช่องผลิตภัณฑ์ 4 ช่องและกรอกสัมประสิทธิ์เมื่อโจทย์ต้องดุล

3. **ตรวจผลิตภัณฑ์ —** รวมคู่ที่เกิดตะกอนเป็นการ์ดทอง และคงไอออน/ผลิตภัณฑ์ที่ละลายน้ำเป็นสีน้ำเงิน/เขียว

4. **ตัดไอออนผู้ชม —** ผู้เล่นเชื่อม/เลือกไอออนชนิดเดียวกันทั้งสองข้าง ระบบลากเส้นตัดเฉพาะคู่ที่ถูก

5. **สมการไอออนิกสุทธิ —** แสดงเฉพาะไอออนที่เกิดปฏิกิริยาและตะกอน ปลดล็อกด่านถัดไปและ autosave

> **กติกาหลัก:** ต้องเป็นสารตั้งต้น 2 ตัวในสถานะ (aq) ที่ทำปฏิกิริยากันแล้วเกิดตะกอนตามหลักสมการไอออนิกสุทธิ ไม่สร้างด่านที่ไม่มีปฏิกิริยาในชุด MVP

# ข้อกำหนดรายหน้าจอ

## หน้าหลัก

**วัตถุประสงค์:** ให้ผู้เล่นเลือกเส้นทาง เริ่มเกม / วิธีการเล่น / ความรู้ก่อนเล่น โดยปุ่มเริ่มเกมเด่นที่สุด

- โลโก้ ION CLASH และคำอธิบายสั้น “แยกไอออน • สร้างตะกอน • ตัดไอออนผู้ชม”

- ปุ่มเริ่มเกม: ไป /levels และโหลดความก้าวหน้าบนเครื่องก่อนแสดง

- ปุ่มวิธีการเล่น: ไป /how-to-play

- ปุ่มความรู้ก่อนเล่นเกม: ไป /knowledge

- ถ้ามี save เดิม เปลี่ยนข้อความปุ่มหลักเป็น “เล่นต่อด่าน XX” และมีปุ่มรอง “เลือกด่าน”

## หน้าเลือกด่าน 50 เลเวล

**การจัดกลุ่ม:** 01–10 ง่าย, 11–20 พื้นฐาน, 21–30 ปานกลาง, 31–40 ยาก, 41–50 ท้าทาย

- เริ่มต้นปลดเฉพาะด่าน 01; ด่านถัดไปปลดเมื่อด่านก่อนหน้าผ่าน

- สถานะต้องเห็นต่างกันทั้งสีและสัญลักษณ์: ผ่านแล้ว, ด่านปัจจุบัน, ยังไม่ปลดล็อก

- แสดง progress เช่น 3/50 และจำนวนดาวรวม

- คลิก/แตะด่านที่ปลดล็อกแล้วเพื่อเปิดหน้าโจทย์ประจำด่าน

- เล่นด่านที่ผ่านแล้วซ้ำได้ และระบบเก็บเฉพาะผลที่ดีที่สุด

- เลขด่านเป็นตัวตนหลัก ห้ามเปลี่ยนหมายเลขเมื่อแก้ลำดับข้อมูลในไฟล์

## หน้าโจทย์ประจำด่าน

- แสดงสารตั้งต้น 2 ชนิดและสถานะ (aq) เช่น NaCl(aq) + AgNO₃(aq) → ?

- ห้ามเผยผลิตภัณฑ์ ไอออน หรือการ์ดสีทองก่อนกดเริ่ม

- มีปุ่ม “เริ่มแยกไอออน” เพื่อนำเข้าสู่ขั้น 1 ของ /play

- เปิดจับเวลาเมื่อผู้เล่นกดเริ่ม ไม่ใช่เมื่อเข้า route

- ให้กลับหน้าเลือกด่านได้โดยมี dialog ยืนยันเฉพาะเมื่อมี checkpoint กลางด่าน

## ขั้นไอออน 4 → 4 และการดุล

**Layout:** สมการโจทย์อยู่ด้านบน ไอออนสารตั้งต้น 4 การ์ดและช่องผลิตภัณฑ์ 4 ช่องเรียงในแนวนอนบน tablet/desktop; มือถือแนวตั้งแบ่งเป็น 2 แถวแต่รักษาลำดับซ้ายไปขวา

- การ์ดต้นทางแต่ละใบมี instanceId ไม่ใช่แค่ ionId เพื่อรองรับไอออนซ้ำจากสัมประสิทธิ์

- ลากการ์ดลงช่องได้ สลับตำแหน่งได้ ลากกลับได้ และมีทางเลือกแบบแตะการ์ดแล้วแตะช่อง

- ปุ่มตรวจคำตอบ disabled จนมีการ์ดครบจำนวนที่โจทย์กำหนด

- เมื่อโจทย์ต้องดุล แสดงช่อง coefficient ก่อนการ์ดสารทุกตัว ค่าเริ่มต้นเป็นว่าง ไม่เติม 1 ให้ล่วงหน้า

- รับเฉพาะจำนวนเต็มบวก 1–9; trim ช่องว่าง; ห้ามศูนย์ ทศนิยม จำนวนลบ และอักขระอื่น

- ตรวจอัตราส่วนสัมประสิทธิ์อย่างต่ำสุด เช่น 2:2:2:2 ต้องไม่ผ่านถ้าคำตอบมาตรฐานคือ 1:1:1:1

## ขั้นตรวจผลิตภัณฑ์

- ตรวจสูตร ประจุรวม สถานะ (aq)/(s) และกฎการละลายก่อนรวมการ์ด

- คู่ที่เกิดตะกอนถูกต้องรวมเป็นการ์ดทองพร้อมสูตร ชื่อ และ (s)

- ผลิตภัณฑ์ที่ยังละลายน้ำแสดงเป็นไอออนหรือสารละลายตามรูปแบบ complete ionic equation

- ถ้าผิด ให้การ์ดสั่น/ขอบแดงและบอกเหตุผลระดับหลักการ เช่น “ประจุรวมยังไม่เป็นศูนย์” โดยไม่เฉลยคู่ที่ถูก

- ปุ่มไปขั้นตัดไอออนผู้ชมปรากฏเฉพาะเมื่อผลิตภัณฑ์ทั้งหมดผ่าน validation

## ขั้นตัดไอออนผู้ชม

- แสดง complete ionic equation เต็มทั้งสองฝั่งตามสัมประสิทธิ์ที่ดุลแล้ว

- ผู้เล่นเลือกไอออนฝั่งซ้าย 1 ใบและไอออนชนิดเดียวกันฝั่งขวา 1 ใบ ระบบวาดเส้นตัดสีแดงเชื่อมคู่

- จับคู่ด้วย speciesId + charge + phase + count ไม่ใช้ข้อความสูตรอย่างเดียว

- ห้ามตัดไอออนที่เกิดตะกอนหรือปรากฏไม่เท่ากันทั้งสองข้าง

- รองรับ Undo คู่ล่าสุด และ Reset การตัดทั้งหมด

- กด “ยืนยันการตัดไอออน” ได้เมื่อเลือก spectator ions ครบและไม่มีคู่ผิด

## หน้าสมการไอออนิกสุทธิและจบด่าน

- แสดงสมการสุทธิ เช่น Ag⁺(aq) + Cl⁻(aq) → AgCl(s)

- แสดงข้อความถูกต้องพร้อมเหตุผลสั้นว่าคู่ใดเกิดตะกอนและไอออนใดถูกตัดเป็นผู้ชม

- คำนวณคะแนน/ดาว บันทึกผล ปลดล็อกด่านถัดไป และแสดง Save status ก่อนเปิด CTA

- มีปุ่ม “เลือกด่าน” และ “เล่นด่าน XX ต่อ”

- ถ้าบันทึกไม่ได้ ผู้เล่นยังผ่านด่านใน session แต่ต้องเห็นคำเตือนและปุ่มลองบันทึกอีกครั้ง/ส่งออกข้อมูล

# State Machine ของเกม

```text
levelSelect
-> levelIntro
-> dissociateReactants
-> arrangeProductIons
-> balanceEquation
-> validateProducts
-> cancelSpectatorIons
-> netIonicResult
-> levelComplete
```


State ต้องเปลี่ยนผ่านด้วย event ที่กำหนด ไม่ใช้ boolean จำนวนมาก เช่น isGold, isDone, showResult แยกกันจนเกิดสถานะขัดแย้ง

| **State**           | **Event ที่อนุญาต**                                | **เงื่อนไขออก**                     |
|---------------------|-------------------------------------------------|-----------------------------------|
| levelIntro          | START_LEVEL, EXIT                               | กดเริ่ม                             |
| dissociateReactants | SHOW_IONS, CONTINUE                             | แสดง reactant ion instances ครบ   |
| arrangeProductIons  | PLACE_ION, MOVE_ION, REMOVE_ION, CHECK          | ช่องครบและคู่ผลิตภัณฑ์ถูก                |
| balanceEquation     | SET_COEFFICIENT, CHECK_BALANCE                  | สัมประสิทธิ์ถูกและเป็นอัตราส่วนต่ำสุด       |
| validateProducts    | CONFIRM_PRODUCTS                                | precipitate + aqueous products ถูก |
| cancelSpectatorIons | SELECT_LEFT, SELECT_RIGHT, UNDO, RESET, CONFIRM | spectator ions ถูกตัดครบ            |
| netIonicResult      | COMPLETE_LEVEL                                  | สมการสุทธิสมดุลและแสดงผล             |
| levelComplete       | NEXT_LEVEL, LEVELS, REPLAY                      | บันทึกผลสำเร็จหรือแจ้งข้อผิดพลาด         |

# แบบจำลองข้อมูล 50 ด่าน

ข้อมูลเกมต้องแยกจาก UI และเก็บเป็น TypeScript/JSON ที่มี schema ชัดเจน ทุกด่านต้องผ่าน build-time validation ก่อน deploy

```ts
type Phase = 'aq' | 's';

type IonRef = {
ionId: string; // เช่น ag-plus, nitrate
formula: string; // เช่น Ag+, NO3-
charge: number; // +1, -1, +2 ...
nameTh: string;
};

type CompoundRef = {
compoundId: string;
formula: string;
nameTh: string;
phase: Phase;
ions: Array<{ ionId: string; count: number }>;
};

type IonInstance = {
instanceId: string; // unique ภายในสมการ
ionId: string;
side: 'reactant' | 'product';
sourceCompoundId: string;
order: number;
};

type IonClashLevel = {
id: number; // 1..50 คงที่
difficulty: 'easy' | 'basic' | 'medium' | 'hard' | 'challenge';
reactants: [string, string];
products: [string, string];
precipitateProductId: string;
aqueousProductId: string;
coefficients: { reactants: [number, number]; products: [number, number] };
reactantIonInstances: IonInstance[];
productIonInstances: IonInstance[];
spectatorIonIds: string[];
netIonic: { reactants: string[]; product: string; coefficients: number[] };
hints: string[];
};
```


## กติกาชุดข้อมูล

- มี 50 record และ id ครบ 1–50 ไม่ซ้ำ ไม่ขาด

- แต่ละด่านมี reactants 2 ตัวและ products 2 ตัว; สารตั้งต้นทั้งคู่เป็น (aq)

- มี precipitateProductId เพียง 1 ตัวใน MVP และ phase ต้องเป็น (s)

- สารอีกผลิตภัณฑ์หนึ่งต้องละลายน้ำและแยกเป็นไอออนใน complete ionic equation

- สมการโมเลกุล complete ionic และ net ionic ต้องรักษาอะตอมและประจุ

- spectatorIonIds ต้องปรากฏทั้งสองฝั่งในจำนวนเท่ากัน

- ทุก formula ใช้ข้อมูลโครงสร้างเป็นหลัก; ข้อความสวยงามเป็นเพียง presentation ไม่ใช้ตรวจคำตอบ

# กฎเคมีและ Validation

## กฎผลิตภัณฑ์

- ผลิตภัณฑ์เกิดจากการแลกเปลี่ยนคู่ของไอออนบวกและไอออนลบจากสารตั้งต้นคนละตัว

- สูตรสารประกอบต้องมีประจุรวมเป็นศูนย์ และลดอัตราส่วนไอออนเป็นจำนวนเต็มต่ำสุด

- ไอออนหลายอะตอมต้องใส่วงเล็บเมื่อมีจำนวนมากกว่า 1 เช่น Ca(NO₃)₂

- ระบบไม่ตัดสินการละลายจากสีหรือชื่อ แต่ใช้ค่าที่ผู้เชี่ยวชาญกำหนดใน data source

- ด่านผ่านเมื่อมีตะกอนตามข้อมูลที่รับรอง ไม่รับคำตอบ alternative ที่ไม่ได้อยู่ใน level data แม้ดูคล้ายกัน

## กฎการดุล

- จำนวนอะตอมของทุกธาตุทั้งสองข้างเท่ากัน

- ประจุรวมของ complete ionic equation ทั้งสองข้างเท่ากัน

- สัมประสิทธิ์เป็นจำนวนเต็มบวกและหารด้วยตัวหารร่วมมากแล้วได้อัตราส่วนต่ำสุด

- สัมประสิทธิ์ 1 แสดงในช่องกรอกได้ แต่ presentation ของสมการผลลัพธ์จะซ่อนเลข 1

## กฎไอออนผู้ชมและสมการสุทธิ

- spectator ion คือ species เดียวกัน มีประจุและสถานะเดียวกัน ปรากฏทั้งสองข้างในจำนวนเท่ากัน และไม่เปลี่ยนแปลง

- ตัดออกเป็นคู่ตามจำนวน instance ไม่ตัดทั้งชนิดทันทีถ้าจำนวนไม่เท่ากัน

- หลังตัดแล้ว สมการสุทธิต้องคงอะตอมและประจุรวม

- ผลิตภัณฑ์ตะกอนคงเป็นสารประกอบ (s) ไม่แตกเป็นไอออน

## Feedback เมื่อผิด

| **รหัส**     | **สถานการณ์**       | **ข้อความตัวอย่าง**                               |
|-------------|--------------------|------------------------------------------------|
| E-CHARGE    | ประจุผลิตภัณฑ์ไม่เป็นศูนย์ | ประจุรวมของสารประกอบยังไม่เป็นศูนย์ ลองปรับจำนวนไอออน |
| E-PAIR      | จับคู่ไอออนผิด         | ไอออนคู่นี้ไม่ใช่ผลิตภัณฑ์ของปฏิกิริยานี้                    |
| E-PHASE     | สถานะละลายผิด       | ตรวจสอบกฎการละลายของผลิตภัณฑ์อีกครั้ง                |
| E-BALANCE   | ดุลไม่ครบ            | จำนวนอะตอมบางธาตุยังไม่เท่ากันทั้งสองข้าง              |
| E-RATIO     | อัตราส่วนไม่ต่ำสุด      | สมการสมดุลแล้ว แต่ยังลดสัมประสิทธิ์ได้                  |
| E-SPECTATOR | ตัดไอออนผิด          | ตัดได้เฉพาะไอออนที่เหมือนกันและไม่เปลี่ยนแปลงทั้งสองข้าง   |

# ระดับความยาก คะแนน ดาว และการปลดล็อก

| **ช่วง** | **ระดับ** | **ลักษณะโจทย์**                                              |
|---------|----------|------------------------------------------------------------|
| 01–10   | ง่าย      | ประจุ ±1 เป็นหลัก สัมประสิทธิ์ 1:1:1:1 และตะกอนที่คุ้นเคย             |
| 11–20   | พื้นฐาน    | เริ่มมีประจุ ±2 และไอออนหลายอะตอม                              |
| 21–30   | ปานกลาง  | ต้องใส่วงเล็บและดุลสัมประสิทธิ์หลายค่า                              |
| 31–40   | ยาก      | มีโลหะแทรนซิชันหลายเลขออกซิเดชันและ instance ซ้ำ                 |
| 41–50   | ท้าทาย    | สมการซับซ้อนขึ้น ลดคำใบ้ และต้องแยก spectator ions หลาย instance |

## ค่าเริ่มต้นคะแนนที่กำหนด

- เริ่ม 100 คะแนนต่อด่าน

- ผิดแต่ละครั้งหัก 5 คะแนน สูงสุดรวม 30 คะแนน

- ใช้คำใบ้แต่ละครั้งหัก 10 คะแนน สูงสุดรวม 30 คะแนน

- ผ่านด่านได้อย่างน้อย 40 คะแนนเสมอ เพื่อไม่ให้คะแนนติดลบ

- 3 ดาว = 90–100, 2 ดาว = 70–89, 1 ดาว = 40–69

- ปลดล็อกด่านถัดไปทันทีเมื่อผ่าน ไม่ผูกกับจำนวนดาว

- Replay แล้วเก็บ bestScore, bestStars และ bestTime ที่ดีที่สุด โดย attempts เพิ่มทุกครั้ง

> **Configurable:** ค่าคะแนนทั้งหมดต้องอยู่ใน src/config/scoring.ts ไม่ hard-code ใน component เพื่อให้ผู้วิจัยปรับหลังทดลองนำร่องได้

# ระบบบันทึกความก้าวหน้าบนเครื่อง

## สถาปัตยกรรมที่เลือก

**MVP:** LocalStorageAdapter ใช้ localStorage ภายใต้ key ที่มี version: ion-clash:save:v1

**หลักการ:** UI และ game logic เรียก StorageAdapter interface เท่านั้น ห้ามเรียก window.localStorage กระจายตาม component

**อนาคต:** เพิ่ม IndexedDbAdapter หรือ CloudSaveAdapter ได้โดยไม่เปลี่ยน game reducer

```ts
interface GameSaveRepository {
load(): GameSaveV1;
save(next: GameSaveV1): SaveResult;
reset(): void;
exportJson(): Blob;
importJson(text: string): ImportResult;
}
```


## Save Schema

```ts
type LevelProgress = {
completed: boolean;
bestScore: number; // 0..100
stars: 0 | 1 | 2 | 3;
bestTimeMs: number | null;
attempts: number;
completedAt: string | null; // ISO 8601
};

type GameSaveV1 = {
version: 1;
installId: string; // random UUID บนเครื่อง; ไม่ใช่ข้อมูลบุคคล
unlockedLevel: number; // 1..50
completedLevels: Record<string, LevelProgress>;
lastPlayedLevel: number; // 1..50
activeCheckpoint: LevelCheckpoint | null;
settings: {
sound: boolean;
music: boolean;
reducedMotion: boolean;
};
createdAt: string;
updatedAt: string;
};
```


## Checkpoint กลางด่าน

เพื่อให้กลับมาเล่นต่อได้จริง ระบบ SHOULD เก็บ state เชิงความหมาย ไม่เก็บพิกัด x/y ของการ์ด

```ts
type LevelCheckpoint = {
levelId: number;
state: 'arrangeProductIons' | 'balanceEquation' |
'validateProducts' | 'cancelSpectatorIons';
slotAssignments: Array<{ slotId: string; ionInstanceId: string | null }>;
coefficients: [number | null, number | null, number | null, number | null];
canceledPairs: Array<{ leftInstanceId: string; rightInstanceId: string }>;
hintsUsed: number;
wrongAttempts: number;
elapsedMs: number;
savedAt: string;
};
```

> **ห้ามบันทึก:** drag coordinates, DOM ids, React component state ที่สร้างใหม่ได้, animation state และข้อความเฉลยที่ยังไม่ปลดล็อก เพราะข้อมูลเหล่านี้เปราะและทำให้ migration ยาก

## จังหวะ Autosave

- หลังผ่าน validation ของแต่ละขั้น

- หลังเปลี่ยน coefficient หรือจัดช่องครบแล้ว โดย debounce 300–500 ms

- หลังเพิ่ม/ยกเลิกคู่ spectator ion

- ทันทีเมื่อจบด่าน ปลดล็อกด่านถัดไป หรือปรับ settings

- ก่อน route ออกจากด่านและเมื่อ document เปลี่ยนเป็น hidden โดยไม่พึ่ง beforeunload เพียงอย่างเดียว

## Load, Validation และ Recovery

- อ่าน localStorage เฉพาะใน Client Component หรือ effect หลัง mount; ห้ามอ่านระหว่าง Server Render

- parse ด้วย try/catch และตรวจ schema/version/range ก่อนใช้

- ถ้า JSON เสีย ให้เก็บค่าดิบไว้ที่ ion-clash:save:corrupt:\<timestamp\> แล้วเริ่ม default save พร้อมแจ้งผู้ใช้

- ก่อนเขียนทับ เก็บ backup ล่าสุดไว้ที่ ion-clash:save:backup:v1 อย่างน้อย 1 ชุด

- ถ้า QuotaExceededError หรือ SecurityError ให้คืน SaveResult แบบ error ห้ามทำให้เกม crash

- Migration ต้องเป็นฟังก์ชันบริสุทธิ์ เช่น migrateV1ToV2 และมี unit test

- หากเปิดหลายแท็บ SHOULD ฟัง storage event แล้วรวม progress โดยเลือก best score และ unlockedLevel สูงสุด

## Export / Import / Reset

- Export สร้างไฟล์ ion-clash-save-YYYY-MM-DD.json จาก save ที่ validate แล้ว

- Import แสดง preview: จำนวนด่านผ่าน ด่านสูงสุด และวันแก้ไข ก่อนกดยืนยัน

- Import ใช้กลยุทธ์ merge โดยค่าเริ่มต้น: completed เป็น OR, คะแนน/ดาว/ด่านสูงสุดใช้ max, bestTime ใช้ค่าต่ำสุดที่ไม่เป็น null

- Reset ต้องพิมพ์คำว่า RESET หรือยืนยัน 2 ขั้น และบอกชัดว่ากู้คืนไม่ได้หากไม่มีไฟล์ export

## ตัวอย่าง Storage Service

```ts
'use client';

const SAVE_KEY = 'ion-clash:save:v1';

export function loadSave(): GameSaveV1 {
if (typeof window === 'undefined') return createDefaultSave();
try {
const raw = window.localStorage.getItem(SAVE_KEY);
if (!raw) return createDefaultSave();
return parseAndValidateSave(JSON.parse(raw));
} catch (error) {
reportLocalSaveError(error);
return createDefaultSave();
}
}

export function saveGame(next: GameSaveV1): SaveResult {
try {
const valid = parseAndValidateSave(next);
window.localStorage.setItem(SAVE_KEY, JSON.stringify(valid));
return { ok: true };
} catch (error) {
return { ok: false, reason: normalizeStorageError(error) };
}
}
```


# สถาปัตยกรรม Frontend

## Tech Stack

- Next.js App Router + TypeScript strict mode

- React Client Components เฉพาะส่วนที่ต้อง interactive, browser storage, pointer events หรือ audio

- CSS Modules หรือ Tailwind CSS เลือกอย่างใดอย่างหนึ่งและใช้สม่ำเสมอ; ห้ามผสมวิธี styling หลายระบบโดยไม่มีเหตุผล

- Reducer หรือ finite-state pattern สำหรับเกม; Context/Store ขนาดเล็กสำหรับ progress ที่ persist

- Schema validation ที่ runtime เช่น Zod หรือ validator เทียบเท่า สำหรับ level data และ save data

- Test: Vitest/Jest + Testing Library; E2E ใช้ Playwright พร้อม viewport iPad

## โครงสร้างไฟล์แนะนำ

```text
src/
app/
page.tsx
levels/page.tsx
level/[levelId]/intro/page.tsx
level/[levelId]/play/page.tsx
how-to-play/page.tsx
knowledge/page.tsx
progress/page.tsx
settings/page.tsx
components/
layout/ AppHeader, PageShell, StepIndicator
game/ EquationView, IonCard, CompoundCard, IonSlot
CoefficientInput, SpectatorConnector, FeedbackPanel
levels/ LevelGrid, LevelTile, DifficultyGroup
domain/
chemistry/ balance.ts, charge.ts, products.ts, spectators.ts
game/ gameMachine.ts, scoring.ts, selectors.ts
data/
ions.ts, compounds.ts, levels.ts
storage/
schema.ts, repository.ts, localStorageAdapter.ts, migration.ts
config/
theme.ts, scoring.ts, routes.ts
tests/
```


## Component Contract สำคัญ

| **Component**      | **รับข้อมูล**                            | **ส่ง event / ความรับผิดชอบ**                             |
|--------------------|---------------------------------------|--------------------------------------------------------|
| IonCard            | IonInstance, role, selected, disabled | SELECT, DRAG_START; แสดง formula/name/phase/aria-label |
| IonSlot            | slotId, assignedIon                   | PLACE, REMOVE; ไม่ตรวจเคมีเอง                            |
| CoefficientInput   | value, compoundLabel, error           | CHANGE, BLUR; จำกัดจำนวนเต็ม                             |
| EquationView       | structured equation AST               | render formula พร้อม sub/superscript; ไม่ parse จาก HTML |
| SpectatorConnector | left/right instances, pairs           | PAIR, UNDO, RESET; วาด SVG overlay ตาม element refs    |
| LevelGrid          | 50 level summaries + save             | OPEN_LEVEL; ใช้ selector คำนวณ locked/current/completed |
| SaveStatus         | idle/saving/saved/error               | RETRY, EXPORT; aria-live polite                        |

# Interaction: ลาก–วางที่ไม่ทำให้ผู้เล่นติด

ห้ามพึ่ง HTML5 drag-and-drop เพียงอย่างเดียว เพราะประสบการณ์ touch บน iPad ไม่สม่ำเสมอ ต้องใช้ Pointer Events หรือไลบรารีที่รองรับ touch และ keyboard จริง

- วิธีหลัก: ลากการ์ดไปช่องพร้อม ghost preview และ highlight ช่องที่รับได้

- วิธีสำรอง: แตะการ์ดหนึ่งครั้งให้ selected แล้วแตะช่องปลายทาง

- คีย์บอร์ด: Tab เลือกการ์ด, Enter/Space ถือ, ลูกศรเลือกช่อง, Enter วาง, Escape ยกเลิก

- หลังวางสำเร็จ focus ต้องไปยังช่องหรือการ์ดที่วาง เพื่อให้ screen reader เข้าใจผล

- ไม่ซ่อนการ์ดต้นทางถาวรจนกว่าจะวางสำเร็จ; การลากพลาดต้องคืนที่เดิม

- ทุก action มี Undo ในขั้นที่ซับซ้อน โดยเฉพาะการตัด spectator ions

# Accessibility

- ใช้ semantic heading, button, form label และ status region; ห้ามทำปุ่มด้วย div

- สูตรเคมีมี aria-label ภาษาไทย เช่น “ไอออนเงิน ประจุบวกหนึ่ง สถานะสารละลาย”

- สีมี contrast เพียงพอและทุกสถานะมีไอคอน/ข้อความร่วมด้วย

- ข้อความ feedback ใช้ aria-live=polite; error สำคัญใช้ role=alert อย่างพอดี

- รองรับ zoom 200% โดยข้อความไม่ถูกตัดและฟังก์ชันยังใช้ได้

- รองรับ prefers-reduced-motion และการตั้งค่าลดการเคลื่อนไหวในเว็บ

- เส้นตัด spectator ion ต้องมีรายการข้อความคู่ที่ตัดแล้ว ไม่พึ่งเส้น SVG อย่างเดียว

- Modal จัดการ focus trap, Escape, คืน focus ไปปุ่มเดิม และมีชื่อ accessible

# Performance, Offline และความปลอดภัย

## Performance Budget

- หน้าแรกและหน้าเลือกด่านต้อง interactive ภายในเวลาที่เหมาะสมบน tablet ระดับโรงเรียน; ตั้งเป้า LCP ≤ 2.5 s บนเครือข่ายจำลอง 4G

- ไม่โหลดภาพพื้นหลังขนาดใหญ่ทุกหน้า; ใช้ SVG/CSS pattern และ next/image สำหรับ raster

- Level data ทั้งหมดควรต่ำกว่า 500 KB หลังบีบอัด; โหลด route เกมแบบ code-split

- localStorage write ต้อง debounce และข้อมูลรวมตั้งเป้า \<100 KB

- เส้น SVG spectator connector recalculation ใช้ ResizeObserver และ requestAnimationFrame เมื่อจำเป็น

## Offline

MVP MUST เล่นต่อได้เมื่อหน้าถูกโหลดแล้วและอินเทอร์เน็ตหลุด เพราะข้อมูลด่านและตรรกะอยู่ฝั่ง client ส่วนการเปิดเว็บครั้งแรกแบบไม่มีอินเทอร์เน็ตเป็น MAY; หากต้องการเต็มรูปแบบค่อยเพิ่ม PWA/Service Worker ใน Phase 2

## Privacy / Security

- ไม่เก็บชื่อ โรงเรียน อีเมล หรือข้อมูลส่วนบุคคลใน MVP

- installId เป็น UUID สุ่มเฉพาะเครื่องและไม่ส่งออกเครือข่ายอัตโนมัติ

- Import JSON ต้องจำกัดขนาด ตรวจ schema และไม่ eval/execute ข้อมูล

- ห้ามใส่ secret/API key ใน client bundle

- Content Security Policy และ dependency audit เป็น SHOULD ก่อน deploy

# ข้อผิดพลาดและสถานะพิเศษ

| **กรณี**            | **พฤติกรรมที่กำหนด**                                             |
|--------------------|---------------------------------------------------------------|
| Level ID ไม่มี       | แสดง Not Found พร้อมปุ่มกลับหน้าเลือกด่าน                            |
| ด่านยังล็อก           | Redirect /levels + toast อธิบายด่านที่ต้องผ่าน                      |
| Level data invalid | ไม่เปิดเกม; แสดงรหัสข้อผิดพลาดที่ผู้พัฒนาตามได้ และไม่ทำให้ทั้งเว็บล่ม         |
| Save JSON เสีย      | สร้าง backup corrupt, ใช้ default save, แจ้งผู้ใช้ และเสนอ import   |
| Storage ถูกปิดกั้น     | เล่นได้ใน session, แสดง save error แบบไม่บังเกม, มีปุ่ม export       |
| Refresh กลางด่าน    | โหลด checkpoint ล่าสุด หากไม่มีให้กลับ intro โดยไม่เพิ่ม attempt ซ้ำ    |
| เปิดหลายแท็บ         | merge best progress; ไม่ให้ unlockedLevel ลดลง                  |
| เปลี่ยนเวอร์ชันข้อมูลด่าน | เก็บ progress เดิมตาม stable level id; migration ต้องไม่ลบด่านที่ผ่าน |

# แผนการทดสอบ

## Unit Tests — Chemistry Domain

- formula builder ทำประจุรวมเป็นศูนย์และใส่วงเล็บ polyatomic ถูก

- balance validator ตรวจอะตอม ประจุ และอัตราส่วนต่ำสุด

- product validator แยก precipitate/aqueous ตามข้อมูลด่าน

- spectator matcher จับคู่ species, charge, phase และจำนวน instance ถูก

- net ionic validator รักษาอะตอมและประจุ

- ทดสอบข้อมูลทั้ง 50 ด่านด้วย loop เดียวใน CI

## Unit Tests — Save

- default save ปลดเฉพาะด่าน 1

- ผ่านด่าน 1 แล้ว unlockedLevel เป็น 2; ผ่านด่าน 50 แล้วไม่เกิน 50

- replay ไม่ลด bestScore/bestStars และ bestTime ใช้ค่าที่ดีกว่า

- corrupt JSON, wrong version, out-of-range values และ quota error ไม่ทำให้ crash

- export/import round-trip ได้ข้อมูลเท่ากัน

- migration และ multi-tab merge ไม่ลดความก้าวหน้า

## Integration / E2E

- เล่นด่านตัวอย่างตั้งแต่ intro ถึง result ด้วย mouse, touch emulation และ keyboard

- กรอกผลิตภัณฑ์ผิดแล้วไม่เปลี่ยนเป็นสีทองและไม่เผยคำตอบ

- กรอก coefficient ถูกแล้วการ์ดตะกอนเปลี่ยนสีทอง

- ตัด spectator ion ผิดแล้วไม่ผ่าน; Undo/Reset ใช้ได้

- refresh ทุก state แล้วกลับ checkpoint ถูก

- ปิด browser context และเปิดใหม่แล้วยังเห็นด่านปลดล็อก

- route ด่านที่ล็อกถูก guard

- viewport iPad 1024×768 และ mobile 390×844 ไม่มีการทับ/ตัดข้อความ

# Acceptance Criteria ของ MVP

| **ID** | **เกณฑ์ผ่าน**                                             | **หลักฐาน**                    |
|--------|---------------------------------------------------------|-------------------------------|
| AC-01  | มีข้อมูลด่าน id 1–50 ครบและผ่าน data validation              | Automated test ผ่าน            |
| AC-02  | สารตั้งต้นทุกด่านเป็นสารละลาย 2 ตัวและเกิดตะกอน                 | Chemistry review + build test |
| AC-03  | เริ่มต้นปลดเฉพาะด่าน 1 และปลดต่อเนื่อง                         | E2E route/level grid          |
| AC-04  | ขั้น 4→4 รองรับ drag, tap-to-place และ keyboard            | E2E 3 input modes             |
| AC-05  | ผลิตภัณฑ์เป็นสีทองเฉพาะหลังสูตร/ประจุ/สถานะ/ดุลถูก                | Negative + positive tests     |
| AC-06  | ผู้เล่นตัดเฉพาะ spectator ions และ Undo ได้                  | Domain + E2E                  |
| AC-07  | สมการสุทธิสมดุลทั้งอะตอมและประจุ                              | Domain test ทุกด่าน             |
| AC-08  | จบด่านแล้วคะแนน/ดาว/ด่านถัดไปถูก save                        | Reload + new browser page     |
| AC-09  | refresh กลางด่านกลับ checkpoint ได้                        | E2E per state                 |
| AC-10  | save เสียหรือ storage error ไม่ทำให้เกมล่ม                   | Fault injection               |
| AC-11  | export/import/reset ทำงานและมี confirmation              | E2E data management           |
| AC-12  | iPad และ mobile ไม่มี overflow ระดับหน้า                    | Visual regression             |
| AC-13  | UI ใช้สีตามบทบาทและมีข้อความ/ไอคอนร่วม                       | Accessibility review          |
| AC-14  | ไม่มีข้อมูลส่วนบุคคลหรือ secret ใน bundle/save                 | Code + bundle review          |
| AC-15  | README ระบุ run, test, build, deploy และการแก้ level data | Handoff review                |

# Definition of Done

- npm run lint, npm run typecheck, npm test และ npm run build ผ่าน

- ข้อมูล 50 ด่านผ่าน chemistry/data validation ทั้งหมด

- ทดสอบจริงบน Safari iPad หรืออุปกรณ์เทียบเท่าอย่างน้อย 1 รอบ

- ตรวจ visual regression หน้าหลัก เลือกด่าน และทุกขั้นเกม

- ไม่มี console error ใน happy path และ error path หลัก

- Save schema มี version, migration test, export/import และ reset

- เอกสาร README และตัวอย่างการเพิ่ม/แก้ด่านครบ

- ผู้ตรวจเนื้อหาเคมีอนุมัติสมการและสถานะของสารทั้ง 50 ด่าน

# คำสั่งส่งต่องานให้ AI Coding Agent

> **อ่านก่อนเริ่ม:** ยึดเอกสารนี้และ Ion_Clash-Website_UI.pdf เป็น source of truth หากข้อกำหนดขัดกัน ให้ความถูกต้องทางเคมีและ Acceptance Criteria มาก่อนความสวยงาม

1. สร้าง Next.js App Router + TypeScript strict และตั้งค่า lint/typecheck/test ก่อนสร้าง UI

2. สร้าง domain types, level schema, save schema และ validator ก่อน component

3. ทำ level 01 แบบ end-to-end ให้ผ่านครบ state machine และ local save

4. แยก UI เป็น reusable components และทำ responsive/touch/keyboard ตั้งแต่ level 01

5. เพิ่มข้อมูล 50 ด่านผ่าน data module โดยห้าม duplicate logic ต่อด่าน

6. เพิ่ม tests ของ chemistry, save, route guard และ E2E

7. เทียบหน้าจอกับ PDF ที่ viewport iPad/desktop/mobile และแก้ overflow

8. ส่ง README, รายการสมมติฐาน และรายการสิ่งที่ยังไม่ทำซึ่งต้องไม่รวม MUST

## ข้อห้ามสำหรับ Agent

- ห้ามสร้าง/เดาสมการใหม่เพื่อให้ครบ 50 ด่านโดยไม่มีข้อมูลที่ผู้เชี่ยวชาญรับรอง

- ห้ามใช้ formula string เป็น source of truth สำหรับประจุ จำนวนอะตอม หรือ spectator matching

- ห้ามเรียก localStorage ใน Server Component หรือระหว่าง SSR

- ห้าม hard-code state ของด่านใน JSX และห้ามคัดลอก component 50 ชุด

- ห้ามปลดล็อกด่านด้วย CSS เท่านั้น ต้องมี route guard และ save validation

- ห้ามใช้สีทองก่อนคำตอบผ่านการตรวจครบ

- ห้ามทำ drag-only interaction ที่ใช้บน iPad/keyboard ไม่ได้

# ภาคผนวก A — ตัวอย่างข้อมูลด่าน 01

ตัวอย่างนี้ใช้ยืนยันโครงสร้างเท่านั้น ข้อมูลจริงทั้ง 50 ด่านต้องผ่านการตรวจโดยผู้เชี่ยวชาญ

```ts
export const level01: IonClashLevel = {
id: 1,
difficulty: 'easy',
reactants: ['sodium-chloride-aq', 'silver-nitrate-aq'],
products: ['silver-chloride-s', 'sodium-nitrate-aq'],
precipitateProductId: 'silver-chloride-s',
aqueousProductId: 'sodium-nitrate-aq',
coefficients: { reactants: [1, 1], products: [1, 1] },
spectatorIonIds: ['sodium-plus', 'nitrate-minus'],
netIonic: {
reactants: ['silver-plus-aq', 'chloride-minus-aq'],
product: 'silver-chloride-s',
coefficients: [1, 1, 1],
},
hints: [
'มองหาคู่ไอออนที่เกิดสารไม่ละลายน้ำ',
'โซเดียมและไนเตรตมักคงอยู่ในสารละลาย',
],
reactantIonInstances: [/* Na+, Cl-, Ag+, NO3- */],
productIonInstances: [/* AgCl(s), Na+, NO3- */],
};
```


**สมการโมเลกุล:** NaCl(aq) + AgNO₃(aq) → AgCl(s) + NaNO₃(aq)

**Complete ionic:** Na⁺(aq) + Cl⁻(aq) + Ag⁺(aq) + NO₃⁻(aq) → AgCl(s) + Na⁺(aq) + NO₃⁻(aq)

**Net ionic:** Ag⁺(aq) + Cl⁻(aq) → AgCl(s)

# ภาคผนวก B — Default Save

```json
{
"version": 1,
"installId": "<uuid-generated-on-first-load>",
"unlockedLevel": 1,
"completedLevels": {},
"lastPlayedLevel": 1,
"activeCheckpoint": null,
"settings": {
"sound": true,
"music": true,
"reducedMotion": false
},
"createdAt": "<ISO-8601>",
"updatedAt": "<ISO-8601>"
}
```


# ภาคผนวก C — เอกสารอ้างอิงด้านเว็บ

- [<u>MDN: Window.localStorage</u>](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

- [<u>MDN: Web Storage API</u>](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)

- [<u>MDN: Storage quotas and eviction criteria</u>](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

- [<u>MDN: IndexedDB API</u>](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

- [<u>Next.js: Server and Client Components</u>](https://nextjs.org/docs/app/getting-started/server-and-client-components)

- [<u>Next.js: Static Exports / browser APIs</u>](https://nextjs.org/docs/app/guides/static-exports)

*หมายเหตุ: localStorage คงข้อมูลข้ามการปิด–เปิดเบราว์เซอร์ภายใต้ origin เดิม แต่ข้อมูลโหมด private จะถูกล้างเมื่อปิดแท็บ private สุดท้าย และผู้ใช้สามารถล้างข้อมูลเว็บไซต์ได้*
