"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AppHeader } from "../../components/layout/AppHeader";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import type { ImportPreview } from "../../storage/repository";
import type { GameSaveV1 } from "../../storage/schema";
import { useOptionalResearch } from "../../session/ResearchProvider";
import { useSave } from "../../session/SaveProvider";
import { useToast } from "../../session/ToastProvider";
import { CopyIcon, DownloadIcon, StarIcon, TrophyIcon } from "../../components/ui/Icon";

export default function ProgressPage() {
  const router = useRouter();
  const { save, exportJson, importJson, applyImport, reset } = useSave();
  const research = useOptionalResearch();
  const toast = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importPending, setImportPending] = useState<{
    merged: GameSaveV1;
    preview: ImportPreview;
  } | null>(null);

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetError, setResetError] = useState("");

  const [fallbackClipboardText, setFallbackClipboardText] = useState<string | null>(null);

  if (save === null) {
    return (
      <PageShell>
        <AppHeader onHome={() => router.push("/")} />
        <main className="flex flex-1 flex-col items-center justify-center p-8">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-navy/20 border-t-gold" />
          <p className="mt-4 text-sm text-navy/70">กำลังโหลดความก้าวหน้า…</p>
        </main>
      </PageShell>
    );
  }

  const completedList = Object.entries(save.completedLevels).filter(
    ([, lvl]) => lvl.completed,
  );
  const completedCount = completedList.length;
  const totalStars = completedList.reduce((sum, [, lvl]) => sum + lvl.stars, 0);
  const totalScore = completedList.reduce((sum, [, lvl]) => sum + lvl.bestScore, 0);
  const totalTimeMs = completedList.reduce(
    (sum, [, lvl]) => sum + (lvl.bestTimeMs ?? 0),
    0,
  );
  const totalMinutes = Math.floor(totalTimeMs / 60000);
  const totalSeconds = Math.floor((totalTimeMs % 60000) / 1000);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = importJson(text);
      if (result.ok) {
        setImportPending({ merged: result.merged, preview: result.preview });
      } else {
        toast.show("ไฟล์บันทึกไม่ถูกต้องหรือเวอร์ชันไม่รองรับ");
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = "";
  };

  const handleConfirmImport = () => {
    if (importPending) {
      applyImport(importPending.merged);
      setImportPending(null);
      toast.show("นำเข้าข้อมูลและรวมความก้าวหน้าสำเร็จ");
    }
  };

  const handleExecuteReset = () => {
    if (resetConfirmText.trim() !== "RESET") {
      setResetError("กรุณาพิมพ์คำว่า RESET ตัวพิมพ์ใหญ่เพื่อยืนยัน");
      return;
    }
    reset();
    research?.clearEvents();
    setShowResetDialog(false);
    setResetConfirmText("");
    setResetError("");
    toast.show("รีเซ็ตข้อมูลความก้าวหน้าทั้งหมดเรียบร้อยแล้ว");
  };

  const handleCopyTsv = async () => {
    const tsvData = research ? research.exportTsv() : "";
    if (!tsvData || tsvData.trim().split("\n").length <= 1) {
      toast.show("ยังไม่มีข้อมูลบันทึกผลการเล่น");
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(tsvData);
        toast.show("คัดลอกผลการเรียน (TSV) เรียบร้อยแล้ว พร้อมวางลง Google Sheets หรือ Google Form");
        return;
      } catch {
        // Fallback when clipboard write fails
      }
    }
    setFallbackClipboardText(tsvData);
  };

  const handleDownloadCsv = () => {
    const csvData = research ? research.exportCsv() : "";
    if (!csvData || csvData.trim().split("\n").length <= 1) {
      toast.show("ยังไม่มีข้อมูลบันทึกผลการเล่น");
      return;
    }

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (save.playerName || "student").replace(/[/\\?%*:|"<>]/g, "-");
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `ion-clash-research-${safeName}-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.show("ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว");
  };

  const isLevel50Completed = save.completedLevels["50"]?.completed === true;

  return (
    <PageShell>
      <AppHeader
        onHome={() => router.push("/")}
        onHowToPlay={() => router.push("/how-to-play")}
      />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8">
        {/* Level 50 Complete Banner */}
        {isLevel50Completed && (
          <div className="flex flex-col gap-2 rounded-card bg-gold/15 border-2 border-gold p-4 text-navy shadow-card sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-bold text-base flex items-center gap-1.5 text-navy">
                <TrophyIcon className="text-gold" />
                <span>ยินดีด้วย! คุณผ่านครบทั้ง 50 ด่านของ Ion Clash แล้ว</span>
              </div>
              <div className="text-xs text-navy/80 mt-0.5">
                กรุณากดปุ่ม <strong>&ldquo;คัดลอกผลการเรียน (TSV)&rdquo;</strong> หรือดาวน์โหลด CSV เพื่อส่งผลให้ครูผู้สอน/ผู้วิจัย
              </div>
            </div>
            <Button variant="gold" onClick={handleCopyTsv} className="whitespace-nowrap mt-2 sm:mt-0">
              คัดลอกผลการเรียน
            </Button>
          </div>
        )}

        <header className="border-b border-border pb-4">
          <h1 className="text-2xl font-bold text-navy">ความก้าวหน้าและการจัดการข้อมูล</h1>
          <p className="text-sm text-navy/70">
            สรุปผลการเรียนรู้และเครื่องมือสำรอง/กู้คืนข้อมูล
          </p>
        </header>

        {/* Player Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-navy p-6 text-white shadow-card">
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gold font-bold text-navy text-xl"
            >
              {save.playerName ? save.playerName[0]?.toUpperCase() : "U"}
            </span>
            <div>
              <div className="text-xs text-white/70">ผู้เรียน</div>
              <div className="text-xl font-bold">
                {save.playerName || "ผู้เล่นนิรนาม"}
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-white/70">
            <div>ปลดล็อกถึง: ด่าน {save.unlockedLevel} / 50</div>
            <div>บันทึกล่าสุด: {new Date(save.updatedAt).toLocaleString("th-TH")}</div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="flex flex-col items-center rounded-card bg-white p-4 text-center shadow-card border border-border">
            <span className="text-xs font-semibold text-navy/70">ด่านที่ผ่าน</span>
            <span className="mt-1 text-2xl font-bold text-blue">
              {completedCount} / 50
            </span>
          </div>

          <div className="flex flex-col items-center rounded-card bg-white p-4 text-center shadow-card border border-border">
            <span className="text-xs font-semibold text-navy/70">ดาวรวม</span>
            <span className="mt-1 text-2xl font-bold text-navy">
              <StarIcon className="mr-1 text-gold" />
              {totalStars}
            </span>
          </div>

          <div className="flex flex-col items-center rounded-card bg-white p-4 text-center shadow-card border border-border">
            <span className="text-xs font-semibold text-navy/70">คะแนนสะสม</span>
            <span className="mt-1 text-2xl font-bold text-navy">
              {totalScore}
            </span>
          </div>

          <div className="flex flex-col items-center rounded-card bg-white p-4 text-center shadow-card border border-border">
            <span className="text-xs font-semibold text-navy/70">เวลารวมที่ใช้</span>
            <span className="mt-1 text-2xl font-bold text-navy">
              {totalMinutes}น. {totalSeconds}วิ.
            </span>
          </div>
        </div>

        {/* Research Data Actions (D-06, D-14) */}
        <div className="flex flex-col gap-4 rounded-card bg-white p-6 shadow-card border border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy">ข้อมูลการวิจัยและการส่งผลการเรียน</h2>
            <span className="rounded-full bg-blue/10 px-2.5 py-0.5 text-xs font-semibold text-blue">
              สำหรับงานวิจัย
            </span>
          </div>
          <p className="text-xs text-navy/70 leading-relaxed">
            สำหรับส่งผลการเรียนให้ครูผู้สอนหรือผู้วิจัย: แนะนำให้ใช้ปุ่ม <strong>&ldquo;คัดลอกผลการเรียน (TSV)&rdquo;</strong> เพื่อนำไปวางลงใน Google Sheets หรือ Google Forms ได้ทันทีบน iPad หรือดาวน์โหลดเป็นไฟล์ CSV สำหรับเปิดใน Excel
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="gold" onClick={handleCopyTsv} className="font-bold">
              <CopyIcon className="mr-1.5" />คัดลอกผลการเรียน (TSV)
            </Button>

            <Button variant="outline" onClick={handleDownloadCsv}>
              <DownloadIcon className="mr-1.5" />ดาวน์โหลด CSV
            </Button>
          </div>
        </div>

        {/* Data Management Actions */}
        <div className="flex flex-col gap-4 rounded-card bg-white p-6 shadow-card border border-border">
          <h2 className="text-lg font-bold text-navy">การสำรองและกู้คืนข้อมูล</h2>
          <p className="text-xs text-navy/70">
            เนื่องจากข้อมูลถูกเก็บไว้ในเบราว์เซอร์นี้ หากเปลี่ยนเครื่องหรือต้องการสำรองข้อมูล ให้ส่งออกเป็นไฟล์ JSON
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="outline" onClick={exportJson}>
              ส่งออกข้อมูล (Export JSON)
            </Button>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              นำเข้าข้อมูล (Import JSON)
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              className="ml-auto min-h-11 min-w-11 inline-flex items-center justify-center rounded-card bg-error px-4 py-2 font-bold text-white shadow-card hover:bg-error/90"
              onClick={() => setShowResetDialog(true)}
            >
              รีเซ็ตข้อมูลทั้งหมด
            </button>
          </div>
        </div>
      </main>

      {/* Clipboard Fallback Modal */}
      <Dialog
        open={fallbackClipboardText !== null}
        titleTh="คัดลอกผลการเรียนสำหรับงานวิจัย"
        onClose={() => setFallbackClipboardText(null)}
      >
        <div className="flex flex-col gap-3 text-left">
          <p className="text-sm text-navy/80">
            เนื่องจากเบราว์เซอร์ไม่อนุญาตให้คัดลอกอัตโนมัติ กรุณาเลือกข้อความทั้งหมดในกล่องด้านล่างแล้วกดคัดลอก (Copy):
          </p>
          <textarea
            readOnly
            value={fallbackClipboardText ?? ""}
            onFocus={(e) => e.target.select()}
            rows={8}
            className="w-full rounded-card border border-border bg-canvas p-2.5 font-mono text-xs text-navy select-all"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="gold" onClick={() => setFallbackClipboardText(null)}>
              ปิดหน้าต่าง
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Import Preview Dialog */}
      <Dialog
        open={importPending !== null}
        titleTh="ยืนยันการนำเข้าข้อมูล"
        onClose={() => setImportPending(null)}
      >
        <div className="flex flex-col gap-4 text-left">
          <p className="text-sm text-navy/80">
            ระบบจะรวมข้อมูลที่นำเข้าเข้ากับข้อมูลปัจจุบัน โดยเลือกด่านที่ผ่าน คะแนน และดาวที่สูงกว่า
          </p>
          {importPending && (
            <div className="flex flex-col gap-2 rounded-card bg-canvas p-4 text-xs text-navy border border-border">
              <div>
                <span className="font-semibold">ผู้เรียนในไฟล์: </span>
                <span>{importPending.preview.playerName || "ไม่ระบุชื่อ"}</span>
              </div>
              <div>
                <span className="font-semibold">ด่านที่ผ่าน: </span>
                <span>{importPending.preview.completedCount} ด่าน (สูงสุดด่าน {importPending.preview.highestLevel})</span>
              </div>
              <div>
                <span className="font-semibold">บันทึกเมื่อ: </span>
                <span>{new Date(importPending.preview.updatedAt).toLocaleString("th-TH")}</span>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setImportPending(null)}>
              ยกเลิก
            </Button>
            <Button variant="gold" onClick={handleConfirmImport}>
              รวมข้อมูลและบันทึก
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Reset Confirmation Dialog (2-Step / Type RESET) */}
      <Dialog
        open={showResetDialog}
        titleTh="ต้องการรีเซ็ตข้อมูลทั้งหมดหรือไม่?"
        onClose={() => {
          setShowResetDialog(false);
          setResetConfirmText("");
          setResetError("");
        }}
      >
        <div className="flex flex-col gap-4 text-left">
          <p className="text-sm text-error font-semibold">
            การดำเนินการนี้จะล้างความก้าวหน้าทั้งหมดและไม่สามารถกู้คืนได้ หากยังไม่ได้ส่งออกไฟล์ JSON สำรองไว้
          </p>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reset-confirm-input" className="text-xs font-bold text-navy">
              พิมพ์คำว่า RESET เพื่อยืนยัน:
            </label>
            <input
              id="reset-confirm-input"
              type="text"
              value={resetConfirmText}
              onChange={(e) => {
                setResetConfirmText(e.target.value);
                if (resetError) setResetError("");
              }}
              placeholder="RESET"
              className="h-11 w-full rounded-card border border-error px-3 text-base text-navy font-mono uppercase bg-white"
            />
            {resetError && (
              <p role="alert" className="text-xs text-error">
                {resetError}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowResetDialog(false);
                setResetConfirmText("");
                setResetError("");
              }}
            >
              ยกเลิก
            </Button>
            <button
              type="button"
              className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-card bg-error px-4 py-2 font-bold text-white shadow-card hover:bg-error/90"
              onClick={handleExecuteReset}
            >
              ยืนยันการล้างข้อมูล
            </button>
          </div>
        </div>
      </Dialog>
    </PageShell>
  );
}
