"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageShell } from "../components/layout/PageShell";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { useSave } from "../session/SaveProvider";

export default function Home() {
  const router = useRouter();
  const { save, commit } = useSave();
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [consentChecked, setConsentChecked] = useState(true);

  const handleStartGame = () => {
    if (!save) return;
    if (save.playerName.trim() === "") {
      setShowNameModal(true);
    } else {
      router.push("/levels");
    }
  };

  const handleContinueGame = () => {
    if (!save) return;
    if (save.playerName.trim() === "") {
      setShowNameModal(true);
    } else {
      const targetLevel = save.lastPlayedLevel || save.unlockedLevel || 1;
      router.push(`/level/${targetLevel}/intro`);
    }
  };

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError("กรุณากรอกชื่อหรือรหัสผู้เรียน");
      return;
    }
    if (save) {
      commit({
        ...save,
        playerName: trimmed,
        settings: {
          ...save.settings,
          researchConsent: consentChecked,
        },
      });
    }
    setShowNameModal(false);
    router.push("/levels");
  };

  const hasSaveData =
    save !== null &&
    (Object.keys(save.completedLevels).length > 0 ||
      save.lastPlayedLevel > 1 ||
      save.playerName !== "");

  return (
    <PageShell variant="navy">
      {/* หน้าแรกตามเอกสาร UI หน้า 04 — พื้นกรมเข้ม ชื่อเกมเด่น และสามเส้นทาง
          เรียงเป็นปุ่มเต็มความกว้าง ไม่ใช่การ์ดขาวลอยบนพื้นอ่อน */}
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-12 sm:flex-row sm:gap-12 sm:px-10">
        <div className="flex w-full max-w-sm flex-col gap-7">
          <div className="flex flex-col gap-3 text-center sm:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              ION <span className="text-gold">CLASH</span>
            </h1>
            <p className="text-sm text-white/85">
              เกมฝึกสร้างสมการไอออนิกสุทธิสำหรับนักเรียนชั้น ม.4
            </p>
            <p className="text-xs font-semibold tracking-wide text-white/70">
              แยกไอออน • สร้างตะกอน • ตัดไอออนผู้ชม
            </p>
          </div>

          <div className="flex w-full flex-col gap-3">
            {save === null ? (
              <>
                <div className="h-12 w-full animate-pulse rounded-card bg-white/15" />
                <div className="h-11 w-full animate-pulse rounded-card bg-white/10" />
              </>
            ) : hasSaveData ? (
              <>
                <Button
                  variant="gold"
                  className="h-12 w-full text-base font-bold"
                  onClick={handleContinueGame}
                >
                  เล่นต่อด่าน {save.lastPlayedLevel || save.unlockedLevel || 1}
                </Button>
                <Button
                  variant="blue"
                  className="h-12 w-full text-base font-bold"
                  onClick={() => router.push("/levels")}
                >
                  เลือกด่าน (ปลดล็อกถึงด่าน {save.unlockedLevel})
                </Button>
              </>
            ) : (
              <Button
                variant="gold"
                className="h-12 w-full text-lg font-bold"
                onClick={handleStartGame}
              >
                เริ่มเกม
              </Button>
            )}

            <Link
              href="/how-to-play"
              className="inline-flex h-12 w-full items-center justify-center rounded-card bg-blue px-4 font-bold text-white shadow-card hover:brightness-110"
            >
              วิธีการเล่น
            </Link>
            <Link
              href="/knowledge"
              className="inline-flex h-12 w-full items-center justify-center rounded-card bg-green-ink px-4 font-bold text-white shadow-card hover:brightness-110"
            >
              ความรู้ก่อนเล่นเกม
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 border-t border-white/15 pt-5 text-sm sm:justify-start">
            <Link href="/progress" className="min-h-11 inline-flex items-center text-white/80 underline hover:text-white">
              ความก้าวหน้า
            </Link>
            <Link href="/settings" className="min-h-11 inline-flex items-center text-white/80 underline hover:text-white">
              ตั้งค่า
            </Link>
          </div>
        </div>

        {/* ภาพประกอบวงโคจรไอออนรอบตะกอน — ตกแต่งล้วน ซ่อนจาก screen reader */}
        <svg
          aria-hidden="true"
          viewBox="0 0 220 220"
          className="hidden h-56 w-56 shrink-0 sm:block lg:h-72 lg:w-72"
        >
          <ellipse cx="110" cy="110" rx="96" ry="52" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2" />
          <ellipse cx="110" cy="110" rx="96" ry="52" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2" transform="rotate(60 110 110)" />
          <ellipse cx="110" cy="110" rx="96" ry="52" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2" transform="rotate(120 110 110)" />
          <circle cx="110" cy="110" r="46" fill="var(--color-gold)" />
          <text x="110" y="118" textAnchor="middle" className="fill-navy text-xl font-bold">
            AgCl
          </text>
          <circle cx="188" cy="86" r="14" fill="var(--color-green)" />
          <text x="188" y="92" textAnchor="middle" className="fill-white text-base font-bold">−</text>
          <circle cx="46" cy="146" r="14" fill="var(--color-blue)" />
          <text x="46" y="152" textAnchor="middle" className="fill-white text-base font-bold">+</text>
          <circle cx="150" cy="176" r="12" fill="var(--color-blue)" />
          <text x="150" y="181" textAnchor="middle" className="fill-white text-sm font-bold">+</text>
        </svg>
      </main>

      {/* Name Input Dialog for D-14 */}
      <Dialog
        open={showNameModal}
        titleTh="ยินดีต้อนรับสู่ Ion Clash"
        onClose={() => setShowNameModal(false)}
      >
        <div className="flex flex-col gap-4 text-left my-2">
          <p className="text-sm text-navy/80">
            กรุณาระบุชื่อหรือรหัสผู้เรียนเพื่อบันทึกผลการเล่น
          </p>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="player-name-input"
              className="text-xs font-semibold text-navy"
            >
              ชื่อหรือรหัสผู้เรียน:
            </label>
            <input
              id="player-name-input"
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (nameError) setNameError("");
              }}
              placeholder="เช่น S01 หรือชื่อเล่น"
              className="h-11 w-full rounded-card border border-border px-3 text-base text-navy bg-white"
              autoFocus
            />
            {nameError && (
              <p role="alert" className="text-xs text-error">
                {nameError}
              </p>
            )}
            <p className="text-xs text-navy/60">
              * แนะนำให้ใช้ชื่อเล่นหรือรหัสนิสิต ไม่ต้องใส่ชื่อจริงเต็ม
            </p>
          </div>

          {/* Research Consent Box */}
          <div className="flex flex-col gap-2 rounded-card bg-canvas p-3 border border-navy/10 text-left">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-navy/90 leading-relaxed">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-navy/30 text-blue focus:ring-blue"
              />
              <span>
                <strong>ยินยอมส่งข้อมูลผลการเรียนเพื่อการวิจัย</strong>: ยินยอมให้ระบบบันทึกคะแนน เวลา และสถิติข้อผิดพลาด เพื่อประเมินประสิทธิภาพสื่อการเรียนรู้ (สามารถเปลี่ยนการตั้งค่าได้ภายหลัง)
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="gold" onClick={handleSaveName}>
              เข้าสู่เกม
            </Button>
          </div>
        </div>
      </Dialog>
    </PageShell>
  );
}
