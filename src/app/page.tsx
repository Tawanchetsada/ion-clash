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
    <PageShell>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <div className="flex max-w-lg flex-col items-center gap-8 rounded-card bg-white p-8 shadow-card border border-border sm:p-12 w-full">
          {/* Logo & Title */}
          <div className="flex flex-col items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-gold text-2xl font-black text-navy shadow-card"
            >
              IC
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-navy">
              ION CLASH
            </h1>
            <p className="text-sm font-semibold text-navy/80">
              แยกไอออน • สร้างตะกอน • ตัดไอออนผู้ชม
            </p>
            <p className="text-xs text-navy/60">
              เกมเคมี ม.4 สำหรับเรียนรู้สมการไอออนิกและปฏิกิริยาการตกตะกอน
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex w-full flex-col gap-3">
            {save === null ? (
              <div className="h-12 w-full animate-pulse rounded-card bg-navy/10" />
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
                  variant="outline"
                  className="h-11 w-full text-sm font-semibold"
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
          </div>

          {/* Secondary Nav Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border pt-6 w-full text-sm">
            <Link
              href="/how-to-play"
              className="min-h-11 inline-flex items-center justify-center rounded-card bg-blue/10 px-4 py-2 font-semibold text-blue hover:bg-blue/20"
            >
              วิธีการเล่น
            </Link>
            <Link
              href="/knowledge"
              className="min-h-11 inline-flex items-center justify-center rounded-card bg-green/10 px-4 py-2 font-semibold text-green hover:bg-green/20"
            >
              ความรู้ก่อนเล่นเกม
            </Link>
            <Link
              href="/progress"
              className="min-h-11 inline-flex items-center justify-center rounded-card border border-navy/20 px-4 py-2 font-semibold text-navy hover:bg-navy/5"
            >
              ความก้าวหน้า
            </Link>
            <Link
              href="/settings"
              className="min-h-11 inline-flex items-center justify-center rounded-card border border-navy/20 px-4 py-2 font-semibold text-navy hover:bg-navy/5"
            >
              ตั้งค่า
            </Link>
          </div>
        </div>
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
