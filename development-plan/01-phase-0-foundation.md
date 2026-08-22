# Phase 0 · รากฐานโครงการ

> **เป้าหมาย:** มีโปรเจกต์เปล่าที่ `lint` `typecheck` `test` `build` ผ่านทั้งหมด อยู่บน GitHub แบบ public และ CI เขียว
> **ต้องรอ:** ไม่มี — เริ่มได้ทันที
> **หลักการ:** ตั้งเครื่องมือตรวจให้เสร็จ **ก่อน** เขียน UI ตามคำสั่งข้อ 1 ในหัวข้อส่งต่องานของ spec

---

## 0.1 จัดบ้านก่อน

ตอนนี้ไฟล์เอกสารและ asset กองอยู่ที่ root ทั้งหมด ต้องย้ายก่อนสร้างโปรเจกต์ ไม่งั้นจะปนกับซอร์สโค้ด

```
ก่อน                                หลัง
Ion Clash/                          Ion Clash/
├── Ion Clash-Presentation.pdf      ├── docs/
├── Ion_Clash-Proposal.pdf          │   ├── Ion Clash-Presentation.pdf
├── Ion_Clash-Website_UI.pdf        │   ├── Ion_Clash-Proposal.pdf
├── Ion_Clash-frontend-...md        │   ├── Ion_Clash-Website_UI.pdf
├── card file/                      │   ├── Ion_Clash-frontend-requirements_spec.md
├── card-image/                     │   └── assets/
└── development-plan/               │       ├── card file/
                                    │       └── card-image/
                                    ├── development-plan/
                                    ├── src/
                                    └── (ไฟล์โปรเจกต์ Next.js)
```

- [ ] สร้าง `docs/` และ `docs/assets/`
- [ ] ย้าย PDF 3 ไฟล์ + spec .md เข้า `docs/`
- [ ] ย้าย `card file/` และ `card-image/` เข้า `docs/assets/`
- [ ] เก็บ `CLAUDE.md` ไว้ที่ root ตามเดิม

---

## 0.2 Git และ GitHub

- [ ] `git init` (ตอนนี้ยังไม่ใช่ git repo)
- [ ] สร้าง `.gitignore` — `node_modules/`, `.next/`, `out/`, `.env*.local`, `.vercel`, `coverage/`, `playwright-report/`, `test-results/`
- [ ] commit แรก: เอกสารและแผน
- [ ] สร้าง repo **public** ชื่อ `ion-clash`
- [ ] push ขึ้น `main`

```bash
gh repo create ion-clash --public --source=. --remote=origin --push
```

> **บัญชีที่ใช้:** https://github.com/Tawanchetsada — repo ปลายทางคือ `Tawanchetsada/ion-clash`
> ตรวจ `gh auth status` ก่อนรัน ถ้ายังไม่ได้ล็อกอินให้รัน `gh auth login`

**ห้ามลืม:** repo เป็น public แปลว่าเฉลยทั้ง 50 ด่านเปิดเผย (ยอมรับได้ ดู D-10) แต่ **URL ของ Google Apps Script ห้ามอยู่ในซอร์ส** ให้ใช้ `NEXT_PUBLIC_RESEARCH_ENDPOINT` เป็น environment variable บน Vercel เท่านั้น

---

## 0.3 สร้างโปรเจกต์ Next.js

- [ ] ตรวจ Node เวอร์ชัน — ต้อง 18.18+ หรือ 20+ (`node --version`)
- [ ] สร้างโปรเจกต์ในโฟลเดอร์ปัจจุบัน

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

- [ ] เปิด strict เพิ่มใน `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true
  }
}
```

> `noUncheckedIndexedAccess` สำคัญมากกับงานนี้ เพราะโค้ดจะเข้าถึง array ของไอออนและช่องวางตลอดเวลา

---

## 0.4 เครื่องมือตรวจ

- [ ] ติดตั้ง dependency

```bash
npm i zod
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
npx playwright install chromium webkit
```

> ต้องมี **webkit** ด้วย เพราะ spec บังคับทดสอบบน Safari iPad

- [ ] `vitest.config.ts` — environment `jsdom`, setup file, alias `@/`
- [ ] `playwright.config.ts` — project สำหรับ 3 ขนาดจอ

| Project | Viewport | หมายเหตุ |
|---|---|---|
| `ipad` | 1024×768 | จอหลักตาม spec ใช้ webkit + `hasTouch: true` |
| `desktop` | 1280×720 | chromium |
| `mobile` | 390×844 | webkit + `hasTouch: true` |

- [ ] เพิ่ม npm scripts

```jsonc
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

**รันเทสต์ไฟล์เดียว:** `npx vitest run src/domain/chemistry/balance.test.ts`
**รันเทสต์ชื่อเดียว:** `npx vitest run -t "ดุลสมการ 1:2:1:2"`
**รัน E2E เฉพาะ iPad:** `npx playwright test --project=ipad`

---

## 0.5 ฟอนต์และ Design tokens

ใช้ **Google Sans** ตามที่ผู้ใช้ระบุ — ยืนยันแล้วว่าอยู่บน Google Fonts และมี subset `thai` ครอบ `U+0E01–0E5B` ครบทั้งบล็อก เป็นฟอนต์ตัวแปรมีแกน `opsz` (17–18) และ `wght` (400–700) พร้อม italic

- [ ] ตั้งค่าฟอนต์ใน `src/app/layout.tsx`

```ts
import { Google_Sans } from 'next/font/google';

