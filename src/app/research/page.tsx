"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppHeader } from "../../components/layout/AppHeader";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import type { ErrorCode } from "../../domain/chemistry/types";
import { parseDelimited, toCsv } from "../../research/csv";
import {
  summarizeResearchData,
  type ResearchSummary,
} from "../../research/stats";
import type { ResearchEvent } from "../../research/types";
import { useOptionalResearch } from "../../session/ResearchProvider";
import { useToast } from "../../session/ToastProvider";

const ERROR_LABELS: Record<string, string> = {
  "E-CHARGE": "ผลรวมประจุไม่เป็นศูนย์",
  "E-PAIR": "จับคู่ไอออนไม่ถูกต้อง",
  "E-PHASE": "ระบุสถานะสารผิด",
  "E-BALANCE": "ดุลสัมประสิทธิ์ไม่ถูกต้อง",
  "E-RATIO": "สัมประสิทธิ์ไม่ใช่อัตราส่วนอย่างต่ำ",
  "E-SPECTATOR": "ตัดไอออนผู้ชมไม่ถูกต้อง",
};

export default function ResearchPage() {
  const router = useRouter();
  const research = useOptionalResearch();
  const toast = useToast();

  const [rawInput, setRawInput] = useState("");
  const [events, setEvents] = useState<ResearchEvent[]>(() => {
    return research ? [...research.getAllEvents()] : [];
  });

  const [defaultMaxE2, setDefaultMaxE2] = useState<number>(30);
  const [e2Scores, setE2Scores] = useState<Record<string, number>>({});
  const [selectedPlayerFilter, setSelectedPlayerFilter] = useState<string>("ALL");

  const summary: ResearchSummary = useMemo(() => {
    const e2Map: Record<string, { score: number; maxScore: number }> = {};
    for (const [name, score] of Object.entries(e2Scores)) {
      e2Map[name] = { score, maxScore: defaultMaxE2 };
    }
    return summarizeResearchData(events, e2Map);
  }, [events, e2Scores, defaultMaxE2]);

  const handleProcessRawText = () => {
    if (!rawInput.trim()) {
      toast.show("กรุณาวางข้อความ TSV หรือ CSV");
      return;
    }
    const parsed = parseDelimited(rawInput);
    if (parsed.length === 0) {
      toast.show("ไม่สามารถอ่านข้อมูลได้ กรุณาตรวจสอบรูปแบบหัวตาราง");
      return;
    }

    setEvents((prev) => [...prev, ...parsed]);
    setRawInput("");
    toast.show(`นำเข้าข้อมูลสำเร็จ ${parsed.length} รายการ`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const promises: Promise<string>[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      promises.push(
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve((evt.target?.result as string) || "");
          reader.readAsText(file);
        }),
      );
    }

    Promise.all(promises).then((contents) => {
      let totalParsed: ResearchEvent[] = [];
      for (const text of contents) {
        const parsed = parseDelimited(text);
        totalParsed = totalParsed.concat(parsed);
      }

      if (totalParsed.length > 0) {
        setEvents((prev) => [...prev, ...totalParsed]);
        toast.show(`นำเข้าข้อมูลจาก ${files.length} ไฟล์สำเร็จ (${totalParsed.length} รายการ)`);
      } else {
        toast.show("ไม่พบข้อมูลที่ถูกต้องในไฟล์ที่เลือก");
      }
    });

    e.target.value = "";
  };

  const handleLoadLocal = () => {
    if (!research) return;
    const local = research.getAllEvents();
    if (local.length === 0) {
      toast.show("ไม่มีข้อมูลวิจัยในเครื่องนี้");
      return;
    }
    setEvents(local as ResearchEvent[]);
    toast.show(`โหลดข้อมูลในเครื่องเรียบร้อย (${local.length} รายการ)`);
  };

  const handleClearAll = () => {
    setEvents([]);
    setE2Scores({});
    toast.show("ล้างข้อมูลบนหน้าจอเรียบร้อย");
  };

  const handleExportCombinedCsv = () => {
    if (events.length === 0) {
      toast.show("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }
    const csv = toCsv(events);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ion-clash-research-combined-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.show("ดาวน์โหลด CSV รวมเรียบร้อยแล้ว");
  };

  const filteredEvents = useMemo(() => {
    if (selectedPlayerFilter === "ALL") return events;
    return events.filter(
      (e) => (e.playerName || e.installId || "Unknown") === selectedPlayerFilter,
    );
  }, [events, selectedPlayerFilter]);

  const distinctPlayers = useMemo(() => {
    const set = new Set<string>();
    for (const ev of events) {
      set.add(ev.playerName || ev.installId || "Unknown");
    }
    return Array.from(set).sort();
  }, [events]);

  return (
    <PageShell>
      <AppHeader
        onHome={() => router.push("/")}
        onHowToPlay={() => router.push("/how-to-play")}
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8">
        <header className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <span className="rounded bg-navy px-2 py-0.5 text-xs font-bold text-white">
              RESEARCH
            </span>
            <h1 className="text-2xl font-bold text-navy">
              แดชบอร์ดข้อมูลวิจัยและการประเมิน E1/E2
            </h1>
          </div>
          <p className="mt-1 text-sm text-navy/70">
            ระบบวิเคราะห์ประสิทธิภาพสื่อการเรียนรู้ตามเกณฑ์ 80/80 และสถิติข้อผิดพลาดของผู้เรียน (D-06, D-07, D-12, D-13)
          </p>
        </header>

        {/* 1. Import Section */}
        <section className="flex flex-col gap-4 rounded-card bg-white p-6 shadow-card border border-border">
          <h2 className="text-lg font-bold text-navy">1. นำเข้าข้อมูลผลการเรียนรู้</h2>
          <p className="text-xs text-navy/70 leading-relaxed">
            วางข้อมูล TSV ที่คัดลอกจากเครื่องผู้เรียนหลายคน หรืออัปโหลดไฟล์ CSV (ระบบจะตัดแถวซ้ำด้วยรหัสเครื่อง ด่าน และครั้งที่เล่นโดยอัตโนมัติ)
          </p>

          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="วางข้อมูล TSV หรือ CSV ที่นี่..."
            rows={4}
            className="w-full rounded-card border border-border bg-canvas p-3 font-mono text-xs text-navy"
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="gold" onClick={handleProcessRawText}>
              ประมวลผลข้อความ
            </Button>

            <label className="min-h-11 inline-flex items-center justify-center rounded-card border border-navy/20 bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5 cursor-pointer">
              <span>📂 อัปโหลดไฟล์ CSV/TSV</span>
              <input
                type="file"
                accept=".csv,.tsv,.txt"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            <Button variant="outline" onClick={handleLoadLocal}>
              โหลดข้อมูลจากเครื่องนี้
            </Button>

            {events.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="ml-auto text-xs font-semibold text-error hover:underline"
              >
                ล้างข้อมูล ({events.length} รายการ)
              </button>
            )}
          </div>
        </section>

        {/* 2. E1 / E2 Summary Cards */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy">2. สรุปผลประสิทธิภาพตามเกณฑ์ 80/80</h2>
            <div className="flex items-center gap-2">
              <label htmlFor="max-e2-input" className="text-xs font-semibold text-navy/70">
                คะแนนเต็มแบบทดสอบหลังเรียน (E2):
              </label>
              <input
                id="max-e2-input"
                type="number"
                min={1}
                max={100}
                value={defaultMaxE2}
                onChange={(e) => setDefaultMaxE2(Math.max(1, Number(e.target.value) || 1))}
                className="h-8 w-16 rounded border border-border px-2 text-center text-sm font-bold text-navy"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* E1 Card */}
            <div className="flex flex-col rounded-card bg-white p-5 shadow-card border border-border">
              <span className="text-xs font-semibold text-navy/70">
                E1 (ประสิทธิภาพระหว่างเรียน)
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-navy">
                  {summary.overallE1.toFixed(1)}%
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    summary.e1Passed
                      ? "bg-green text-white"
                      : "bg-error text-white"
                  }`}
                >
                  {summary.e1Passed ? "ผ่านเกณฑ์ (≥80)" : "ไม่ผ่านเกณฑ์"}
                </span>
              </div>
              <p className="mt-2 text-xs text-navy/80">
                คำนวณจากคะแนนเกมรายด่านของผู้เรียนทุกคน ({summary.participants.length} คน)
              </p>
            </div>

            {/* E2 Card */}
            <div className="flex flex-col rounded-card bg-white p-5 shadow-card border border-border">
              <span className="text-xs font-semibold text-navy/70">
                E2 (ประสิทธิภาพหลังเรียน)
              </span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-navy">
                  {summary.overallE2 !== null ? `${summary.overallE2.toFixed(1)}%` : "—"}
                </span>
                {summary.overallE2 !== null && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      summary.e2Passed
                        ? "bg-green text-white"
                        : "bg-error text-white"
                    }`}
                  >
                    {summary.e2Passed ? "ผ่านเกณฑ์ (≥80)" : "ไม่ผ่านเกณฑ์"}
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-navy/80">
                คำนวณจากคะแนนแบบทดสอบกระดาษหลังเรียน
              </p>
            </div>

            {/* Benchmark 80/80 Card */}
            <div className="flex flex-col rounded-card bg-navy p-5 text-white shadow-card">
              <span className="text-xs font-semibold text-white/70">
                เกณฑ์ประสิทธิภาพ E1/E2
              </span>
              <div className="mt-2 text-2xl font-black text-gold">
                {summary.overallE2 === null
                  ? `${summary.overallE1.toFixed(1)} / —`
                  : `${summary.overallE1.toFixed(1)} / ${summary.overallE2.toFixed(1)}`}
              </div>
              <div className="mt-2">
                {summary.benchmarkPassed === true && (
                  <span className="inline-flex items-center rounded-full bg-green px-2.5 py-0.5 text-xs font-bold text-white">
                    ✓ ผ่านเกณฑ์ 80/80
                  </span>
                )}
                {summary.benchmarkPassed === false && (
                  <span className="inline-flex items-center rounded-full bg-error px-2.5 py-0.5 text-xs font-bold text-white">
                    ✕ ยังไม่ถึงเกณฑ์ 80/80
                  </span>
                )}
                {summary.benchmarkPassed === null && (
                  <span className="text-xs text-white/60">
                    * กรุณากรอกคะแนน E2 ในตารางด้านล่าง
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 3. Participant Breakdown Table */}
        <section className="flex flex-col gap-4 rounded-card bg-white p-6 shadow-card border border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy">
              3. สรุปผลรายบุคคลและกรอกคะแนน E2 ({summary.participants.length} คน)
            </h2>
            <Button variant="outline" onClick={handleExportCombinedCsv} className="text-xs">
              ส่งออก CSV รวมทุกคน
            </Button>
          </div>

          <div
            className="overflow-x-auto focus:ring-2 focus:ring-focus-ring rounded-card"
            tabIndex={0}
            role="region"
            aria-label="ตารางสรุปผลรายบุคคล"
          >
            <table className="w-full text-left text-sm text-navy border-collapse">
              <thead>
                <tr className="border-b border-border bg-canvas/60 text-xs font-bold text-navy/70">
                  <th className="p-3">ผู้เรียน</th>
                  <th className="p-3 text-center">ด่านที่เล่นจบ</th>
                  <th className="p-3 text-right">คะแนนรวม</th>
                  <th className="p-3 text-right">E1 รายคน (%)</th>
                  <th className="p-3 text-center">คะแนน E2 (กรอกมือ)</th>
                  <th className="p-3 text-right">E2 รายคน (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {summary.participants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-navy/80">
                      ยังไม่มีข้อมูลผู้เรียน กรุณานำเข้าข้อมูลในส่วนที่ 1
                    </td>
                  </tr>
                ) : (
                  summary.participants.map((p) => {
                    const rawE2 = e2Scores[p.playerName];
                    const e2Percent =
                      rawE2 !== undefined && defaultMaxE2 > 0
                        ? Math.round((rawE2 / defaultMaxE2) * 1000) / 10
                        : null;

                    return (
                      <tr key={p.playerName} className="hover:bg-canvas/30">
                        <td className="p-3 font-semibold">{p.playerName}</td>
                        <td className="p-3 text-center">{p.completedLevelsCount} / 50</td>
                        <td className="p-3 text-right font-mono">{p.totalScore.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-blue">{p.e1.toFixed(1)}%</td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={defaultMaxE2}
                              value={rawE2 ?? ""}
                              placeholder="0"
                              onChange={(e) => {
                                const val = e.target.value === "" ? undefined : Number(e.target.value);
                                setE2Scores((prev) => {
                                  const next = { ...prev };
                                  if (val === undefined) {
                                    delete next[p.playerName];
                                  } else {
                                    next[p.playerName] = Math.max(0, Math.min(defaultMaxE2, val));
                                  }
                                  return next;
                                });
                              }}
                              className="h-8 w-16 rounded border border-border px-2 text-center text-sm font-bold text-navy"
                            />
                            <span className="text-xs text-navy/80">/ {defaultMaxE2}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-bold text-green">
                          {e2Percent !== null ? `${e2Percent.toFixed(1)}%` : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Error Analysis */}
        <section className="flex flex-col gap-6 rounded-card bg-white p-6 shadow-card border border-border">
          <div>
            <h2 className="text-lg font-bold text-navy">
              4. สถิติข้อผิดพลาดของผู้เรียน (Error Analysis)
            </h2>
            <p className="text-xs text-navy/70 mt-1">
              วิเคราะห์ความถี่ของข้อผิดพลาดทั้ง 6 รหัส เพื่อตอบคำถามวิจัยว่าผู้เรียนติดขัดในเนื้อหาใดมากที่สุด
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 items-center">
            {/* Custom SVG Bar Chart */}
            <div className="flex flex-col gap-3 rounded-card bg-canvas p-4 border border-border">
              <span className="text-xs font-bold text-navy">สัดส่วนข้อผิดพลาดตามรหัส (%)</span>
              <div className="flex flex-col gap-3 py-2">
                {Object.entries(summary.errorAnalysis.percentages).map(([code, pct]) => {
                  const errorCode = code as ErrorCode;
                  const isTop = summary.errorAnalysis.mostFrequent.includes(errorCode);
                  return (
                    <div key={code} className="flex flex-col gap-1">
                      <div className="flex justify-between text-xs font-semibold text-navy">
                        <span>{code} ({ERROR_LABELS[code] || code})</span>
                        <span>{pct}% ({summary.errorAnalysis.tally[errorCode] || 0} ครั้ง)</span>
                      </div>
                      <div className="h-4 w-full rounded-full bg-navy/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isTop ? "bg-error" : "bg-blue"
                          }`}
                          style={{ width: `${Math.max(pct, 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error Table & Summary */}
            <div className="flex flex-col gap-4">
              <div className="rounded-card bg-canvas p-4 border border-border">
                <div className="text-xs text-navy/70">ข้อผิดพลาดทั้งหมดที่บันทึกได้</div>
                <div className="text-2xl font-black text-navy mt-1">
                  {summary.errorAnalysis.totalErrors.toLocaleString()} ครั้ง
                </div>
                {summary.errorAnalysis.mostFrequent.length > 0 && (
                  <div className="mt-3 text-xs text-error font-bold flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>
                      พบข้อผิดพลาดรหัส {summary.errorAnalysis.mostFrequent.join(", ")} บ่อยที่สุด
                    </span>
                  </div>
                )}
              </div>

              <div className="text-xs text-navy/70 leading-relaxed">
                * ข้อมูลนี้นำไปใช้อภิปรายผลในบทที่ 4–5 ของวิทยานิพนธ์ เพื่อเสนอแนะแนวทางพัฒนาการสอนเรื่องปฏิกิริยาการตกตะกอนและการแตกตัวของสารอิเล็กโทรไลต์
              </div>
            </div>
          </div>
        </section>

        {/* 5. Detailed Event Log Table */}
        <section className="flex flex-col gap-4 rounded-card bg-white p-6 shadow-card border border-border">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-navy">
              5. บันทึกเหตุการณ์รายด่านทั้งหมด ({filteredEvents.length} รายการ)
            </h2>
            <div className="flex items-center gap-2">
              <label htmlFor="player-filter" className="text-xs font-semibold text-navy/70">
                กรองตามผู้เรียน:
              </label>
              <select
                id="player-filter"
                value={selectedPlayerFilter}
                onChange={(e) => setSelectedPlayerFilter(e.target.value)}
                className="h-8 rounded border border-border px-2 text-xs font-semibold text-navy bg-white"
              >
                <option value="ALL">ทุกคน ({distinctPlayers.length} คน)</option>
                {distinctPlayers.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className="max-h-96 overflow-y-auto border border-border rounded-card focus:ring-2 focus:ring-focus-ring"
            tabIndex={0}
            role="region"
            aria-label="ตารางบันทึกเหตุการณ์รายด่านทั้งหมด"
          >
            <table className="w-full text-left text-xs text-navy border-collapse">
              <thead className="sticky top-0 bg-canvas text-navy/80 font-bold border-b border-border">
                <tr>
                  <th className="p-2.5">ผู้เรียน</th>
                  <th className="p-2.5 text-center">ด่าน</th>
                  <th className="p-2.5 text-center">ครั้งที่</th>
                  <th className="p-2.5 text-right">คะแนน</th>
                  <th className="p-2.5 text-center">ดาว</th>
                  <th className="p-2.5 text-right">เวลา</th>
                  <th className="p-2.5 text-center">คำใบ้/ผิด</th>
                  <th className="p-2.5">รหัสผิดพลาดที่พบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-navy/80">
                      ไม่มีรายการบันทึก
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((ev, idx) => {
                    const errorList = Object.entries(ev.errorsByCode || {})
                      .filter(([, cnt]) => cnt > 0)
                      .map(([code, cnt]) => `${code} (${cnt})`);

                    return (
                      <tr key={idx} className="hover:bg-canvas/30">
                        <td className="p-2.5 font-semibold">{ev.playerName || ev.installId}</td>
                        <td className="p-2.5 text-center font-bold">ด่าน {ev.levelId}</td>
                        <td className="p-2.5 text-center">{ev.attemptNo}</td>
                        <td className="p-2.5 text-right font-bold text-blue">{ev.score}</td>
                        <td className="p-2.5 text-center">
                          <span className="inline-flex items-center justify-center bg-navy text-gold px-1.5 py-0.5 rounded text-xs font-bold shadow-xs">
                            {"★".repeat(ev.stars)}
                          </span>
                        </td>
                        <td className="p-2.5 text-right">{Math.round(ev.elapsedMs / 1000)}วิ</td>
                        <td className="p-2.5 text-center">
                          {ev.hintsUsed} ใบ้ / {ev.wrongAttempts} ผิด
                        </td>
                        <td className="p-2.5 text-xs text-navy/70">
                          {errorList.length > 0 ? errorList.join(", ") : "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
