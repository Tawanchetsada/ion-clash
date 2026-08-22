# Phase 0 · รากฐานโครงการ

> **สถานะ: เสร็จแล้ว** ✅ · ทำจริงเมื่อ 22 สิงหาคม 2569
> commit `70f2899` (เอกสาร) และ `cef215f` (scaffold) · แก้เพิ่ม `fe30041`, `7b46fac`
> repo: https://github.com/Tawanchetsada/ion-clash · CI เขียวบน `main`
> **ค้างข้อเดียว:** เชื่อม Vercel (ข้อ 0.7) รอผู้ใช้กด authorize เอง

## สรุปสิ่งที่ทำจริงและสิ่งที่ต่างจากแผน

| หัวข้อ | ผลลัพธ์จริง |
|---|---|
| เวอร์ชันที่ได้ | Node 24.11.1 · npm 11.6.2 · **Next.js 16.3.2** · React 19.2.8 · Tailwind v4 |
| B-01 Node | ผ่าน ไม่มีปัญหา (ต้องการ 18.18+ มีจริง 24.11.1) |
| B-02 Google Sans | **`next/font/google` รู้จัก `Google_Sans` แล้ว** ไม่ต้องถอยไปใช้ `<link>` |
| B-04 path มีช่องว่าง | ไม่กระทบเครื่องมือใด ๆ ยกเว้น `create-next-app` (ดูข้างล่าง) ใช้ `D:\Project\Ion Clash` ต่อได้ |
| gh auth | ล็อกอินอยู่แล้วเป็น `Tawanchetsada` scope ครบ |

### สามเรื่องที่แผนไม่ได้คาดไว้ และวิธีแก้ที่ใช้จริง

**1 · `create-next-app` ปฏิเสธชื่อโฟลเดอร์ที่มีช่องว่างและตัวพิมพ์ใหญ่**

```
Could not create a project called "Ion Clash" because of npm naming restrictions
```

แผนเดิมบอกให้รัน `npx create-next-app@latest .` ในโฟลเดอร์ปัจจุบัน ซึ่งใช้ไม่ได้
**วิธีแก้:** scaffold ลงโฟลเดอร์ชั่วคราวชื่อถูกกติกา แล้วย้ายไฟล์ขึ้นมาที่ root และแก้ `name` ใน `package.json` เป็น `ion-clash`

```bash
npx create-next-app@latest ion-clash-tmp --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --disable-git --yes
# แล้วย้ายไฟล์ขึ้น root ลบโฟลเดอร์ชั่วคราว
```

> ไม่ต้องย้ายโปรเจกต์ไป `D:\Project\ion-clash` ตามที่ B-04 กังวล เพราะติดแค่ตอน scaffold ครั้งเดียว

**2 · `npm ci` พังบน CI เพราะ lockfile ไม่ครบ optional deps ของ Linux**

lockfile ที่โตขึ้นทีละนิดจากการ `npm install` หลายรอบบน Windows ขาด entry ระดับบนของ `@emnapi/*` ซึ่งเป็น optional dependency ของ Linux ทำให้ `npm ci` บน ubuntu runner ล้ม
**วิธีแก้:** `rm -rf node_modules package-lock.json && npm install` รอบเดียวให้ lockfile สมบูรณ์ และ **bump CI เป็น Node 22** เพราะ `@testing-library/jest-dom` v7 ต้องการ `node >=22`

**3 · `tsc --noEmit` พังบน CI เพราะยังไม่มี `.next/types`**

`LayoutProps` เป็น ambient type ที่ Next generate ลง `.next/types` ตอน build/dev แต่ CI รัน `typecheck` **ก่อน** `build` บน checkout สะอาดจึงหาไม่เจอ
**วิธีแก้:** เปลี่ยน script เป็น `"typecheck": "next typegen && tsc --noEmit"` ซึ่ง generate route types โดยไม่ต้อง build เต็ม

### หมายเหตุการตั้งค่าที่ต่างจากแผน

- **Tailwind v4 ไม่มี `tailwind.config.ts`** ใช้ CSS-first แทน design token จึงอยู่ใน `src/app/globals.css` ผ่าน `:root` + `@theme inline` ไม่ใช่ไฟล์ config
- **ฟอนต์ต้องใช้ `weight: "variable"`** ไม่ใช่ `weight: ['400','500','700']` เพราะ Next บังคับว่า `axes` ใช้ได้เฉพาะเมื่อ weight เป็น variable — ถ้าใส่ weight เป็น array จะ build ไม่ผ่านด้วย error `Axes can only be defined for variable fonts`
- **`package.json` ต้องมี `"type": "module"`** ไม่งั้น Vite เตือนเรื่อง ESM ใน `vitest.config.ts`
- มี warning ตอน build ว่า `Failed to find font override values for font 'Google Sans'` — ไม่กระทบการทำงาน เป็นแค่ metric สำหรับ fallback font

---

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

- [x] สร้าง `docs/` และ `docs/assets/`
- [x] ย้าย PDF 3 ไฟล์ + spec .md เข้า `docs/`
- [x] ย้าย `card file/` และ `card-image/` เข้า `docs/assets/`
- [x] เก็บ `CLAUDE.md` ไว้ที่ root ตามเดิม

---

## 0.2 Git และ GitHub

- [x] `git init` (ตอนนี้ยังไม่ใช่ git repo)
- [x] สร้าง `.gitignore` — `node_modules/`, `.next/`, `out/`, `.env*.local`, `.vercel`, `coverage/`, `playwright-report/`, `test-results/`
- [x] commit แรก: เอกสารและแผน
- [x] สร้าง repo **public** ชื่อ `ion-clash`
- [x] push ขึ้น `main`

