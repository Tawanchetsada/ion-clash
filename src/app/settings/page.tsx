"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "../../components/layout/AppHeader";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { LockIcon, WarningIcon } from "../../components/ui/Icon";
import { useSave } from "../../session/SaveProvider";
import { useToast } from "../../session/ToastProvider";

export default function SettingsPage() {
  const router = useRouter();
  const { save, commit, reset } = useSave();
  const toast = useToast();

  const [showResetNameDialog, setShowResetNameDialog] = useState(false);

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

  const handleResetAndNewName = () => {
    reset();
    setShowResetNameDialog(false);
    toast.show("รีเซ็ตข้อมูลเรียบร้อย กรุณากรอกชื่อผู้เรียนใหม่");
    router.push("/");
  };

  return (
    <PageShell>
      <AppHeader
        onHome={() => router.push("/")}
        onLevels={() => router.push("/levels")}
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
        <div className="flex flex-col gap-4 rounded-card bg-white p-6 shadow-card border border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy">ข้อมูลผู้เรียน</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/5 px-3 py-1 text-xs font-semibold text-navy/70 border border-border">
              <LockIcon className="text-sm" />
              ไม่สามารถแก้ไขชื่อได้
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-navy/70">
              ชื่อหรือรหัสผู้เรียน (ใช้สำหรับเก็บผลวิจัย):
            </span>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-canvas px-4 py-3 border border-navy/10">
              <span className="text-lg font-bold text-navy">
                {save.playerName.trim() !== "" ? save.playerName : "ยังไม่ได้ระบุชื่อ"}
              </span>
              <Button
                variant="outline"
                className="text-sm"
                onClick={() => setShowResetNameDialog(true)}
              >
                เล่นใหม่ด้วยชื่อใหม่
              </Button>
            </div>

            <p className="text-xs text-navy/70">
              * ชื่อผู้เรียนถูกบันทึกถาวรเพื่อความถูกต้องของงานวิจัย หากต้องการเปลี่ยนชื่อจะต้องเลือก &ldquo;เล่นใหม่ด้วยชื่อใหม่&rdquo; ซึ่งจะรีเซ็ตความก้าวหน้าทั้งหมด
            </p>
          </div>
        </div>

        {/* Audio & Visual Settings */}
        <div className="flex flex-col gap-4 rounded-card bg-white p-6 shadow-card border border-border">
          <h2 className="text-lg font-bold text-navy">เสียงและการแสดงผล</h2>

          {/* Sound toggle */}
          <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
            <div className="min-w-0 flex-1">
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
              className={`shrink-0 relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
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
          <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-navy">เพลงพื้นหลัง (Music)</div>
              <div className="text-xs text-navy/80">
                เพลงบรรเลงประกอบแบบ Lo-Fi ผ่อนคลาย เพื่อความเพลิดเพลินระหว่างการเรียนรู้
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-label="เปิดปิดเพลงพื้นหลัง"
              aria-checked={save.settings.music}
              onClick={() => handleToggleSetting("music", !save.settings.music)}
              className={`shrink-0 relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
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
          <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
            <div className="min-w-0 flex-1">
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
              className={`shrink-0 relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
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
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
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
              className={`shrink-0 relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
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

      {/* Confirmation Dialog for Resetting and Playing with New Name */}
      <Dialog
        open={showResetNameDialog}
        titleTh="เริ่มเล่นใหม่ด้วยชื่อใหม่หรือไม่?"
        onClose={() => setShowResetNameDialog(false)}
      >
        <div className="flex flex-col gap-4 text-left">
          <div className="flex items-start gap-2.5 rounded-card bg-amber-50 border border-gold/60 p-3 text-xs text-navy">
            <WarningIcon className="text-gold text-base shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-error">คำเตือนสำคัญ:</p>
              <p className="text-navy/85 mt-0.5">
                การเริ่มเล่นใหม่ด้วยชื่อใหม่จะรีเซ็ตความก้าวหน้า ดาวที่ได้รับ และคะแนนทั้งหมด เพื่อให้ผู้เรียนคนใหม่สามารถเริ่มบันทึกผลการเรียนรู้ใหม่ตั้งแต่ต้น
              </p>
            </div>
          </div>
          <p className="text-sm text-navy/80">
            คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตข้อมูลและตั้งชื่อผู้เรียนใหม่?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowResetNameDialog(false)}
            >
              ยกเลิก
            </Button>
            <Button
              variant="gold"
              onClick={handleResetAndNewName}
            >
              ยืนยันและเริ่มใหม่
            </Button>
          </div>
        </div>
      </Dialog>
    </PageShell>
  );
}
