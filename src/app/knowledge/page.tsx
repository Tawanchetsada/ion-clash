"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../components/layout/AppHeader";
import { PageShell } from "../../components/layout/PageShell";

export default function KnowledgePage() {
  const router = useRouter();

  return (
    <PageShell>
      <AppHeader onHome={() => router.push("/")} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <div className="max-w-md rounded-card bg-white p-8 shadow-card border border-border">
          <span
            aria-hidden="true"
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green/10 text-2xl font-bold text-green"
          >
            🧪
          </span>
          <h1 className="text-2xl font-bold text-navy">ความรู้ก่อนเล่นเกม</h1>
          <p className="mt-2 text-sm text-navy/70">
            สรุปเนื้อหากฎการละลายน้ำและสมการไอออนิกกำลังอยู่ระหว่างการจัดทำเนื้อหา (Phase 8)
          </p>
          <div className="mt-6">
            <Link
              href="/levels"
              className="min-h-11 inline-flex items-center justify-center rounded-card bg-gold px-6 py-2 font-bold text-navy shadow-card hover:bg-gold/90"
            >
              ไปยังหน้าเลือกด่าน
            </Link>
          </div>
        </div>
      </main>
    </PageShell>
  );
}