const googleSans = Google_Sans({
  subsets: ['thai', 'latin'],
  axes: ['opsz'],
  weight: ['400', '500', '700'],
  display: 'swap',
});
```

> **ถ้า `next/font/google` ยังไม่รู้จัก `Google_Sans`** — ขึ้นกับว่า Next.js เวอร์ชันที่ติดตั้งมีข้อมูลฟอนต์ตัวนี้ในคลังแล้วหรือยัง เพราะเพิ่งถูกเพิ่มเข้ามา — ให้ถอยไปใช้ `<link>` ตรง ๆ ใน `layout.tsx` แทน

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap" rel="stylesheet">
```

> ทางที่ดีที่สุดสำหรับวันทดลองจริงคือ **ดาวน์โหลด woff2 มา self-host ผ่าน `next/font/local`** จะได้ไม่ต้องพึ่ง CDN ภายนอกตอนอยู่ในห้องเรียนที่เน็ตอาจไม่นิ่ง และไม่มี render-blocking request

- [ ] ใส่ token จาก spec ลง `tailwind.config.ts` และ CSS variables

| Token | ค่า | ใช้กับ |
|---|---|---|
| `navy` | `#082541` | header, ปุ่มหลัก, ข้อความสำคัญ |
| `blue` | `#1F5FAA` | การ์ดไอออนบวก, ขั้นปัจจุบัน |
| `green` | `#2B8846` | การ์ดไอออนลบ |
| `gold` | `#F1BE2D` | ตะกอนที่ผ่านแล้ว, CTA |
| `canvas` | `#EAF4FB` | พื้นหลังหน้าเล่น |
| `error` | `#C63C45` | คำตอบผิด, เส้นตัดผิด |
| `radius.card` | `16px` | panel และการ์ด |
| `shadow.card` | `0 8px 24px rgba(8,37,65,.10)` | ยก panel |

- [ ] ตั้ง `prefers-reduced-motion` ให้ปิดแอนิเมชันทั้งระบบผ่าน CSS ตัวเดียว

---

## 0.6 CI

- [ ] `.github/workflows/ci.yml` — รันทุก push และ PR

```yaml
steps:
  - run: npm ci
  - run: npm run lint
  - run: npm run typecheck
  - run: npm test
  - run: npm run build
```

E2E ยังไม่ต้องใส่ใน CI ตอนนี้ (ช้าและยังไม่มีหน้าจอ) ค่อยเพิ่มใน Phase 10

---

## 0.7 เชื่อม Vercel

- [ ] import repo `ion-clash` เข้า Vercel
- [ ] ตรวจว่า preview deployment ขึ้นจาก PR ได้
- [ ] ยังไม่ต้องตั้ง environment variable (ค่อยทำ Phase 9)

---

## Definition of Done

- [ ] `npm run lint && npm run typecheck && npm test && npm run build` ผ่านครบ 4 คำสั่ง
- [ ] repo `ion-clash` เป็น public และเปิดดูออนไลน์ได้
- [ ] CI badge เขียวบน `main`
- [ ] Vercel deploy หน้าเปล่าสำเร็จ มี URL จริง
- [ ] เอกสารเดิมทั้งหมดอยู่ใน `docs/` ไม่มี PDF ค้างที่ root
- [ ] ฟอนต์ Google Sans แสดงภาษาไทยถูกต้อง วรรณยุกต์ไม่ลอย

## กับดักที่ต้องระวัง

| ความเสี่ยง | ผลกระทบ | ทางแก้ |
|---|---|---|
| path มีช่องว่าง `D:\Project\Ion Clash` | เครื่องมือบางตัวบน Windows พังกับ path ที่มีช่องว่าง | ถ้าเจอปัญหา ให้ย้ายโปรเจกต์ไป `D:\Project\ion-clash` แล้วเก็บโฟลเดอร์เดิมไว้เป็นเอกสาร |
| `create-next-app` ในโฟลเดอร์ที่มีไฟล์อยู่แล้ว | อาจปฏิเสธหรือเขียนทับ | ย้ายเอกสารเข้า `docs/` ให้เสร็จก่อน (ข้อ 0.1) แล้วค่อยรัน |
| Next.js ยังไม่รู้จัก `Google_Sans` | build พังตอน import ฟอนต์ | ถอยไปใช้ `<link>` หรือ self-host ด้วย `next/font/local` (ดูข้อ 0.5) |
| วรรณยุกต์ไทยลอยหรือซ้อนผิด | อ่านยากทั้งเว็บ | ทดสอบด้วยคำที่มีสระบนล่างซ้อน เช่น "สื่อ" "เกี่ยว" "ผู้" และสูตรเคมีที่มีตัวห้อย |
| Playwright webkit บน Windows | ติดตั้งช้าและกินพื้นที่ | ติดตั้งครั้งเดียวตอนนี้ อย่าเลื่อนไป Phase 10 |
