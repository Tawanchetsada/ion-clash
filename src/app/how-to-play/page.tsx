"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../components/layout/AppHeader";
import { PageShell } from "../../components/layout/PageShell";
import { SCORING } from "../../config/scoring";
import { MESSAGES } from "../../config/messages";
import {
  BookIcon,
  FlaskIcon,
  KeyboardIcon,
  MouseIcon,
  PlayIcon,
  StarIcon,
  StarOutlineIcon,
  TapIcon,
} from "../../components/ui/Icon";

function StarRow({ filled }: { filled: number }) {
  return (
    <span aria-hidden="true" className="inline-flex items-center gap-0.5 text-gold">
      {[1, 2, 3].map((n) =>
        n <= filled ? <StarIcon key={n} /> : <StarOutlineIcon key={n} className="opacity-50" />,
      )}
    </span>
  );
}

export default function HowToPlayPage() {
  const router = useRouter();

  return (
    <PageShell>
      <AppHeader
        onHome={() => router.push("/")}
        onLevels={() => router.push("/levels")}
        onHowToPlay={() => {}}
      />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 pb-32">
        <div className="text-center">
          <span
            aria-hidden="true"
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue/10 text-2xl text-blue"
          >
            <BookIcon />
          </span>
          <h1 className="text-3xl font-bold text-navy">คู่มือวิธีการเล่นเกม Ion Clash</h1>
          <p className="mt-2 text-base text-navy/70">
            เรียนรู้ขั้นตอนการเล่น 5 ขั้นตอน รูปแบบการควบคุม และกติกาการให้คะแนน
          </p>
        </div>

        {/* Overview of 5 Steps */}
        <section className="rounded-card bg-white p-6 shadow-card border border-border">
          <h2 className="text-xl font-bold text-navy mb-4">5 ขั้นตอนสู่สมการไอออนิกสุทธิ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center mb-6">
            {MESSAGES.ui.steps.map((stepName, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 rounded-card bg-canvas p-3 border border-border"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-xs font-bold text-navy">{stepName}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 text-left">
            {/* Step 1 */}
            <div className="rounded-xl border border-navy/15 bg-canvas/60 p-4 sm:p-5">
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="shrink-0 whitespace-nowrap rounded-md bg-blue px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                  ขั้นที่ 1
                </span>
                <h3 className="font-bold text-navy text-base leading-snug">แตกตัวสารตั้งต้นในสารละลาย</h3>
              </div>
              <p className="text-xs sm:text-sm text-navy/80 leading-relaxed">
                สารประกอบไอออนิกที่ละลายน้ำได้ (aq) เมื่ออยู่ในน้ำจะแตกตัวออกเป็นไอออนบวกและไอออนลบอิสระ กดปุ่มเพื่อดูการแตกตัวของสารตั้งต้นทั้ง 2 ชนิด
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-navy/15 bg-canvas/60 p-4 sm:p-5">
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="shrink-0 whitespace-nowrap rounded-md bg-blue px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                  ขั้นที่ 2
                </span>
                <h3 className="font-bold text-navy text-base leading-snug">การแลกเปลี่ยนคู่ไอออนและดุลสมการเคมี</h3>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-start gap-2 rounded-lg bg-white p-3 border border-border text-xs sm:text-sm">
                  <span className="shrink-0 font-bold text-navy bg-navy/10 px-2 py-0.5 rounded text-xs">
                    2.1
                  </span>
                  <span className="text-navy/85 leading-relaxed">
                    <strong className="text-navy">แลกเปลี่ยนคู่ไอออนสร้างผลิตภัณฑ์:</strong> จับคู่ไอออนบวกและลบใหม่ 2 คู่ (ไอออนบวกต้องอยู่หน้าไอออนลบเสมอ)
                  </span>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-white p-3 border border-border text-xs sm:text-sm">
                  <span className="shrink-0 font-bold text-navy bg-navy/10 px-2 py-0.5 rounded text-xs">
                    2.2
                  </span>
                  <span className="text-navy/85 leading-relaxed">
                    <strong className="text-navy">เขียนสูตรสารประกอบไอออนิก (คูณไขว้):</strong> นำตัวเลขประจุมาคูณไขว้เป็นตัวห้อยของแต่ละไอออน (ตัวห้อย 1 ละไว้)
                  </span>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-white p-3 border border-border text-xs sm:text-sm">
                  <span className="shrink-0 font-bold text-navy bg-navy/10 px-2 py-0.5 rounded text-xs">
                    2.3
                  </span>
                  <span className="text-navy/85 leading-relaxed">
                    <strong className="text-navy">ดุลสมการเคมี:</strong> เติมสัมประสิทธิ์หน้าสารประกอบทั้ง 4 ตัวให้จำนวนอะตอมทั้งสองฝั่งเท่ากัน
                  </span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-navy/15 bg-canvas/60 p-4 sm:p-5">
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="shrink-0 whitespace-nowrap rounded-md bg-blue px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                  ขั้นที่ 3
                </span>
                <h3 className="font-bold text-navy text-base leading-snug">ตรวจสอบสถานะการละลายของผลิตภัณฑ์</h3>
              </div>
              <p className="text-xs sm:text-sm text-navy/80 leading-relaxed">
                เปิดตาราง <strong>กฎการละลาย 7 ข้อ</strong> เพื่อพิจารณาว่าสารประกอบใดเกิดตะกอน (s) และสารประกอบใดละลายน้ำ (aq) ซึ่งจะแตกตัวเป็นไอออนอิสระ
              </p>
            </div>

            {/* Step 4 */}
            <div className="rounded-xl border border-navy/15 bg-canvas/60 p-4 sm:p-5">
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="shrink-0 whitespace-nowrap rounded-md bg-blue px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                  ขั้นที่ 4
                </span>
                <h3 className="font-bold text-navy text-base leading-snug">ตัดไอออนผู้ชม (Spectator Ions)</h3>
              </div>
              <p className="text-xs sm:text-sm text-navy/80 leading-relaxed">
                ไอออนที่ปรากฏทั้งสองฝั่งของสมการในสถานะเดียวกัน (aq) โดยไม่เปลี่ยนแปลง เรียกว่า <strong>ไอออนผู้ชม</strong> ให้จับคู่ไอออนตัวเดียวกันเพื่อตัดออก
              </p>
            </div>

            {/* Step 5 */}
            <div className="rounded-xl border border-green/30 bg-green/5 p-4 sm:p-5">
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="shrink-0 whitespace-nowrap rounded-md bg-green px-2.5 py-1 text-xs font-bold text-white shadow-2xs">
                  ขั้นที่ 5
                </span>
                <h3 className="font-bold text-navy text-base leading-snug">สรุปสมการไอออนิกสุทธิ</h3>
              </div>
              <p className="text-xs sm:text-sm text-navy/80 leading-relaxed">
                แสดงสมการไอออนิกสุทธิ (Net Ionic Equation) ที่สมบูรณ์ สรุปคะแนนที่ได้รับ และจำนวนดาวตามเกณฑ์ความแม่นยำ
              </p>
            </div>
          </div>
        </section>

        {/* Dedicated Sandbox CTA Box */}
        <section className="rounded-card border-2 border-gold/60 bg-gold-surface p-6 sm:p-8 shadow-card text-center flex flex-col items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-light text-2xl text-navy">
            <FlaskIcon />
          </span>
          <div className="space-y-1 max-w-lg">
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy">
              กระดานทดลองเล่นจริง (Interactive Sandbox)
            </h2>
            <p className="text-xs sm:text-sm text-navy/80 leading-relaxed">
              ทดลองลากวางการ์ดไอออน สังเกตการคูณไขว้ประจุ และฝึกดุลสมการเคมีพร้อมระบบตรวจนับอะตอมแบบเรียลไทม์บนกระดานจำลองขนาดเต็ม
            </p>
          </div>
          <Link
            href="/how-to-play/sandbox"
            className="inline-flex items-center justify-center gap-2 rounded-card bg-gold px-6 py-3 text-base font-extrabold text-navy shadow-md hover:bg-gold-light hover:scale-105 active:scale-95 transition-all"
          >
            <PlayIcon /> เปิดกระดานทดลองเล่นจริง
          </Link>
        </section>

        {/* 3 Control Methods */}
        <section className="rounded-card bg-white p-6 shadow-card border border-border">
          <h2 className="text-xl font-bold text-navy mb-4">รูปแบบการควบคุม 3 วิธี (เลือกใช้ตามสะดวก)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-card bg-panel p-4 border border-border">
              <div className="flex items-center gap-2 font-bold text-navy mb-2">
                <span className="text-xl text-blue"><MouseIcon /></span>
                <h3>1. ลากและวาง (Drag & Drop)</h3>
              </div>
              <p className="text-xs text-navy/80 leading-relaxed">
                คลิก/แตะค้างที่การ์ดไอออน แล้วลากไปปล่อยลงในช่องผลิตภัณฑ์ที่ต้องการ รองรับทั้งเมาส์บนคอมพิวเตอร์และระบบสัมผัสบน iPad/แท็บเล็ต
              </p>
            </div>

            <div className="rounded-card bg-panel p-4 border border-border">
              <div className="flex items-center gap-2 font-bold text-navy mb-2">
                <span className="text-xl text-blue"><TapIcon /></span>
                <h3>2. แตะสองครั้ง (Tap-to-Place)</h3>
              </div>
              <p className="text-xs text-navy/80 leading-relaxed">
                แตะที่การ์ดไอออน 1 ครั้ง (การ์ดจะขึ้นกรอบสีฟ้าเพื่อระบุว่าถูกเลือก) จากนั้นแตะที่ช่องว่างเพื่อนำการ์ดไปวาง สะดวกมากบนหน้าจอมือถือ
              </p>
            </div>

            <div className="rounded-card bg-panel p-4 border border-border">
              <div className="flex items-center gap-2 font-bold text-navy mb-2">
                <span className="text-xl text-blue"><KeyboardIcon /></span>
                <h3>3. คีย์บอร์ด (Keyboard)</h3>
              </div>
              <p className="text-xs text-navy/80 leading-relaxed">
                กดปุ่มตัวเลข <strong>1 - 9</strong> เพื่อเลือกการ์ดไอออน จากนั้นกด <strong>A, B, C, D</strong> เพื่อวางลงในช่องผลิตภัณฑ์ที่ต้องการ หรือใช้ <strong>Tab</strong> และ <strong>Enter / Space</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Scoring & Star Criteria */}
        <section className="rounded-card bg-white p-6 shadow-card border border-border">
          <h2 className="text-xl font-bold text-navy mb-4">ระบบคะแนนและเกณฑ์การให้ดาว</h2>
          <div className="space-y-4 text-left text-sm text-navy/85">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-card bg-canvas p-4 border border-border text-center">
                <span className="text-xs text-navy/60">คะแนนเริ่มต้น</span>
                <p className="text-2xl font-bold text-navy mt-1">{SCORING.startScore} คะแนน</p>
              </div>
              <div className="rounded-card bg-canvas p-4 border border-border text-center">
                <span className="text-xs text-navy/60">หักคะแนนเมื่อผิด</span>
                <p className="text-2xl font-bold text-error mt-1">-{SCORING.penaltyPerWrong} คะแนน/ครั้ง</p>
              </div>
              <div className="rounded-card bg-canvas p-4 border border-border text-center">
                <span className="text-xs text-navy/60">หักคะแนนเมื่อใช้คำใบ้</span>
                <p className="text-2xl font-bold text-gold-dark mt-1">-{SCORING.penaltyPerHint} คะแนน/ครั้ง</p>
              </div>
            </div>

            <div className="rounded-card bg-gold-surface p-4 border border-gold/40">
              <h3 className="font-bold text-navy mb-2">เกณฑ์การได้รับดาว (Stars Criteria):</h3>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li className="flex items-center justify-between border-b border-gold/20 pb-1.5">
                  <span className="inline-flex items-center gap-2">
                    <StarRow filled={3} />
                    <strong>3 ดาว:</strong> ได้คะแนนตั้งแต่ {SCORING.starThresholds.three} คะแนนขึ้นไป (เล่นได้อย่างแม่นยำ ไม่ผิดเกิน 1 ครั้ง)
                  </span>
                  <span className="font-bold text-gold-dark">ยอดเยี่ยม</span>
                </li>
                <li className="flex items-center justify-between border-b border-gold/20 pb-1.5">
                  <span className="inline-flex items-center gap-2">
                    <StarRow filled={2} />
                    <strong>2 ดาว:</strong> ได้คะแนนตั้งแต่ {SCORING.starThresholds.two} - {SCORING.starThresholds.three - 1} คะแนน
                  </span>
                  <span className="font-bold text-blue">ดีมาก</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2">
                    <StarRow filled={1} />
                    <strong>1 ดาว:</strong> ผ่านด่านโดยได้คะแนนอย่างน้อย {SCORING.starThresholds.one} คะแนน
                  </span>
                  <span className="font-bold text-navy/60">ผ่านเกณฑ์</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Navigation Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/knowledge"
            className="flex min-h-11 items-center justify-center rounded-card border-2 border-navy bg-white px-6 py-2.5 font-bold text-navy shadow-card hover:bg-canvas"
          >
            ศึกษาคลังความรู้ (ทฤษฎีเคมี)
          </Link>
          <Link
            href="/levels"
            className="flex min-h-11 items-center justify-center rounded-card bg-gold px-8 py-2.5 font-bold text-navy shadow-card hover:bg-gold-light"
          >
            ไปยังหน้าเลือกด่าน
          </Link>
        </div>
      </main>
    </PageShell>
  );
}
