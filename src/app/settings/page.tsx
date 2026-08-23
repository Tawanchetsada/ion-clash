"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "../../components/layout/AppHeader";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { useSave } from "../../session/SaveProvider";
import { useToast } from "../../session/ToastProvider";

export default function SettingsPage() {
  const router = useRouter();
  const { save, commit } = useSave();
  const toast = useToast();

  const [nameInput, setNameInput] = useState(save?.playerName ?? "");

  if (save === null) {
    return (
      <PageShell>
        <AppHeader onHome={() => router.push("/")} />
        <main className="flex flex-1 flex-col items-center justify-center p-8">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy/20 border-t-gold" />
          <p className="mt-4 text-sm text-navy/70">กำลังโหลดการตั้งค่า…</p>
        </main>
      </PageShell>
    );
  }

  const handleToggleSetting = (
    key: "sound" | "music" | "reducedMotion" | "researchConsent",
    val: boolean,
  ) => {
    const updated = {
      ...save,
      settings: {
        ...save.settings,
        [key]: val,
      },
    };
    commit(updated);
  };

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    commit({ ...save, playerName: trimmed });
    toast.show("บันทึกชื่อผู้เรียนเรียบร้อยแล้ว");
  };

  return (
    <PageShell>
      <AppHeader
        onHome={() => router.push("/")}
        onHowToPlay={() => router.push("/how-to-play")}
      />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">
        <header className="border-b border-border pb-4">
          <h1 className="text-2xl font-bold text-navy">การตั้งค่า</h1>
          <p className="text-sm text-navy/70">
            ปรับแต่งการแสดงผล เสียง และข้อมูลผู้เรียน
          </p>
        </header>

        {/* Player Profile */}
        <div className="flex flex-col gap-3 rounded-card bg-white p-6 shadow-card border border-border">
          <h2 className="text-lg font-bold text-navy">ข้อมูลผู้เรียน</h2>
          <div className="flex flex-col gap-2">
            <label htmlFor="settings-name-input" className="text-xs font-semibold text-navy/70">
              ชื่อหรือรหัสผู้เรียน (ใช้สำหรับเก็บผลวิจัย):
            </label>
            <div className="flex gap-2">
              <input
                id="settings-name-input"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="เช่น S01 หรือชื่อเล่น"
                className="h-11 flex-1 rounded-card border border-border px-3 text-base text-navy"
              />
              <Button variant="gold" onClick={handleSaveName}>
                บันทึก
              </Button>
            </div>
            <p className="text-xs text-navy/80">
              * แนะนำให้ใช้ชื่อเล่นหรือรหัสนิสิตแทนชื่อจริงเต็ม
            </p>
          </div>
        </div>

        {/* Audio & Visual Settings */}
        <div className="flex flex-col gap-4 rounded-card bg-white p-6 shadow-card border border-border">
          <h2 className="text-lg font-bold text-navy">เสียงและการแสดงผล</h2>

          {/* Sound toggle */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <div className="font-semibold text-navy">เสียงเอฟเฟกต์ (Sound Effects)</div>
              <div className="text-xs text-navy/80">
                เสียงวางการ์ด เสียงตรวจถูก/ผิด และเสียงผ่านด่าน
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-label="เปิดปิดเสียงเอฟเฟกต์"
              aria-checked={save.settings.sound}
              onClick={() => handleToggleSetting("sound", !save.settings.sound)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                save.settings.sound ? "bg-green" : "bg-navy/20"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  save.settings.sound ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Music toggle */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <div className="font-semibold text-navy">เพลงพื้นหลัง (Music)</div>
              <div className="text-xs text-navy/80">
                เพลงบรรเลงประกอบระหว่างการเล่น (ปิดไว้เป็นค่าเริ่มต้นเพื่อสมาธิ)
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-label="เปิดปิดเพลงพื้นหลัง"
              aria-checked={save.settings.music}
              onClick={() => handleToggleSetting("music", !save.settings.music)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                save.settings.music ? "bg-green" : "bg-navy/20"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  save.settings.music ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion toggle */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div>
              <div className="font-semibold text-navy">ลดการเคลื่อนไหว (Reduced Motion)</div>
              <div className="text-xs text-navy/80">
                ปิดอนิเมชันการลากและเอฟเฟกต์การเคลื่อนไหว เหมาะสำหรับผู้ที่ไวต่อภาพเคลื่อนไหว
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-label="เปิดปิดการลดการเคลื่อนไหว"
              aria-checked={save.settings.reducedMotion}
              onClick={() =>
                handleToggleSetting("reducedMotion", !save.settings.reducedMotion)
              }
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                save.settings.reducedMotion ? "bg-green" : "bg-navy/20"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  save.settings.reducedMotion ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Research Consent toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-navy">ยินยอมส่งข้อมูลวิจัย (Research Data Consent)</div>
              <div className="text-xs text-navy/80">
                ส่งสถิติคะแนน เวลา และข้อผิดพลาดไปยังระบบบันทึกผลงานวิจัยเพื่อประเมินสื่อการเรียนรู้ (D-06, D-14)
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-label="เปิดปิดการยินยอมส่งข้อมูลวิจัย"
              aria-checked={save.settings.researchConsent}
              onClick={() =>
                handleToggleSetting("researchConsent", !save.settings.researchConsent)
              }
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                save.settings.researchConsent ? "bg-green" : "bg-navy/20"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  save.settings.researchConsent ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Data Link */}
        <div className="flex items-center justify-between rounded-card bg-canvas p-4 border border-navy/10">
          <div>
            <div className="font-semibold text-navy">การสำรองและกู้คืนข้อมูล</div>
            <div className="text-xs text-navy/80">ส่งออกเป็นไฟล์ JSON หรือรีเซ็ตความก้าวหน้า</div>
          </div>
          <Link
            href="/progress"
            className="min-h-11 inline-flex items-center justify-center rounded-card bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"
          >
            จัดการข้อมูล
          </Link>
        </div>
      </main>
    </PageShell>
  );
}