```bash
gh repo create ion-clash --public --source=. --remote=origin --push
```

> **บัญชีที่ใช้:** https://github.com/Tawanchetsada — repo ปลายทางคือ `Tawanchetsada/ion-clash`
> ตรวจ `gh auth status` ก่อนรัน ถ้ายังไม่ได้ล็อกอินให้รัน `gh auth login`

**ห้ามลืม:** repo เป็น public แปลว่าเฉลยทั้ง 50 ด่านเปิดเผย (ยอมรับได้ ดู D-10) แต่ **URL ของ Google Apps Script ห้ามอยู่ในซอร์ส** ให้ใช้ `NEXT_PUBLIC_RESEARCH_ENDPOINT` เป็น environment variable บน Vercel เท่านั้น

---

## 0.3 สร้างโปรเจกต์ Next.js

- [x] ตรวจ Node เวอร์ชัน — ต้อง 18.18+ หรือ 20+ (`node --version`)
- [x] สร้างโปรเจกต์ในโฟลเดอร์ปัจจุบัน

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

- [x] เปิด strict เพิ่มใน `tsconfig.json`

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

- [x] ติดตั้ง dependency

```bash
npm i zod
npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
npx playwright install chromium webkit
```

> ต้องมี **webkit** ด้วย เพราะ spec บังคับทดสอบบน Safari iPad

- [x] `vitest.config.ts` — environment `jsdom`, setup file, alias `@/`
- [x] `playwright.config.ts` — project สำหรับ 3 ขนาดจอ

| Project | Viewport | หมายเหตุ |
|---|---|---|
| `ipad` | 1024×768 | จอหลักตาม spec ใช้ webkit + `hasTouch: true` |
| `desktop` | 1280×720 | chromium |
| `mobile` | 390×844 | webkit + `hasTouch: true` |

- [x] เพิ่ม npm scripts

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

- [x] ตั้งค่าฟอนต์ใน `src/app/layout.tsx`

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

- [x] ใส่ token จาก spec ลง `tailwind.config.ts` และ CSS variables

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

- [x] ตั้ง `prefers-reduced-motion` ให้ปิดแอนิเมชันทั้งระบบผ่าน CSS ตัวเดียว

---

## 0.6 CI

- [x] `.github/workflows/ci.yml` — รันทุก push และ PR

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
- [x] ยังไม่ต้องตั้ง environment variable (ค่อยทำ Phase 9)

> ขั้นนี้ต้อง authorize OAuth ด้วยบัญชีจริงของผู้ใช้ agent ทำแทนไม่ได้
> repo พร้อม deploy แล้ว (build ผ่าน ไม่มี env var ที่ต้องตั้ง)

---

## Definition of Done

- [x] `npm run lint && npm run typecheck && npm test && npm run build` ผ่านครบ 4 คำสั่ง
- [x] repo `ion-clash` เป็น public และเปิดดูออนไลน์ได้
- [x] CI badge เขียวบน `main`
- [ ] Vercel deploy หน้าเปล่าสำเร็จ มี URL จริง
- [x] เอกสารเดิมทั้งหมดอยู่ใน `docs/` ไม่มี PDF ค้างที่ root
- [~] ฟอนต์ Google Sans แสดงภาษาไทยถูกต้อง วรรณยุกต์ไม่ลอย

> **ยังตรวจไม่ครบ:** ยืนยันแล้วว่าฟอนต์โหลดได้ ข้อความไทยไม่เป็นตัวต่างดาว
> และไม่มี console error แต่**ยังไม่ได้ดูด้วยตาว่าวรรณยุกต์ซ้อนถูกหรือไม่**
> ต้องเปิด `npm run dev` แล้วดูคำที่มีสระบนล่างซ้อน เช่น "สื่อ" "เกี่ยว" "ผู้"
> ให้ปิดข้อนี้ตอนมีหน้าจอจริงใน Phase 5

## กับดักที่ต้องระวัง

| ความเสี่ยง | ผลกระทบ | เกิดขึ้นจริงไหม |
|---|---|---|
| path มีช่องว่าง `D:\Project\Ion Clash` | เครื่องมือบางตัวบน Windows พังกับ path ที่มีช่องว่าง | **เกิดบางส่วน** — ติดแค่ `create-next-app` ที่ปฏิเสธชื่อโปรเจกต์ ไม่ต้องย้ายโฟลเดอร์ |
| `create-next-app` ในโฟลเดอร์ที่มีไฟล์อยู่แล้ว | อาจปฏิเสธหรือเขียนทับ | **ไม่เกิด** — ปัญหาจริงคือชื่อโฟลเดอร์ ไม่ใช่ไฟล์ที่มีอยู่ แก้ด้วยการ scaffold ในโฟลเดอร์ชั่วคราว |
| Next.js ยังไม่รู้จัก `Google_Sans` | build พังตอน import ฟอนต์ | **ไม่เกิด** — Next 16.3.2 รู้จักแล้ว แต่ติดเรื่อง `axes` กับ `weight` แทน (ดูหมายเหตุข้างบน) |
| วรรณยุกต์ไทยลอยหรือซ้อนผิด | อ่านยากทั้งเว็บ | ทดสอบด้วยคำที่มีสระบนล่างซ้อน เช่น "สื่อ" "เกี่ยว" "ผู้" และสูตรเคมีที่มีตัวห้อย |
| Playwright webkit บน Windows | ติดตั้งช้าและกินพื้นที่ | ติดตั้งครั้งเดียวตอนนี้ อย่าเลื่อนไป Phase 10 |
