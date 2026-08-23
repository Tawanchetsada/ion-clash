"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../components/layout/AppHeader";
import { PageShell } from "../../components/layout/PageShell";
import { EquationView } from "../../components/game/EquationView";
import { solubilityTableView } from "../../presentation/solubility";
import { CheckIcon, FlaskIcon } from "../../components/ui/Icon";
import {
  getKnowledgeTopic1Examples,
  getKnowledgeTopic3Example,
  getKnowledgeTopic4Examples,
} from "../../presentation/knowledge";

export default function KnowledgePage() {
  const router = useRouter();
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({
    1: true,
    2: false,
    3: false,
    4: false,
  });

  const toggleSection = (index: number) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const rulesTable = solubilityTableView();
  const t1 = getKnowledgeTopic1Examples();
  const t3 = getKnowledgeTopic3Example();
  const t4 = getKnowledgeTopic4Examples();

  return (
    <PageShell>
      <AppHeader
        onHome={() => router.push("/")}
        onLevels={() => router.push("/levels")}
        onHowToPlay={() => router.push("/how-to-play")}
      />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-8 pb-28">
        <div className="text-center">
          <span
            aria-hidden="true"
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green/10 text-2xl text-green"
          >
            <FlaskIcon />
          </span>
          <h1 className="text-3xl font-bold text-navy">คลังความรู้เคมี ม.4</h1>
          <p className="mt-2 text-base text-navy/70">
            สรุปหลักการสำคัญเกี่ยวกับปฏิกิริยาการตกตะกอน กฎการละลายน้ำ และการเขียนสมการไอออนิกสุทธิ
          </p>
        </div>

        {/* 4 Accordion Sections */}
        <div className="flex flex-col gap-4">
          {/* หัวข้อ 1: การแตกตัวของสารละลาย */}
          <section className="overflow-hidden rounded-card border border-border bg-white shadow-card">
            <button
              type="button"
              onClick={() => toggleSection(1)}
              aria-expanded={openSections[1]}
              aria-controls="topic-1-content"
              className="flex w-full items-center justify-between bg-panel p-5 text-left font-bold text-navy transition-colors hover:bg-canvas"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue text-sm text-white">
                  1
                </span>
                <span className="text-lg">การแตกตัวของสารประกอบไอออนิกในน้ำ</span>
              </div>
              <span aria-hidden="true" className="text-xl text-navy/60">
                {openSections[1] ? "▲" : "▼"}
              </span>
            </button>

            {openSections[1] && (
              <div id="topic-1-content" className="space-y-4 p-6 text-navy/90">
                <p className="leading-relaxed">
                  สารประกอบไอออนิกที่<strong>ละลายน้ำได้ (aq)</strong> เมื่อละลายในน้ำ แรงดึงดูดระหว่างโมเลกุลของน้ำจะเอาชนะพันธะไอออนิก
                  ทำให้สารประกอบแตกตัวออกเป็น<strong>ไอออนบวก (แคตไอออน)</strong> และ<strong>ไอออนลบ (แอนไอออน)</strong> ที่เคลื่อนที่ได้อย่างอิสระในสารละลาย
                </p>

                <div className="rounded-card bg-canvas p-4 border border-border">
                  <h4 className="font-bold text-navy mb-2">ตัวอย่างการแตกตัว:</h4>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-base font-semibold">
                      <span>•</span>
                      <EquationView ast={t1.naclCompound} />
                      <span>(aq)</span>
                      <span>→</span>
                      <EquationView ast={t1.naIon} />
                      <span>(aq)</span>
                      <span>+</span>
                      <EquationView ast={t1.clIon} />
                      <span>(aq)</span>
                      <span className="text-xs text-navy/80 font-normal">
                        (อัตราส่วน 1 : 1 ได้อย่างละ 1 ไอออน)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-base font-semibold">
                      <span>•</span>
                      <EquationView ast={t1.cacl2Compound} />
                      <span>(aq)</span>
                      <span>→</span>
                      <EquationView ast={t1.caIon} />
                      <span>(aq)</span>
                      <span>+</span>
                      <EquationView ast={t1.twoClIon} />
                      <span>(aq)</span>
                      <span className="text-xs text-navy/80 font-normal">
                        (อัตราส่วน 1 : 2 ได้คลอไรด์ไอออน 2 ไอออน)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p>
                    <strong>ข้อสังเกตสำคัญ:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>ไอออนกลุ่มหลายอะตอม (Polyatomic Ion)</strong> เช่น ไนเตรต (<EquationView ast={t1.no3Ion} />),
                      ซัลเฟต หรือฟอสเฟต <strong>จะไม่แตกตัวต่อ</strong> แต่จะคงอยู่ทั้งกลุ่มก้อน
                    </li>
                    <li>
                      <strong>สารที่ไม่ละลายน้ำ (s)</strong> จะไม่แตกตัวเป็นไอออนในสารละลาย แต่จะจับตัวกันเป็นของแข็งตกตะกอนอยู่ก้นภาชนะ จึงต้องเขียนเป็นสูตรสารประกอบทั้งก้อนตามด้วยสถานะ (s) เสมอ
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </section>

          {/* หัวข้อ 2: กฎการละลาย */}
          <section className="overflow-hidden rounded-card border border-border bg-white shadow-card">
            <button
              type="button"
              onClick={() => toggleSection(2)}
              aria-expanded={openSections[2]}
              aria-controls="topic-2-content"
              className="flex w-full items-center justify-between bg-panel p-5 text-left font-bold text-navy transition-colors hover:bg-canvas"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue text-sm text-white">
                  2
                </span>
                <span className="text-lg">กฎการละลายน้ำของสารประกอบไอออนิก</span>
              </div>
              <span aria-hidden="true" className="text-xl text-navy/60">
                {openSections[2] ? "▲" : "▼"}
              </span>
            </button>

            {openSections[2] && (
              <div id="topic-2-content" className="space-y-4 p-6 text-navy/90">
                <div className="rounded-card bg-gold/15 p-4 border border-gold/40 text-sm">
                  <p className="font-bold text-navy mb-1">กฎครอบคลุมที่ต้องจำก่อน:</p>
                  <p>
                    เกลือของ <strong>Na⁺, K⁺, NH₄⁺</strong> และเกลือ<strong>ไนเตรต (NO₃⁻)</strong> ละลายน้ำได้ทั้งหมดโดยไม่มีข้อยกเว้น
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-panel text-navy font-bold">
                        <th className="py-2.5 px-3 w-16 text-center">ข้อ</th>
                        <th className="py-2.5 px-3">กฎการละลาย</th>
                        <th className="py-2.5 px-3 w-28 text-center">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rulesTable.map((rule) => (
                        <tr key={rule.order} className="hover:bg-canvas/50">
                          <td className="py-2.5 px-3 text-center font-bold text-navy/70">
                            {rule.order}
                          </td>
                          <td className="py-2.5 px-3 text-navy">{rule.descriptionTh}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                rule.outcomeTh === "ละลาย"
                                  ? "bg-blue/15 text-blue"
                                  : "bg-gold/30 text-navy font-semibold"
                              }`}
                            >
                              {rule.outcomeTh === "ละลาย" ? "ละลาย (aq)" : "ตะกอน (s)"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-navy/80">
                  * ลำดับของกฎมีความสำคัญมาก: หากมีหลายกฎที่ดูเหมือนจะใช้ได้ ให้ใช้กฎที่อยู่ข้อบนสุดเป็นหลักในการตัดสิน
                </p>
              </div>
            )}
          </section>

          {/* หัวข้อ 3: ไอออนผู้ชมและสมการไอออนิกสุทธิ */}
          <section className="overflow-hidden rounded-card border border-border bg-white shadow-card">
            <button
              type="button"
              onClick={() => toggleSection(3)}
              aria-expanded={openSections[3]}
              aria-controls="topic-3-content"
              className="flex w-full items-center justify-between bg-panel p-5 text-left font-bold text-navy transition-colors hover:bg-canvas"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue text-sm text-white">
                  3
                </span>
                <span className="text-lg">ไอออนผู้ชม (Spectator Ions) และสมการไอออนิกสุทธิ</span>
              </div>
              <span aria-hidden="true" className="text-xl text-navy/60">
                {openSections[3] ? "▲" : "▼"}
              </span>
            </button>

            {openSections[3] && (
              <div id="topic-3-content" className="space-y-4 p-6 text-navy/90">
                <p className="leading-relaxed">
                  <strong>ไอออนผู้ชม (Spectator Ions)</strong> คือ ไอออนที่อยู่ในสารละลายทั้งก่อนและหลังเกิดปฏิกิริยาโดยไม่เกิดการเปลี่ยนแปลงสถานะหรือจับตัวเป็นตะกอน
                  เมื่อเราตัดไอออนผู้ชมที่เหมือนกันทั้งสองข้างออก จะได้<strong>สมการไอออนิกสุทธิ (Net Ionic Equation)</strong> ซึ่งแสดงเฉพาะไอออนที่ทำปฏิกิริยาจริง
                </p>

                <div className="space-y-4 rounded-card bg-canvas p-5 border border-border">
                  <h4 className="font-bold text-navy">ตัวอย่างการเขียนสมการ 3 ขั้นตอน:</h4>

                  {/* ขั้น 1: สมการโมเลกุล */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-navy/70 uppercase">
                      1. สมการโมเลกุล (Molecular Equation):
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-sm font-bold bg-white p-3 rounded-card border border-border">
                      <EquationView ast={t3.reactantA.formula} />
                      <span className="font-normal text-navy/70">(aq)</span>
                      <span>+</span>
                      <EquationView ast={t3.reactantB.formula} />
                      <span className="font-normal text-navy/70">(aq)</span>
                      <span>→</span>
                      <span className="inline-flex items-center gap-1 bg-gold text-navy px-2 py-0.5 rounded-md font-bold shadow-xs">
                        <EquationView ast={t3.precipitate.formula} />
                        <span>(s)</span>
                      </span>
                      <span>+</span>
                      <span>2</span>
                      <EquationView ast={t3.aqueousProduct.formula} />
                      <span className="font-normal text-navy/70">(aq)</span>
                    </div>
                  </div>

                  {/* ขั้น 2: สมการไอออนิกสมบูรณ์ */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-navy/70 uppercase">
                      2. สมการไอออนิกสมบูรณ์ (Complete Ionic Equation):
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-sm bg-white p-3 rounded-card border border-border">
                      <span className="font-bold">Ca²⁺(aq)</span>
                      <span>+</span>
                      <span className="line-through text-navy/70 font-bold bg-error/10 px-1 rounded">2Cl⁻(aq)</span>
                      <span>+</span>
                      <span className="line-through text-navy/70 font-bold bg-error/10 px-1 rounded">2Na⁺(aq)</span>
                      <span>+</span>
                      <span className="font-bold">SO₄²⁻(aq)</span>
                      <span>→</span>
                      <span className="inline-flex items-center bg-gold text-navy px-1.5 py-0.5 rounded font-bold shadow-xs">CaSO₄(s)</span>
                      <span>+</span>
                      <span className="line-through text-navy/70 font-bold bg-error/10 px-1 rounded">2Na⁺(aq)</span>
                      <span>+</span>
                      <span className="line-through text-navy/70 font-bold bg-error/10 px-1 rounded">2Cl⁻(aq)</span>
                    </div>
                    <p className="text-xs text-error font-medium">
                      * ตัด 2Na⁺(aq) และ 2Cl⁻(aq) ออกทั้งสองข้างเนื่องจากเป็นไอออนผู้ชม
                    </p>
                  </div>

                  {/* ขั้น 3: สมการไอออนิกสุทธิ */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-green uppercase">
                      3. สมการไอออนิกสุทธิ (Net Ionic Equation):
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-base font-bold bg-green/10 text-green p-3 rounded-card border border-green/30">
                      <span>Ca²⁺(aq)</span>
                      <span>+</span>
                      <span>SO₄²⁻(aq)</span>
                      <span>→</span>
                      <span className="inline-flex items-center bg-gold text-navy px-2 py-0.5 rounded-md font-bold shadow-xs">CaSO₄(s)</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-card bg-panel p-4 text-xs text-navy/80 space-y-1">
                  <p className="font-bold text-navy">กติกาการตัดไอออนผู้ชม:</p>
                  <p>
                    จะตัดไอออนได้ก็ต่อเมื่อมี <strong>ชนิดเดียวกัน, ประจุเท่ากัน, สถานะเดียวกัน (aq), และจำนวนโมลเท่ากันทั้งสองข้างของสมการ</strong>
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* หัวข้อ 4: การดุลสมการ */}
          <section className="overflow-hidden rounded-card border border-border bg-white shadow-card">
            <button
              type="button"
              onClick={() => toggleSection(4)}
              aria-expanded={openSections[4]}
              aria-controls="topic-4-content"
              className="flex w-full items-center justify-between bg-panel p-5 text-left font-bold text-navy transition-colors hover:bg-canvas"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue text-sm text-white">
                  4
                </span>
                <span className="text-lg">การดุลสมการเคมีและอัตราส่วนอย่างต่ำ</span>
              </div>
              <span aria-hidden="true" className="text-xl text-navy/60">
                {openSections[4] ? "▲" : "▼"}
              </span>
            </button>

            {openSections[4] && (
              <div id="topic-4-content" className="space-y-4 p-6 text-navy/90">
                <p className="leading-relaxed">
                  การดุลสมการเคมีต้องยึดหลักสำคัญ 2 ประการตามกฎการอนุรักษ์มวลและประจุ:
                </p>

                <ol className="list-decimal pl-5 space-y-2 text-sm leading-relaxed">
                  <li>
                    <strong>จำนวนอะตอมของแต่ละธาตุต้องเท่ากันทั้งสองข้าง</strong> — อะตอมไม่สูญหายและไม่เกิดขึ้นใหม่
                  </li>
                  <li>
                    <strong>ผลรวมประจุไฟฟ้าต้องเท่ากันทั้งสองข้าง</strong> — เช่น หากฝั่งสารตั้งต้นมีประจุ (+2) + (-2) = 0 ฝั่งผลิตภัณฑ์ที่เป็นของแข็งก็ต้องมีประจุรวมเป็น 0 เช่นกัน
                  </li>
                  <li>
                    <strong>สัมประสิทธิ์ต้องเป็นอัตราส่วนจำนวนเต็มอย่างต่ำที่สุด</strong> — หากสมการดุลด้วยสัมประสิทธิ์ 2 : 2 : 2 : 2 จะต้องทอนเป็น 1 : 1 : 1 : 1 จึงจะถือว่าถูกต้องสมบูรณ์
                  </li>
                </ol>

                <div className="rounded-card bg-canvas p-4 border border-border text-sm">
                  <h4 className="font-bold text-navy mb-2">ทำไม 2 : 2 → 2 จึงยังไม่ถูกต้อง?</h4>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 font-semibold text-navy/80">
                      <span className="line-through flex items-center gap-1">
                        <EquationView ast={t4.twoAgIon} />
                        <span>(aq)</span>
                        <span>+</span>
                        <EquationView ast={t4.twoClIon} />
                        <span>(aq)</span>
                        <span>→</span>
                        <EquationView ast={t4.twoAgclCompound} />
                        <span>(s)</span>
                      </span>
                      <span className="text-xs text-error font-normal">(อัตราส่วน 2:2:2 ยังไม่ต่ำสุด)</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 font-bold text-green">
                      <EquationView ast={t4.agIon} />
                      <span>(aq)</span>
                      <span>+</span>
                      <EquationView ast={t4.clIon} />
                      <span>(aq)</span>
                      <span>→</span>
                      <EquationView ast={t4.agclCompound} />
                      <span>(s)</span>
                      <span className="inline-flex items-center gap-1 text-xs font-normal text-green"><CheckIcon />(อัตราส่วนอย่างต่ำ 1:1:1 ถูกต้อง)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Sticky Bottom Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-white/95 px-4 py-3 backdrop-blur shadow-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <span className="text-sm text-navy/70 hidden sm:inline">
            เข้าใจหลักการครบแล้ว พร้อมทดสอบความรู้ในเกมหรือยัง?
          </span>
          <Link
            href="/levels"
            className="min-h-11 inline-flex w-full sm:w-auto items-center justify-center rounded-card bg-gold px-8 py-3 font-bold text-navy shadow-card transition-colors hover:bg-gold/90"
          >
            เริ่มเล่นเลย
          </Link>
        </div>
      </footer>
    </PageShell>
  );
}
